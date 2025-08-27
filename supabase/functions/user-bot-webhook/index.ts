import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, ...params } = await req.json();

    console.log(`🤖 User Bot Webhook - Action: ${action}`);

    switch (action) {
      case 'check_premium_group':
        return await handleCheckPremiumGroup(supabase, params);
      
      case 'process_upload':
        return await handleProcessUpload(supabase, params);
      
      case 'update_upload_status':
        return await handleUpdateUploadStatus(supabase, params);
      
      case 'create_video_record':
        return await handleCreateVideoRecord(supabase, params);
      
      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Unknown action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('Error in user-bot-webhook:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleCheckPremiumGroup(supabase: any, params: any) {
  const { chat_id } = params;

  if (!chat_id) {
    return new Response(
      JSON.stringify({ success: false, error: 'chat_id is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { data, error } = await supabase
      .from('premium_groups')
      .select('*')
      .eq('chat_id', chat_id)
      .eq('auto_upload_enabled', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    const isPremium = !!data;

    console.log(`📊 Premium group check for ${chat_id}: ${isPremium ? 'YES' : 'NO'}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        is_premium: isPremium,
        group_info: data || null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error checking premium group:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function handleProcessUpload(supabase: any, params: any) {
  const { 
    telegram_chat_id, 
    telegram_message_id, 
    telegram_user_id, 
    telegram_file_id,
    telegram_file_unique_id,
    original_filename,
    file_size,
    mime_type
  } = params;

  try {
    // Create upload record
    const { data: uploadData, error: uploadError } = await supabase
      .from('telegram_uploads')
      .insert({
        telegram_chat_id,
        telegram_message_id,
        telegram_user_id,
        telegram_file_id,
        telegram_file_unique_id,
        original_filename,
        file_size,
        mime_type,
        upload_status: 'processing'
      })
      .select()
      .single();

    if (uploadError) {
      throw uploadError;
    }

    console.log(`📤 Created upload record: ${uploadData.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        upload_id: uploadData.id,
        message: 'Upload record created successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing upload:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function handleUpdateUploadStatus(supabase: any, params: any) {
  const { upload_id, status, error_message, doodstream_file_code } = params;

  try {
    const updateData: any = {
      upload_status: status,
      processed_at: new Date().toISOString()
    };

    if (error_message) {
      updateData.error_message = error_message;
    }

    if (doodstream_file_code) {
      updateData.doodstream_file_code = doodstream_file_code;
    }

    const { error } = await supabase
      .from('telegram_uploads')
      .update(updateData)
      .eq('id', upload_id);

    if (error) {
      throw error;
    }

    console.log(`📊 Updated upload status: ${upload_id} -> ${status}`);

    return new Response(
      JSON.stringify({ success: true, message: 'Upload status updated' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error updating upload status:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function handleCreateVideoRecord(supabase: any, params: any) {
  const { 
    title, 
    file_code, 
    regular_file_code, 
    premium_file_code, 
    file_size, 
    duration,
    telegram_upload_id
  } = params;

  try {
    // Check if video already exists
    const { data: existingVideo } = await supabase
      .from('videos')
      .select('id')
      .eq('file_code', file_code)
      .single();

    if (existingVideo) {
      console.log(`📹 Video already exists: ${existingVideo.id}`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          video_id: existingVideo.id,
          message: 'Video already exists'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create new video record
    const videoData: any = {
      title: title || 'Untitled Video',
      file_code,
      doodstream_file_code: file_code,
      file_size,
      status: 'processing',
      upload_status: {
        regular: regular_file_code ? 'completed' : 'pending',
        premium: premium_file_code ? 'completed' : 'pending'
      }
    };

    if (regular_file_code) {
      videoData.regular_file_code = regular_file_code;
    }

    if (premium_file_code) {
      videoData.premium_file_code = premium_file_code;
    }

    if (duration) {
      videoData.duration = duration;
    }

    const { data: newVideo, error: videoError } = await supabase
      .from('videos')
      .insert(videoData)
      .select()
      .single();

    if (videoError) {
      throw videoError;
    }

    // Update telegram upload with video ID
    if (telegram_upload_id) {
      await supabase
        .from('telegram_uploads')
        .update({ video_id: newVideo.id })
        .eq('id', telegram_upload_id);
    }

    console.log(`📹 Created video record: ${newVideo.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        video_id: newVideo.id,
        message: 'Video record created successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating video record:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}