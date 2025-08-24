import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const doodstreamApiKey = Deno.env.get('DOODSTREAM_API_KEY') ?? '';
  const doodstreamPremiumApiKey = Deno.env.get('DOODSTREAM_PREMIUM_API_KEY') ?? '';

  try {
    const body = await req.json();
    const { action, fileBuffer, fileName, title } = body;

    if (action === 'upload_dual') {
      return await handleDualUpload(fileBuffer, fileName, title);
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Doodstream Premium API error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  async function handleDualUpload(fileBuffer: ArrayBuffer, fileName: string, title?: string) {
    const results = {
      regular: null as any,
      premium: null as any,
      errors: {} as any
    };

    try {
      // Upload to both accounts simultaneously
      const [regularResult, premiumResult] = await Promise.allSettled([
        uploadToAccount(doodstreamApiKey, fileBuffer, fileName, title, 'regular'),
        uploadToAccount(doodstreamPremiumApiKey, fileBuffer, fileName, title, 'premium')
      ]);

      if (regularResult.status === 'fulfilled') {
        results.regular = regularResult.value;
      } else {
        results.errors.regular = regularResult.reason?.message || 'Upload failed';
        console.error('Regular upload failed:', regularResult.reason);
      }

      if (premiumResult.status === 'fulfilled') {
        results.premium = premiumResult.value;
      } else {
        results.errors.premium = premiumResult.reason?.message || 'Upload failed';
        console.error('Premium upload failed:', premiumResult.reason);
      }

      return new Response(JSON.stringify({
        success: true,
        results,
        hasErrors: Object.keys(results.errors).length > 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (error) {
      console.error('Dual upload error:', error);
      return new Response(JSON.stringify({ 
        success: false, 
        error: error.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  async function uploadToAccount(apiKey: string, fileBuffer: ArrayBuffer, fileName: string, title?: string, accountType: string) {
    // Get upload server
    const serverResponse = await fetch(`https://doodapi.com/api/upload/server?key=${apiKey}`);
    const serverData = await serverResponse.json();
    
    if (serverData.status !== 200) {
      throw new Error(`Failed to get upload server for ${accountType}: ${serverData.msg}`);
    }

    const uploadUrl = serverData.result;
    
    // Create form data
    const formData = new FormData();
    const file = new File([fileBuffer], fileName);
    formData.append('api_key', apiKey);
    formData.append('file', file);
    
    // Upload file
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    const uploadResult = await uploadResponse.json();
    
    if (uploadResult.status !== 200) {
      throw new Error(`Upload failed for ${accountType}: ${uploadResult.msg}`);
    }

    // Log successful upload
    console.log(`${accountType} upload successful:`, uploadResult.result);
    
    return {
      file_code: uploadResult.result.filecode,
      download_url: uploadResult.result.download_url,
      account_type: accountType,
      upload_url: uploadUrl
    };
  }
});