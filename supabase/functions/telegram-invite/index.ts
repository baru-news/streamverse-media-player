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

// Create Telegram invite link with enhanced security
async function createTelegramInviteLink(chatId: number, userId: number): Promise<{ success: boolean; invite_link?: string; error?: string }> {
  try {
    const response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/createChatInviteLink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        name: `Premium-User-${userId}-${Date.now()}`, // Unique name per user
        expire_date: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
        member_limit: 1, // Single use
        creates_join_request: false
      }),
    });

    const data = await response.json();
    
    if (data.ok) {
      return { success: true, invite_link: data.result.invite_link };
    } else {
      console.error('Telegram API error:', data);
      return { success: false, error: data.description || 'Failed to create invite link' };
    }
  } catch (error) {
    console.error('Error creating Telegram invite link:', error);
    return { success: false, error: 'Network error creating invite link' };
  }
}

// Send message to user
async function sendTelegramMessage(chatId: number, text: string): Promise<any> {
  try {
    const response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML'
      }),
    });
    
    const data = await response.json();
    if (!data.ok) {
      console.error('Error sending Telegram message:', data);
    }
    return data;
  } catch (error) {
    console.error('Error sending Telegram message:', error);
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, telegram_username, premium_group_id } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!premium_group_id) {
      return new Response(
        JSON.stringify({ error: 'Premium group ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Enhanced user validation - fetch profile with Telegram data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('telegram_username, telegram_user_id, telegram_chat_id')
      .eq('id', user_id)
      .single();

    if (profileError || !profile) {
      console.error('Profile fetch error:', profileError);
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Strict validation: user must have linked Telegram account
    if (!profile.telegram_user_id || !profile.telegram_username) {
      const errorMsg = 'User must link their Telegram account before premium invitation';
      console.error('Telegram validation failed:', { user_id, profile });
      
      // Log failed invitation attempt
      await supabase.from('telegram_invitations').insert({
        user_id: user_id,
        telegram_user_id: profile.telegram_user_id || 0,
        chat_id: premium_group_id,
        invitation_status: 'failed',
        error_message: errorMsg
      });

      return new Response(
        JSON.stringify({ error: errorMsg }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user has premium access
    const { data: subscription, error: subError } = await supabase
      .from('premium_subscriptions')
      .select('is_active')
      .eq('user_id', user_id)
      .eq('is_active', true)
      .single();

    if (subError || !subscription) {
      const errorMsg = 'User does not have active premium subscription';
      console.error('Subscription validation failed:', { user_id, subError });
      
      await supabase.from('telegram_invitations').insert({
        user_id: user_id,
        telegram_user_id: profile.telegram_user_id,
        chat_id: premium_group_id,
        invitation_status: 'failed',
        error_message: errorMsg
      });

      return new Response(
        JSON.stringify({ error: errorMsg }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update profile with telegram_username if provided but use existing telegram_user_id
    if (telegram_username && telegram_username !== profile.telegram_username) {
      await supabase
        .from('profiles')
        .update({ telegram_username: telegram_username })
        .eq('id', user_id);
    }

    // Create single-use invite link
    const inviteResult = await createTelegramInviteLink(premium_group_id, profile.telegram_user_id);
    
    let invitationStatus = 'pending';
    let errorMessage = null;

    if (inviteResult.success && inviteResult.invite_link) {
      // Log successful invitation
      const { data: invitationData, error: invitationError } = await supabase
        .from('telegram_invitations')
        .insert({
          user_id: user_id,
          telegram_user_id: profile.telegram_user_id,
          chat_id: premium_group_id,
          invitation_status: 'sent'
        })
        .select()
        .single();

      // Send welcome message with invite link if user has telegram_chat_id
      if (profile.telegram_chat_id) {
        const welcomeMessage = `🎉 <b>Welcome to Premium!</b>

Your premium subscription has been approved! 

Click the link below to join our exclusive premium channel:
${inviteResult.invite_link}

⚡ Your premium benefits:
• Exclusive content and early access
• 2x Kitty Key rewards (permanent)
• Premium member badge
• Priority support

<i>Note: This invitation link is single-use and expires in 7 days.</i>`;

        await sendTelegramMessage(profile.telegram_chat_id, welcomeMessage);
        console.log(`Welcome message sent to user ${user_id} at chat ${profile.telegram_chat_id}`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Telegram invitation sent successfully',
          invite_link: inviteResult.invite_link,
          status: profile.telegram_chat_id ? 'Message sent to user' : 'Invite link generated (no chat ID for direct message)'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      invitationStatus = 'failed';
      errorMessage = inviteResult.error || 'Failed to create invite link';
      
      // Log failed invitation
      await supabase.from('telegram_invitations').insert({
        user_id: user_id,
        telegram_user_id: profile.telegram_user_id,
        chat_id: premium_group_id,
        invitation_status: invitationStatus,
        error_message: errorMessage
      });

      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Internal server error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});