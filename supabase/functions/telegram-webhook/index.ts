import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const telegramBotToken = Deno.env.get('TELEGRAM_BOT_TOKEN') ?? '';

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from?: {
      id: number;
      username?: string;
      first_name?: string;
    };
    chat: {
      id: number;
      type: string;
      title?: string;
    };
    text?: string;
    video?: {
      file_id: string;
      file_unique_id: string;
      width: number;
      height: number;
      duration: number;
      file_name?: string;
      mime_type?: string;
      file_size?: number;
    };
    document?: {
      file_id: string;
      file_unique_id: string;
      file_name?: string;
      mime_type?: string;
      file_size?: number;
    };
  };
  chat_member?: {
    chat: {
      id: number;
    };
    from: {
      id: number;
      username?: string;
    };
    new_chat_member: {
      user: {
        id: number;
        username?: string;
      };
      status: string;
    };
  };
}

async function getTelegramFile(fileId: string) {
  const response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/getFile?file_id=${fileId}`);
  const data = await response.json();

  if (!data.ok) {
    throw new Error(`Telegram API error: ${data.description}`);
  }

  const filePath = data.result.file_path;
  const fileUrl = `https://api.telegram.org/file/bot${telegramBotToken}/${filePath}`;
  return fileUrl;
}

async function downloadFile(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
  }
  return await response.arrayBuffer();
}

async function sendTelegramMessage(chatId: number, text: string, replyToMessageId?: number) {
  const response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      reply_to_message_id: replyToMessageId,
    }),
  });

  const data = await response.json();
  if (!data.ok) {
    console.error('Telegram API error:', data);
    throw new Error(`Failed to send message: ${data.description}`);
  }
}

async function handleChatMemberUpdate(update: TelegramUpdate) {
  const chatId = update.chat_member!.chat.id;
  const newStatus = update.chat_member!.new_chat_member.status;
  const userId = update.chat_member!.new_chat_member.user.id;
  const username = update.chat_member!.new_chat_member.user.username;

  console.log(`Chat member update - Chat: ${chatId}, User: ${userId}, Status: ${newStatus}`);

  if (newStatus === 'member' || newStatus === 'administrator') {
    // Update user profile in profiles table
    const { data, error } = await supabase
      .from('profiles')
      .update({ telegram_user_id: userId, telegram_username: username })
      .eq('telegram_user_id', userId);

    if (error) {
      console.error('Supabase update error:', error);
      await sendTelegramMessage(chatId, `❌ Gagal update user: ${error.message}`);
    } else {
      await sendTelegramMessage(chatId, `✅ User ${username || userId} berhasil ditambahkan!`);
    }
  }
}

async function handleLinkCommand(update: TelegramUpdate) {
  const chatId = update.message!.chat.id;
  const userId = update.message!.from!.id;
  const username = update.message!.from!.username;

  console.log(`Link command from user ${userId} (${username})`);

  try {
    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Save to telegram_link_codes table
    const { error: codeError } = await supabase
      .from('telegram_link_codes')
      .insert({
        code: code,
        telegram_user_id: userId,
        telegram_username: username,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
      });

    if (codeError) {
      console.error('Error saving verification code:', codeError);
      await sendTelegramMessage(chatId, `❌ Gagal membuat kode verifikasi: ${codeError.message}`);
      return;
    }

    await sendTelegramMessage(chatId, 
      `🔗 Kode verifikasi akun Telegram:\n\n` +
      `📱 Kode: \`${code}\`\n\n` +
      `⏰ Kode berlaku 10 menit\n` +
      `💻 Masukkan kode ini di website untuk menghubungkan akun Telegram Anda`
    );
  } catch (error) {
    console.error('Link command error:', error);
    await sendTelegramMessage(chatId, `❌ Terjadi kesalahan: ${error.message}`);
  }
}

