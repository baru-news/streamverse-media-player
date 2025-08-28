import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const doodstreamApiKey = Deno.env.get('DOODSTREAM_API_KEY') ?? '';
const doodstreamPremiumApiKey = Deno.env.get('DOODSTREAM_PREMIUM_API_KEY') ?? '';

async function uploadToAccount(apiKey: string, file: File, accountType: string) {
  // Get upload server
  const serverResponse = await fetch(`https://doodapi.com/api/upload/server?key=${apiKey}`);
  const serverData = await serverResponse.json();

  if (serverData.status !== 200) {
    throw new Error(`Failed to get upload server for ${accountType}: ${serverData.msg}`);
  }

  const uploadUrl = serverData.result;

  // Create form data
  const formData = new FormData();
  formData.append('api_key', apiKey);
  formData.append('file', file, file.name);

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

async function handleDualUpload(file: File, title?: string) {
  const results = {
    regular: null as any,
    premium: null as any,
    errors: {} as any
  };

  try {
    // Upload to both accounts simultaneously
    const [regularResult, premiumResult] = await Promise.allSettled([
      uploadToAccount(doodstreamApiKey, file, 'regular'),
      uploadToAccount(doodstreamPremiumApiKey, file, 'premium')
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🔄 Doodstream Premium API called');

  try {
    if (req.headers.get('content-type')?.includes('multipart/form-data')) {
      const form = await req.formData();
      const action = form.get('action');
      const title = form.get('title')?.toString();
      const file = form.get('file') as File | null;

      console.log(`📝 Action: ${action}, File: ${file?.name}`);

      if (action === 'upload_dual' && file) {
        return await handleDualUpload(file, title || undefined);
      }

      return new Response(JSON.stringify({ error: 'Invalid action or file' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      const body = await req.json();
      const { action } = body;
      return new Response(JSON.stringify({ error: `Unsupported content type for action ${action}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Doodstream Premium API error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
