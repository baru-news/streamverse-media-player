import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const telegramBotToken = Deno.env.get('TELEGRAM_BOT_TOKEN')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    date: number;
    text?: string;
  };
  chat_member?: {
    chat: {
      id: number;
    };
    from: {
      id: number;
    };
    date: number;
    old_chat_member: {
      status: string;
    };
    new_chat_member: {
      status: string;
    };
  };
}

async function sendTelegramMessage(chatId: number, text: string, replyToMessageId?: number) {
  const url = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      reply_to_message_id: replyToMessageId,
      parse_mode: 'HTML'
    })
  });
  return await response.json();
}

async function inviteUserToChat(chatId: number, userId: number) {
  const url = `https://api.telegram.org/bot${telegramBotToken}/approveChatJoinRequest`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      user_id: userId
    })
  });
  return await response.json();
}

async function generateInviteLink(chatId: number) {
  const url = `https://api.telegram.org/bot${telegramBotToken}/createChatInviteLink`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      expire_date: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
      member_limit: 1
    })
  });
  return await response.json();
}

async function handleLinkCommand(update: TelegramUpdate) {
  const message = update.message!;
  const telegramUserId = message.from.id;
  const telegramUsername = message.from.username;
  const chatId = message.chat.id;
  
  // Check if user already linked
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id, email, telegram_user_id')
    .eq('telegram_user_id', telegramUserId)
    .maybeSingle();

  if (existingProfile) {
    await sendTelegramMessage(
      chatId,
      `✅ Akun Anda sudah terhubung dengan email: <code>${existingProfile.email}</code>`,
      message.message_id
    );
    return;
  }

  // Generate a temporary link code
  const linkCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  // Store code in database
  const { error } = await supabase
    .from('telegram_link_codes')
    .insert({
      code: linkCode,
      telegram_user_id: telegramUserId,
      telegram_username: telegramUsername
    });

  if (error) {
    console.error('Error storing link code:', error);
    await sendTelegramMessage(
      chatId,
      `❌ Terjadi kesalahan saat membuat kode link. Silakan coba lagi.`,
      message.message_id
    );
    return;
  }
  
  console.log(`Link code for user ${telegramUserId}: ${linkCode}`);
  
  await sendTelegramMessage(
    chatId,
    `🔗 Untuk menghubungkan akun Telegram Anda dengan akun website, silakan:\n\n1. Login ke website\n2. Masukkan kode ini: <code>${linkCode}</code>\n\nKode berlaku selama 10 menit.`,
    message.message_id
  );
}

async function handlePremiumCommand(update: TelegramUpdate) {
  const message = update.message!;
  const telegramUserId = message.from.id;
  const chatId = message.chat.id;
  
  // Check premium status
  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      id, 
      email,
      premium_subscriptions(
        id,
        is_active,
        subscription_type,
        start_date,
        end_date
      )
    `)
    .eq('telegram_user_id', telegramUserId)
    .maybeSingle();

  if (!profile) {
    await sendTelegramMessage(
      chatId,
      `❌ Akun Telegram Anda belum terhubung. Gunakan command /link untuk menghubungkan akun.`,
      message.message_id
    );
    return;
  }

  const subscription = profile.premium_subscriptions?.[0];
  if (subscription?.is_active) {
    await sendTelegramMessage(
      chatId,
      `✅ Status Premium: Aktif\n📝 Tipe: ${subscription.subscription_type}\n📅 Mulai: ${new Date(subscription.start_date).toLocaleDateString('id-ID')}`,
      message.message_id
    );
  } else {
    await sendTelegramMessage(
      chatId,
      `❌ Status Premium: Tidak Aktif\n\n💰 Upgrade ke Premium untuk akses fitur eksklusif!`,
      message.message_id
    );
  }
}

async function handleChatMemberUpdate(update: TelegramUpdate) {
  const chatMember = update.chat_member!;
  const userId = chatMember.from.id;
  const chatId = chatMember.chat.id;
  
  if (chatMember.new_chat_member.status === 'member' && 
      chatMember.old_chat_member.status !== 'member') {
    // User joined the group
    console.log(`User ${userId} joined chat ${chatId}`);
    
    // Update invitation status
    await supabase
      .from('telegram_invitations')
      .update({ 
        invitation_status: 'joined',
        joined_at: new Date().toISOString()
      })
      .eq('telegram_user_id', userId)
      .eq('chat_id', chatId);
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const update: TelegramUpdate = await req.json();
    console.log('Received Telegram update:', JSON.stringify(update));

    // Handle chat member updates (when someone joins/leaves)
    if (update.chat_member) {
      await handleChatMemberUpdate(update);
      return new Response('OK', { headers: corsHeaders });
    }

    // Handle messages
    if (update.message?.text) {
      const text = update.message.text;
      
      if (text === '/link' || text === '/link@your_bot_username') {
        await handleLinkCommand(update);
      } else if (text === '/premium' || text === '/premium@your_bot_username') {
        await handlePremiumCommand(update);
      } else if (text === '/start') {
        await sendTelegramMessage(
          update.message.chat.id,
          `👋 Selamat datang!\n\nCommand yang tersedia:\n/link - Hubungkan akun Telegram dengan website\n/premium - Cek status premium Anda`,
          update.message.message_id
        );
      }
    }

    return new Response('OK', { headers: corsHeaders });
  } catch (error) {
    console.error('Error processing Telegram webhook:', error);
    return new Response('Error', { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});