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
      title?: string;
    };
    date: number;
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

// Helper function to sanitize and create unique filename
function sanitizeFilename(filename: string): string {
  // Remove unsafe characters and limit length
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 100);
}

function generateUniqueTitle(originalName?: string, chatId?: number, userId?: number): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  
  if (originalName && originalName.trim() !== '') {
    const cleanName = sanitizeFilename(originalName);
    return `${timestamp}_${randomString}_${cleanName}`;
  }
  
  // Fallback with chat/user info
  const prefix = chatId ? `TG_${Math.abs(chatId)}_` : 'TG_';
  const userSuffix = userId ? `_U${Math.abs(userId)}` : '';
  return `${prefix}${timestamp}_${randomString}${userSuffix}`;
}

async function downloadTelegramFile(fileId: string): Promise<{ buffer: ArrayBuffer; fileName: string; mimeType: string; }> {
  console.log(`Downloading Telegram file: ${fileId}`);
  
  // Get file info from Telegram
  const fileInfoUrl = `https://api.telegram.org/bot${telegramBotToken}/getFile?file_id=${fileId}`;
  const fileInfoResponse = await fetch(fileInfoUrl);
  const fileInfo = await fileInfoResponse.json();
  
  console.log(`Telegram file info:`, fileInfo);
  
  if (!fileInfo.ok) {
    throw new Error(`Failed to get file info: ${fileInfo.description}`);
  }
  
  // Download file from Telegram
  const fileUrl = `https://api.telegram.org/file/bot${telegramBotToken}/${fileInfo.result.file_path}`;
  console.log(`Downloading from URL: ${fileUrl}`);
  
  const fileResponse = await fetch(fileUrl);
  
  if (!fileResponse.ok) {
    throw new Error(`Failed to download file: ${fileResponse.statusText}`);
  }
  
  const buffer = await fileResponse.arrayBuffer();
  const fileName = fileInfo.result.file_path.split('/').pop() || 'video';
  const mimeType = 'video/mp4'; // Default for videos
  
  console.log(`Downloaded file - Size: ${buffer.byteLength} bytes, Name: ${fileName}`);
  
  return { buffer, fileName, mimeType };
}

async function uploadToDoodstream(fileBuffer: ArrayBuffer, fileName: string, title?: string): Promise<any> {
  console.log(`Preparing upload to Doodstream - File: ${fileName}, Title: ${title}`);
  
  const blob = new Blob([fileBuffer]);
  const file = new File([blob], fileName);
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', title || fileName);
  
  console.log(`FormData prepared - File size: ${file.size}, Name: ${file.name}, Title: ${title}`);
  
  const response = await supabase.functions.invoke('doodstream-api', {
    body: formData
  });
  
  console.log(`Doodstream API response:`, response);
  
  if (response.error) {
    console.error(`Doodstream upload error:`, response.error);
    throw new Error(`Doodstream upload failed: ${response.error.message}`);
  }
  
  console.log(`Upload successful - File code: ${response.data?.file_code}`);
  return response.data;
}