async function handlePremiumCommand(update: TelegramUpdate) {
  const chatId = update.message!.chat.id;
  const userId = update.message!.from!.id;
  const username = update.message!.from!.username;

  console.log(`Premium command from user ${userId} (${username})`);

  try {
    // First find user profile by telegram_user_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, telegram_username')
      .eq('telegram_user_id', userId)
      .maybeSingle();

    if (profileError) {
      console.error('Error finding user profile:', profileError);
      await sendTelegramMessage(chatId, `❌ Error cek profil: ${profileError.message}`);
      return;
    }

    if (!profile) {
      await sendTelegramMessage(chatId, 
        `❌ Akun belum terhubung!\n\n` +
        `🔗 Ketik /link untuk menghubungkan akun Telegram dengan website`
      );
      return;
    }

    // Check premium subscription using profile.id (not telegram user id)
    const { data: premiums, error: premiumError } = await supabase
      .from('premium_subscriptions')
      .select('subscription_type, is_active, start_date, end_date')
      .eq('user_id', profile.id)
      .eq('is_active', true);

    if (premiumError) {
      console.error('Error checking premium status:', premiumError);
      await sendTelegramMessage(chatId, `❌ Error cek premium: ${premiumError.message}`);
      return;
    }

    if (premiums && premiums.length > 0) {
      const premium = premiums[0];
      const endDate = premium.end_date ? new Date(premium.end_date).toLocaleDateString('id-ID') : 'Selamanya';
      
      await sendTelegramMessage(chatId, 
        `✨ Status Premium Aktif!\n\n` +
        `👤 User: ${profile.username || profile.telegram_username}\n` +
        `📦 Paket: ${premium.subscription_type}\n` +
        `📅 Berlaku hingga: ${endDate}\n\n` +
        `🎉 Nikmati akses premium Anda!`
      );
    } else {
      await sendTelegramMessage(chatId, 
        `❌ Belum berlangganan premium\n\n` +
        `👤 User: ${profile.username || profile.telegram_username}\n\n` +
        `💎 Upgrade ke premium di website untuk akses unlimited!`
      );
    }
  } catch (error) {
    console.error('Premium command error:', error);
    await sendTelegramMessage(chatId, `❌ Terjadi kesalahan: ${error.message}`);
  }
}

