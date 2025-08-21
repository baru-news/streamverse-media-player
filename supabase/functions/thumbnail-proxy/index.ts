import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const fileCode = url.searchParams.get('fileCode');
    
    if (!fileCode) {
      return new Response(
        JSON.stringify({ error: 'fileCode parameter is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Fetching LuluStream thumbnail for file code: ${fileCode}`);
    
    // Use LuluStream thumbnail URL
    const thumbnailUrl = `https://lulustream.com/thumbs/${fileCode}.jpg`;
    console.log(`Trying LuluStream URL: ${thumbnailUrl}`);
    
    const response = await fetch(thumbnailUrl);
    
    if (response.ok) {
      const imageBuffer = await response.arrayBuffer();
      return new Response(imageBuffer, {
        headers: {
          ...corsHeaders,
          'Content-Type': response.headers.get('Content-Type') || 'image/jpeg',
          'Cache-Control': 'public, max-age=3600'
        }
      });
    } else {
      console.log(`LuluStream thumbnail not found for file code: ${fileCode}`);
      return new Response(null, {
        status: 404,
        headers: corsHeaders
      });
    }

  } catch (error) {
    console.error('Error in thumbnail-proxy:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});