async function handleVideoUpload(update: TelegramUpdate) {
  const message = update.message!;
  const telegramUserId = message.from.id;
  const chatId = message.chat.id;
  const messageId = message.message_id;
  
  // Check if user is admin
  const { data: isAdmin } = await supabase.rpc('is_telegram_admin', {
    telegram_user_id_param: telegramUserId
  });
  
  if (!isAdmin) {
    await sendTelegramMessage(
      chatId,
      `❌ Hanya admin yang dapat mengunggah video.`,
      messageId
    );
    return;
  }
  
  // Check if chat is premium group with auto-upload enabled
  const { data: isPremiumGroup } = await supabase.rpc('is_premium_group_with_autoupload', {
    chat_id_param: chatId
  });
  
  if (!isPremiumGroup) {
    await sendTelegramMessage(
      chatId,
      `❌ Auto-upload tidak diaktifkan untuk grup ini.`,
      messageId
    );
    return;
  }
  
  const fileInfo = message.video || message.document;
  if (!fileInfo) {
    return;
  }
  
  // Check for duplicate
  const { data: existingUpload } = await supabase
    .from('telegram_uploads')
    .select('id')
    .eq('telegram_file_unique_id', fileInfo.file_unique_id)
    .maybeSingle();
    
  if (existingUpload) {
    await sendTelegramMessage(
      chatId,
      `⚠️ File ini sudah pernah diunggah sebelumnya.`,
      messageId
    );
    return;
  }
  
  // Send processing message
  await sendTelegramMessage(
    chatId,
    `⏳ Sedang memproses upload video...`,
    messageId
  );
  
  try {
    // Generate unique title with better naming logic
    const uniqueTitle = generateUniqueTitle(fileInfo.file_name, chatId, telegramUserId);
    console.log(`Generated unique title: ${uniqueTitle} from original: ${fileInfo.file_name}`);
    
    // Record upload attempt in database with enhanced tracking
    const { data: uploadRecord, error: insertError } = await supabase
      .from('telegram_uploads')
      .insert({
        telegram_file_id: fileInfo.file_id,
        telegram_file_unique_id: fileInfo.file_unique_id,
        telegram_message_id: messageId,
        telegram_chat_id: chatId,
        telegram_user_id: telegramUserId,
        original_filename: fileInfo.file_name || 'unknown',
        file_size: fileInfo.file_size || 0,
        mime_type: fileInfo.mime_type || 'video/mp4',
        upload_status: 'processing'
      })
      .select('id')
      .single();
      
    if (insertError) {
      console.error('Error inserting upload record:', insertError);
      throw new Error('Database error');
    }
    
    console.log(`Upload record created with ID: ${uploadRecord.id}`);
    
    // Download file from Telegram
    const { buffer, fileName } = await downloadTelegramFile(fileInfo.file_id);
    
    // Create sanitized filename for file object
    const sanitizedFileName = sanitizeFilename(fileName);
    console.log(`Sanitized filename: ${sanitizedFileName}`);
    
    // Upload to Doodstream with unique title
    const doodstreamResult = await uploadToDoodstream(buffer, sanitizedFileName, uniqueTitle);
    
    // Update upload record with success and processed filename
    const updateResult = await supabase
      .from('telegram_uploads')
      .update({
        doodstream_file_code: doodstreamResult.file_code,
        upload_status: 'completed',
        processed_at: new Date().toISOString()
      })
      .eq('id', uploadRecord.id);
      
    console.log(`Upload record updated:`, updateResult);
      
    // Send success message with processed title
    await sendTelegramMessage(
      chatId,
      `✅ Video berhasil diunggah!\n📹 Judul: ${uniqueTitle}\n📝 File asli: ${fileInfo.file_name || 'tidak ada nama'}\n🔗 File Code: ${doodstreamResult.file_code}`,
      messageId
    );
    
    console.log(`Upload completed successfully for file: ${uniqueTitle}`);
    
  } catch (error) {
    console.error('Error uploading video:', error);
    
    // Update upload record with error
    await supabase
      .from('telegram_uploads')
      .update({
        upload_status: 'failed',
        error_message: error.message,
        processed_at: new Date().toISOString()
      })
      .eq('telegram_file_unique_id', fileInfo.file_unique_id);
      
    await sendTelegramMessage(
      chatId,
      `❌ Gagal mengunggah video: ${error.message}`,
      messageId
    );
  }
}