// Upload file buffer to both Doodstream accounts
async function uploadToBothDoodstream(fileBuffer: ArrayBuffer, fileName: string, title?: string): Promise<any> {
  try {
    const response = await supabase.functions.invoke('doodstream-premium', {
      body: {
        action: 'upload_dual',
        fileBuffer: Array.from(new Uint8Array(fileBuffer)),
        fileName,
        title
      }
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    return response.data;
  } catch (error) {
    console.error('Error uploading to Doodstream accounts:', error);
    throw error;
  }
}

async function handleVideoUpload(update: TelegramUpdate) {
  const message = update.message!;
  const chatId = message.chat.id;

  // Only allow uploads from specific groups/admins
  const allowedChatIds = [parseInt(Deno.env.get('TELEGRAM_GROUP_ID') ?? ''), parseInt(Deno.env.get('TELEGRAM_ADMIN_ID') ?? '')];
  if (!allowedChatIds.includes(chatId)) {
    console.warn(`Unauthorized chat ID: ${chatId}`);
    return;
  }

  // Check if the user is an admin
  const adminUserIds = Deno.env.get('TELEGRAM_ADMIN_IDS')?.split(',').map(id => parseInt(id.trim())) || [];
  if (message.from && !adminUserIds.includes(message.from.id)) {
    console.warn(`Unauthorized user ID: ${message.from.id}`);
    return;
  }

  try {
    const telegramFile = message.video || message.document;
    if (!telegramFile) {
      console.warn('No video or document found in message');
      return;
    }

    const fileUrl = await getTelegramFile(telegramFile.file_id);
    const fileBuffer = await downloadFile(fileUrl);
    const fileName = telegramFile.file_name || `video_${telegramFile.file_unique_id}`;
    const videoTitle = message.text || fileName;

    // Upload to both Doodstream accounts
    console.log('Uploading to both Doodstream accounts...');
    const uploadResult = await uploadToBothDoodstream(fileBuffer, fileName, videoTitle);

    // Prepare upload status and file codes
    const hasErrors = uploadResult.hasErrors || false;
    const uploadStatus = {
      regular: uploadResult.results.regular ? 'success' : 'failed',
      premium: uploadResult.results.premium ? 'success' : 'failed'
    };
    
    const failedUploads = hasErrors ? uploadResult.errors : {};

    // Save to database with dual file codes
    const { data: videoData, error: dbError } = await supabase
      .from('videos')
      .insert({
        title: videoTitle,
        description: `Uploaded from Telegram by ${update.message.from?.username || 'Unknown'}`,
        file_code: uploadResult.results.regular?.file_code || null,
        regular_file_code: uploadResult.results.regular?.file_code || null,
        premium_file_code: uploadResult.results.premium?.file_code || null,
        doodstream_file_code: uploadResult.results.regular?.file_code || uploadResult.results.premium?.file_code,
        file_size: telegramFile.file_size,
        status: 'active',
        upload_date: new Date().toISOString(),
        provider: 'doodstream',
        upload_status: uploadStatus,
        failed_uploads: failedUploads
      })
      .select()
      .single();

    if (dbError) throw dbError;

    // Send success/partial success message with retry buttons for failures
    let successMessage = '';
    
    if (!hasErrors) {
      successMessage = `✅ Video berhasil diupload ke kedua akun!\n\n📝 Judul: ${videoTitle}\n🔗 Link: https://your-site.com/video/${videoData.id}`;
      successMessage += `\n📁 Regular: ${uploadResult.results.regular?.file_code}`;
      successMessage += `\n✨ Premium: ${uploadResult.results.premium?.file_code}`;
    } else {
      // Create inline keyboard for retry options
      const keyboard = {
        inline_keyboard: []
      };
      
      successMessage = `⚠️ Video diupload dengan masalah:\n\n📝 Judul: ${videoTitle}`;
      
      if (uploadResult.results.regular?.file_code) {
        successMessage += `\n✅ Regular: ${uploadResult.results.regular.file_code}`;
      } else {
        successMessage += `\n❌ Regular: ${uploadResult.errors.regular}`;
        keyboard.inline_keyboard.push([{
          text: "🔄 Retry Regular Upload", 
          callback_data: `retry_regular_${videoData.id}`
        }]);
      }
      
      if (uploadResult.results.premium?.file_code) {
        successMessage += `\n✅ Premium: ${uploadResult.results.premium.file_code}`;
      } else {
        successMessage += `\n❌ Premium: ${uploadResult.errors.premium}`;
        keyboard.inline_keyboard.push([{
          text: "🔄 Retry Premium Upload", 
          callback_data: `retry_premium_${videoData.id}`
        }]);
      }
      
      successMessage += '\n\n🔄 Gunakan tombol di bawah untuk retry yang gagal.';

      // Send message with inline keyboard
      await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: successMessage,
          reply_to_message_id: update.message.message_id,
          reply_markup: keyboard
        })
      });
      return;
    }

    // Log failed uploads for admin follow-up
    if (hasErrors) {
      for (const [accountType, error] of Object.entries(uploadResult.errors)) {
        await supabase.from('upload_failures').insert({
          video_id: videoData.id,
          upload_type: accountType,
          attempt_count: 1,
          error_details: { error, telegram_file: telegramFile },
          requires_manual_upload: false
        });
      }
    }

    await sendTelegramMessage(chatId, successMessage, update.message.message_id);

  } catch (error) {
    console.error('Error uploading video:', error);
    await sendTelegramMessage(chatId, `❌ Gagal mengunggah video: ${error.message}`, update.message.message_id);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const update: TelegramUpdate = await req.json();
    
    if (update.chat_member) {
      await handleChatMemberUpdate(update);
    } else if (update.message?.video || update.message?.document) {
      await handleVideoUpload(update);
    } else if (update.message?.text) {
      const text = update.message.text.toLowerCase();
      const chatId = update.message.chat.id;
      
      if (text.startsWith('/start')) {
        await sendTelegramMessage(chatId, 
          `🤖 Selamat datang di Bot Premium!\n\n` +
          `✨ Perintah yang tersedia:\n` +
          `/link - Hubungkan akun Telegram ke website\n` +
          `/premium - Cek status premium Anda\n` +
          `/help - Tampilkan pesan bantuan ini\n\n` +
          `📞 Butuh bantuan? Hubungi admin!`
        );
      } else if (text.startsWith('/help')) {
        await sendTelegramMessage(chatId,
          `📖 Panduan Bot Premium:\n\n` +
          `🔗 /link\n` +
          `   Menghubungkan akun Telegram Anda dengan website.\n` +
          `   Bot akan memberikan kode 6 digit yang harus dimasukkan di website.\n\n` +
          `💎 /premium\n` +
          `   Mengecek status berlangganan premium Anda.\n` +
          `   Pastikan akun sudah terhubung dengan /link terlebih dahulu.\n\n` +
          `🏁 /start\n` +
          `   Menampilkan pesan selamat datang.\n\n` +
          `❓ Masalah?\n` +
          `   Pastikan akun Telegram sudah terhubung ke website sebelum menggunakan fitur premium.`
        );
      } else if (text.startsWith('/link')) {
        await handleLinkCommand(update);
      } else if (text.startsWith('/premium')) {
        await handlePremiumCommand(update);
      } else if (text.startsWith('/')) {
        // Unknown command
        await sendTelegramMessage(chatId,
          `❓ Perintah tidak dikenali.\n\n` +
          `Ketik /help untuk melihat perintah yang tersedia.`
        );
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
