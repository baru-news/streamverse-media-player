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

async function createTelegramInviteLink(chatId: number, userId: number) {
  try {
    const url = `https://api.telegram.org/bot${telegramBotToken}/createChatInviteLink`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        expire_date: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
        member_limit: 1,
        name: `Premium invitation for user ${userId}`
      })
    });

    const result = await response.json();
    if (result.ok) {
      return { success: true, invite_link: result.result.invite_link };
    } else {
      return { success: false, error: result.description };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function sendTelegramMessage(chatId: number, text: string) {
  try {
    const url = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML'
      })
    });
    return await response.json();
  } catch (error) {
    console.error('Error sending Telegram message:', error);
    return { ok: false, error: error.message };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, telegram_username, premium_group_id } = await req.json();

    if (!user_id || !premium_group_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, telegram_user_id, telegram_username')
      .eq('id', user_id)
      .maybeSingle();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'User not found' }), 
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Update telegram_username if provided and not already set
    if (telegram_username && !profile.telegram_username) {
      await supabase
        .from('profiles')
        .update({ telegram_username })
        .eq('id', user_id);
    }

    // Create invitation link
    const inviteResult = await createTelegramInviteLink(premium_group_id, profile.telegram_user_id || 0);

    if (!inviteResult.success) {
      // Log the invitation attempt
      await supabase
        .from('telegram_invitations')
        .insert({
          user_id: user_id,
          telegram_user_id: profile.telegram_user_id || 0,
          chat_id: premium_group_id,
          invitation_status: 'failed',
          error_message: inviteResult.error
        });

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to create invitation link',
          details: inviteResult.error 
        }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Record the invitation
    await supabase
      .from('telegram_invitations')
      .insert({
        user_id: user_id,
        telegram_user_id: profile.telegram_user_id || 0,
        chat_id: premium_group_id,
        invitation_status: 'sent'
      });

    // If user has telegram_user_id, send them a direct message with the link
    if (profile.telegram_user_id) {
      const welcomeMessage = `🎉 Selamat! Permintaan premium Anda telah disetujui!\n\n🔗 Klik link berikut untuk bergabung dengan grup premium:\n${inviteResult.invite_link}\n\n✨ Selamat menikmati fitur premium!`;
      
      await sendTelegramMessage(profile.telegram_user_id, welcomeMessage);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        invite_link: inviteResult.invite_link,
        telegram_user_id: profile.telegram_user_id,
        message: profile.telegram_user_id ? 'Invitation sent to user via Telegram' : 'Invitation link created (user will need to use /link command first)'
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in telegram-invite function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});