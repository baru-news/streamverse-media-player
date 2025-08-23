import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FileValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedBuffer?: Uint8Array;
  mimeType?: string;
}

// Magic numbers for image file types
const IMAGE_SIGNATURES = {
  jpeg: [0xFF, 0xD8, 0xFF],
  png: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
  webp: [0x52, 0x49, 0x46, 0x46], // RIFF header for WebP
  gif: [0x47, 0x49, 0x46], // GIF87a or GIF89a
};

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DIMENSION = 2048; // Max width/height in pixels

function validateFileSignature(buffer: Uint8Array): { isValid: boolean; detectedType?: string } {
  // Check JPEG
  if (buffer.length >= 3 && 
      buffer[0] === IMAGE_SIGNATURES.jpeg[0] && 
      buffer[1] === IMAGE_SIGNATURES.jpeg[1] && 
      buffer[2] === IMAGE_SIGNATURES.jpeg[2]) {
    return { isValid: true, detectedType: 'image/jpeg' };
  }
  
  // Check PNG
  if (buffer.length >= 8 && 
      Array.from(buffer.slice(0, 8)).every((byte, idx) => byte === IMAGE_SIGNATURES.png[idx])) {
    return { isValid: true, detectedType: 'image/png' };
  }
  
  // Check WebP
  if (buffer.length >= 12 && 
      Array.from(buffer.slice(0, 4)).every((byte, idx) => byte === IMAGE_SIGNATURES.webp[idx]) &&
      Array.from(buffer.slice(8, 12)).every((byte, idx) => byte === [0x57, 0x45, 0x42, 0x50][idx])) {
    return { isValid: true, detectedType: 'image/webp' };
  }
  
  return { isValid: false };
}

function stripExifData(buffer: Uint8Array, mimeType: string): Uint8Array {
  // For JPEG files, remove EXIF data by finding and removing APP1 segment
  if (mimeType === 'image/jpeg') {
    let result = new Uint8Array(buffer);
    
    // JPEG files start with SOI (0xFFD8)
    if (result[0] === 0xFF && result[1] === 0xD8) {
      let i = 2;
      while (i < result.length - 1) {
        // Look for APP1 marker (0xFFE1) which contains EXIF data
        if (result[i] === 0xFF && result[i + 1] === 0xE1) {
          // Get segment length (big endian)
          const segmentLength = (result[i + 2] << 8) | result[i + 3];
          // Remove this segment
          const newBuffer = new Uint8Array(result.length - segmentLength - 2);
          newBuffer.set(result.slice(0, i));
          newBuffer.set(result.slice(i + segmentLength + 2), i);
          result = newBuffer;
          continue;
        }
        // Skip other segments
        if (result[i] === 0xFF && result[i + 1] >= 0xE0 && result[i + 1] <= 0xEF) {
          const segmentLength = (result[i + 2] << 8) | result[i + 3];
          i += segmentLength + 2;
        } else {
          i++;
        }
      }
    }
    return result;
  }
  
  // For other formats, return as-is (PNG doesn't typically have EXIF)
  return buffer;
}

async function validateAndSanitizeFile(
  buffer: Uint8Array, 
  filename: string, 
  uploadedMimeType: string
): Promise<FileValidationResult> {
  try {
    console.log(`Validating file: ${filename}, size: ${buffer.length}, uploaded MIME: ${uploadedMimeType}`);
    
    // 1. File size validation
    if (buffer.length > MAX_FILE_SIZE) {
      return { isValid: false, error: 'File size exceeds 5MB limit' };
    }
    
    if (buffer.length < 100) {
      return { isValid: false, error: 'File is too small to be a valid image' };
    }
    
    // 2. Extension validation
    const extension = filename.toLowerCase().split('.').pop();
    if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
      return { isValid: false, error: 'Invalid file extension. Only JPG, PNG, and WebP are allowed' };
    }
    
    // 3. Magic number validation
    const signatureCheck = validateFileSignature(buffer);
    if (!signatureCheck.isValid) {
      return { isValid: false, error: 'Invalid file format. File content does not match a valid image format' };
    }
    
    // 4. MIME type consistency check
    const detectedMime = signatureCheck.detectedType;
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (!allowedMimes.includes(uploadedMimeType) || !detectedMime) {
      return { isValid: false, error: 'MIME type validation failed' };
    }
    
    // 5. Strip EXIF and other metadata
    const sanitizedBuffer = stripExifData(buffer, detectedMime);
    
    console.log(`File validation successful. Original size: ${buffer.length}, Sanitized size: ${sanitizedBuffer.length}`);
    
    return {
      isValid: true,
      sanitizedBuffer,
      mimeType: detectedMime
    };
    
  } catch (error) {
    console.error('File validation error:', error);
    return { isValid: false, error: 'File validation failed' };
  }
}

