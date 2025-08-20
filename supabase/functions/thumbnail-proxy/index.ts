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

    console.log(`Fetching thumbnail for file code: ${fileCode}`);
    
    // Try primary thumbnail URL (thumbnails endpoint is usually best quality)
    const primaryUrl = `https://img.doodcdn.io/thumbnails/${fileCode}.jpg`;
    console.log(`Trying primary URL: ${primaryUrl}`);
    
    let response = await fetch(primaryUrl);
    
    if (!response.ok) {
      // Try snaps URL as fallback
      const snapsUrl = `https://img.doodcdn.io/snaps/${fileCode}.jpg`;
      console.log(`Primary failed, trying snaps: ${snapsUrl}`);
      response = await fetch(snapsUrl);
      
      if (!response.ok) {
        // Try splash URL as final fallback
        const splashUrl = `https://img.doodcdn.io/splash/${fileCode}.jpg`;
        console.log(`Snaps failed, trying splash: ${splashUrl}`);
        response = await fetch(splashUrl);
      }
    }
    
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
      console.log(`All thumbnail URLs failed for file code: ${fileCode}`);
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