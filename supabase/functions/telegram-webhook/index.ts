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
  const userId = message.from?.id;
  const username = message.from?.username;

  console.log(`Video upload attempt - Chat: ${chatId}, User: ${userId} (${username})`);

  // Check authorization using database functions
  let isAuthorized = false;
  let uploadSource = '';

  try {
    // Check if user is Telegram admin
    if (userId) {
      const { data: isAdmin } = await supabase.rpc('is_telegram_admin', { 
        telegram_user_id_param: userId 
      });
      
      if (isAdmin) {
        isAuthorized = true;
        uploadSource = 'telegram_admin';
        console.log(`✅ Authorized: User ${userId} is Telegram admin`);
      }
    }

    // If not admin, check if chat is premium group with auto-upload enabled
    if (!isAuthorized) {
      const { data: isPremiumGroup } = await supabase.rpc('is_premium_group_with_autoupload', { 
        chat_id_param: chatId 
      });
      
      if (isPremiumGroup) {
        isAuthorized = true;
        uploadSource = 'premium_group';
        console.log(`✅ Authorized: Chat ${chatId} is premium group with auto-upload`);
      }
    }

    if (!isAuthorized) {
      console.warn(`❌ Unauthorized upload attempt - Chat: ${chatId}, User: ${userId}`);
      
      await sendTelegramMessage(chatId, 
        `❌ Upload tidak diizinkan!\n\n` +
        `🔒 Hanya admin atau grup premium yang dapat mengupload video.\n` +
        `💬 Hubungi administrator untuk info lebih lanjut.`,
        message.message_id
      );
      
      return;
    }
  } catch (authError) {
    console.error('Authorization check failed:', authError);
    await sendTelegramMessage(chatId, 
      `❌ Gagal memeriksa authorization: ${authError.message}`,
      message.message_id
    );
    return;
  }

  try {
    const telegramFile = message.video || message.document;
    if (!telegramFile) {
      console.warn('No video or document found in message');
      return;
    }

    // 1. FILE SIZE VALIDATION (19.5MB limit to be safe)
    const maxFileSize = 19.5 * 1024 * 1024; // 19.5MB in bytes
    if (telegramFile.file_size && telegramFile.file_size > maxFileSize) {
      await sendTelegramMessage(chatId, 
        `❌ File terlalu besar!\n\n` +
        `📏 Ukuran file: ${(telegramFile.file_size / (1024 * 1024)).toFixed(1)}MB\n` +
        `⚠️ Maksimal: 19.5MB\n\n` +
        `💡 Silakan kompres video atau gunakan file yang lebih kecil.`,
        message.message_id
      );
      return;
    }

    const fileName = telegramFile.file_name || `video_${telegramFile.file_unique_id}`;
    const videoTitle = message.text || fileName;

    console.log(`📁 Processing file: ${fileName} (${telegramFile.file_size} bytes) from ${uploadSource}`);

    // 2. CHECK FOR DUPLICATE FILES
    const { data: existingUpload } = await supabase
      .from('telegram_uploads')
      .select('*, videos(*)')
      .eq('telegram_file_unique_id', telegramFile.file_unique_id)
      .eq('upload_status', 'completed')
      .maybeSingle();

    if (existingUpload && existingUpload.videos) {
      await sendTelegramMessage(chatId, 
        `🔄 File sudah pernah diupload sebelumnya!\n\n` +
        `📝 Judul: ${existingUpload.videos.title}\n` +
        `🔗 ID Video: ${existingUpload.videos.id}\n\n` +
        `✅ File sudah tersedia di sistem.`,
        message.message_id
      );
      return;
    }

    // 3. SAVE TELEGRAM UPLOAD METADATA (WITH UPSERT TO HANDLE DUPLICATES)
    const { data: telegramUpload, error: telegramError } = await supabase
      .from('telegram_uploads')
      .upsert({
        telegram_user_id: userId!,
        telegram_chat_id: chatId,
        telegram_message_id: message.message_id,
        telegram_file_id: telegramFile.file_id,
        telegram_file_unique_id: telegramFile.file_unique_id,
        original_filename: fileName,
        mime_type: telegramFile.mime_type,
        file_size: telegramFile.file_size,
        upload_status: 'processing'
      }, {
        onConflict: 'telegram_file_unique_id'
      })
      .select()
      .single();

    if (telegramError) {
      console.error('Error saving telegram upload metadata:', telegramError);
      await sendTelegramMessage(chatId, 
        `❌ Gagal menyimpan metadata file: ${telegramError.message}`,
        message.message_id
      );
      return;
    }

    // 4. DOWNLOAD AND PROCESS FILE
    const fileUrl = await getTelegramFile(telegramFile.file_id);
    const fileBuffer = await downloadFile(fileUrl);

    // Upload to both Doodstream accounts
    console.log('🚀 Uploading to both Doodstream accounts...');
    const uploadResult = await uploadToBothDoodstream(fileBuffer, fileName, videoTitle);

    // 5. VALIDATE UPLOAD RESULTS BEFORE DATABASE INSERT
    const hasRegularSuccess = uploadResult.results.regular?.file_code;
    const hasPremiumSuccess = uploadResult.results.premium?.file_code;
    const hasAnySuccess = hasRegularSuccess || hasPremiumSuccess;

    // If both uploads failed, save to upload_failures and don't create video record
    if (!hasAnySuccess) {
      console.error('Both uploads failed completely');
      
      // Save failed upload details for manual retry
      await supabase.from('upload_failures').insert({
        upload_type: 'telegram_dual_upload',
        attempt_count: 1,
        error_details: { 
          errors: uploadResult.errors,
          telegram_file: telegramFile,
          upload_source: uploadSource 
        },
        requires_manual_upload: true
      });

      // Update telegram upload record as failed
      await supabase
        .from('telegram_uploads')
        .update({
          upload_status: 'failed',
          processed_at: new Date().toISOString(),
          error_message: JSON.stringify(uploadResult.errors)
        })
        .eq('id', telegramUpload.id);

      await sendTelegramMessage(chatId, 
        `❌ Upload gagal ke semua akun!\n\n` +
        `📝 File: ${fileName}\n` +
        `🛠️ Regular: ${uploadResult.errors.regular}\n` +
        `🛠️ Premium: ${uploadResult.errors.premium}\n\n` +
        `⚠️ Admin akan melakukan retry manual.`,
        message.message_id
      );
      return;
    }

    // Prepare upload status and file codes
    const uploadStatus = {
      regular: hasRegularSuccess ? 'success' : 'failed',
      premium: hasPremiumSuccess ? 'success' : 'failed'
    };
    
    const failedUploads = uploadResult.hasErrors ? uploadResult.errors : {};

    // 6. SAVE TO DATABASE (only if at least one upload succeeded)
    const { data: videoData, error: dbError } = await supabase
      .from('videos')
      .insert({
        title: videoTitle,
        description: `Uploaded from Telegram ${uploadSource} by ${username || 'Unknown'}`,
        file_code: hasRegularSuccess || hasPremiumSuccess, // Use whichever succeeded
        regular_file_code: hasRegularSuccess || null,
        premium_file_code: hasPremiumSuccess || null,
        doodstream_file_code: hasRegularSuccess || hasPremiumSuccess,
        file_size: telegramFile.file_size,
        status: uploadResult.hasErrors ? 'partial' : 'active',
        upload_date: new Date().toISOString(),
        provider: 'doodstream',
        upload_status: uploadStatus,
        failed_uploads: failedUploads
      })
      .select()
      .single();

    if (dbError) throw dbError;

    // Update telegram upload record with video reference and final status
    if (telegramUpload) {
      await supabase
        .from('telegram_uploads')
        .update({
          video_id: videoData.id,
          doodstream_file_code: videoData.doodstream_file_code,
          upload_status: uploadResult.hasErrors ? 'partial_success' : 'completed',
          processed_at: new Date().toISOString(),
          error_message: uploadResult.hasErrors ? JSON.stringify(uploadResult.errors) : null
        })
        .eq('id', telegramUpload.id);
    }

    // Log successful upload for monitoring
    await supabase.from('upload_logs').insert({
      user_id: null, // Telegram uploads don't have direct user mapping
      filename: fileName,
      success: !uploadResult.hasErrors,
      upload_type: `telegram_${uploadSource}`,
      error_message: uploadResult.hasErrors ? `Partial upload: ${JSON.stringify(uploadResult.errors)}` : null,
      ip_address: 'telegram_bot',
      file_size: telegramFile.file_size
    });

    // Send success/partial success message with retry buttons for failures
    let successMessage = '';
    
    if (!uploadResult.hasErrors) {
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
    if (uploadResult.hasErrors) {
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