async function logUploadAttempt(supabase: any, userId: string, filename: string, success: boolean, error?: string) {
  try {
    await supabase.from('upload_logs').insert({
      user_id: userId,
      filename,
      success,
      error_message: error,
      upload_type: 'avatar',
      created_at: new Date().toISOString()
    });
  } catch (logError) {
    console.error('Failed to log upload attempt:', logError);
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting check - max 5 uploads per hour per user
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentUploads } = await supabase
      .from('upload_logs')
      .select('id')
      .eq('user_id', user.id)
      .eq('upload_type', 'avatar')
      .gte('created_at', oneHourAgo);

    if (recentUploads && recentUploads.length >= 5) {
      await logUploadAttempt(supabase, user.id, 'unknown', false, 'Rate limit exceeded');
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Maximum 5 avatar uploads per hour.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      await logUploadAttempt(supabase, user.id, 'unknown', false, 'No file provided');
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing upload for user ${user.id}: ${file.name}, ${file.size} bytes`);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Validate and sanitize the file
    const validation = await validateAndSanitizeFile(buffer, file.name, file.type);
    
    if (!validation.isValid || !validation.sanitizedBuffer) {
      await logUploadAttempt(supabase, user.id, file.name, false, validation.error);
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate secure filename with random component
    const timestamp = Date.now();
    const randomComponent = crypto.getRandomValues(new Uint8Array(16))
      .reduce((acc, byte) => acc + byte.toString(16).padStart(2, '0'), '');
    
    const extension = validation.mimeType === 'image/jpeg' ? 'jpg' : 
                     validation.mimeType === 'image/png' ? 'png' : 'webp';
    
    const secureFilename = `avatar_${timestamp}_${randomComponent}.${extension}`;
    const filePath = `${user.id}/${secureFilename}`;

    console.log(`Uploading sanitized file: ${filePath}`);

    // Remove old avatar first
    try {
      const { data: oldProfile } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single();
      
      if (oldProfile?.avatar_url) {
        // Extract old file path from URL
        const oldPath = oldProfile.avatar_url.split('/avatars/')[1];
        if (oldPath && oldPath.startsWith(user.id)) {
          await supabase.storage.from('avatars').remove([oldPath]);
        }
      }
    } catch (cleanupError) {
      console.log('Old file cleanup failed (non-critical):', cleanupError);
    }

    // Upload sanitized file
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, validation.sanitizedBuffer, {
        contentType: validation.mimeType,
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      await logUploadAttempt(supabase, user.id, file.name, false, `Upload failed: ${uploadError.message}`);
      return new Response(
        JSON.stringify({ error: 'Upload failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    // Update user profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id);

    if (updateError) {
      console.error('Profile update error:', updateError);
      // Clean up uploaded file
      await supabase.storage.from('avatars').remove([filePath]);
      await logUploadAttempt(supabase, user.id, file.name, false, `Profile update failed: ${updateError.message}`);
      return new Response(
        JSON.stringify({ error: 'Profile update failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log successful upload
    await logUploadAttempt(supabase, user.id, file.name, true);

    console.log(`Avatar upload completed successfully for user ${user.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        avatar_url: publicUrl,
        message: 'Avatar uploaded and sanitized successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error in avatar upload:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});