async function handleAddPremiumGroupCommand(update: TelegramUpdate) {
  const message = update.message!;
  const telegramUserId = message.from.id;
  const chatId = message.chat.id;
  const chatTitle = message.chat.title || 'Unknown Group';
  
  // Check if user is admin
  const { data: isAdmin } = await supabase.rpc('is_telegram_admin', {
    telegram_user_id_param: telegramUserId
  });
  
  if (!isAdmin) {
    await sendTelegramMessage(
      chatId,
      `❌ Hanya admin yang dapat mengelola grup premium.`,
      message.message_id
    );
    return;
  }
  
  // Add group to premium groups
  const { error } = await supabase
    .from('premium_groups')
    .upsert({
      chat_id: chatId,
      chat_title: chatTitle,
      auto_upload_enabled: true
    });
    
  if (error) {
    console.error('Error adding premium group:', error);
    await sendTelegramMessage(
      chatId,
      `❌ Gagal menambahkan grup premium: ${error.message}`,
      message.message_id
    );
    return;
  }
  
  await sendTelegramMessage(
    chatId,
    `✅ Grup "${chatTitle}" berhasil ditambahkan sebagai grup premium dengan auto-upload aktif!`,
    message.message_id
  );
}

async function handleToggleAutoUploadCommand(update: TelegramUpdate) {
  const message = update.message!;
  const telegramUserId = message.from.id;
  const chatId = message.chat.id;
  
  // Check if user is admin
  const { data: isAdmin } = await supabase.rpc('is_telegram_admin', {
    telegram_user_id_param: telegramUserId
  });
  
  if (!isAdmin) {
    await sendTelegramMessage(
      chatId,
      `❌ Hanya admin yang dapat mengelola auto-upload.`,
      message.message_id
    );
    return;
  }
  
  // Get current status
  const { data: currentGroup } = await supabase
    .from('premium_groups')
    .select('auto_upload_enabled')
    .eq('chat_id', chatId)
    .maybeSingle();
    
  if (!currentGroup) {
    await sendTelegramMessage(
      chatId,
      `❌ Grup ini belum terdaftar sebagai grup premium. Gunakan /add_premium_group terlebih dahulu.`,
      message.message_id
    );
    return;
  }
  
  // Toggle auto-upload
  const newStatus = !currentGroup.auto_upload_enabled;
  const { error } = await supabase
    .from('premium_groups')
    .update({ auto_upload_enabled: newStatus })
    .eq('chat_id', chatId);
    
  if (error) {
    console.error('Error toggling auto-upload:', error);
    await sendTelegramMessage(
      chatId,
      `❌ Gagal mengubah status auto-upload: ${error.message}`,
      message.message_id
    );
    return;
  }
  
  await sendTelegramMessage(
    chatId,
    `✅ Auto-upload ${newStatus ? 'diaktifkan' : 'dinonaktifkan'} untuk grup ini.`,
    message.message_id
  );
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
    if (update.message) {
      // Handle video/document uploads
      if (update.message.video || update.message.document) {
        await handleVideoUpload(update);
        return new Response('OK', { headers: corsHeaders });
      }
      
      // Handle text commands
      if (update.message.text) {
        const text = update.message.text;
        
        if (text === '/link' || text === '/link@your_bot_username') {
          await handleLinkCommand(update);
        } else if (text === '/premium' || text === '/premium@your_bot_username') {
          await handlePremiumCommand(update);
        } else if (text === '/add_premium_group' || text === '/add_premium_group@your_bot_username') {
          await handleAddPremiumGroupCommand(update);
        } else if (text === '/toggle_autoupload' || text === '/toggle_autoupload@your_bot_username') {
          await handleToggleAutoUploadCommand(update);
        } else if (text === '/start') {
          await sendTelegramMessage(
            update.message.chat.id,
            `👋 Selamat datang!\n\n📋 Command yang tersedia:\n/link - Hubungkan akun Telegram dengan website\n/premium - Cek status premium Anda\n\n🛠️ Admin Commands:\n/add_premium_group - Tambahkan grup premium\n/toggle_autoupload - Toggle auto-upload\n\n📤 Auto-Upload:\nKirim video/dokumen ke grup premium untuk upload otomatis ke Doodstream`,
            update.message.message_id
          );
        }
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