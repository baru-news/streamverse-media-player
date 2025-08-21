import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('Refresh thumbnails request received:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get all videos with problematic thumbnail URLs
    const { data: videos, error: fetchError } = await supabase
      .from('videos')
      .select('id, file_code, thumbnail_url')
      .or('thumbnail_url.like.%postercdn.com%,thumbnail_url.is.null,thumbnail_url.eq.')

    if (fetchError) {
      console.error('Error fetching videos:', fetchError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Failed to fetch videos' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Found ${videos?.length || 0} videos with problematic thumbnails`);

    let updatedCount = 0;

    if (videos && videos.length > 0) {
      // Update each video with proper thumbnail URL
      for (const video of videos) {
        if (video.file_code) {
          let newThumbnailUrl = '';
          
          // Convert postercdn URLs to doodcdn
          if (video.thumbnail_url && video.thumbnail_url.includes('postercdn.com')) {
            if (video.thumbnail_url.includes('/snaps/')) {
              newThumbnailUrl = `https://img.doodcdn.io/snaps/${video.file_code}.jpg`;
            } else if (video.thumbnail_url.includes('/splash/')) {
              newThumbnailUrl = `https://img.doodcdn.io/splash/${video.file_code}.jpg`;
            } else {
              newThumbnailUrl = `https://img.doodcdn.io/thumbnails/${video.file_code}.jpg`;
            }
          } else if (!video.thumbnail_url) {
            // Default for null/empty thumbnails
            newThumbnailUrl = `https://img.doodcdn.io/thumbnails/${video.file_code}.jpg`;
          }

          if (newThumbnailUrl) {
            const { error: updateError } = await supabase
              .from('videos')
              .update({ thumbnail_url: newThumbnailUrl })
              .eq('id', video.id);

            if (updateError) {
              console.error(`Failed to update video ${video.id}:`, updateError);
            } else {
              updatedCount++;
              console.log(`Updated thumbnail for video ${video.id}: ${newThumbnailUrl}`);
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Successfully updated ${updatedCount} thumbnail URLs`,
      updated_count: updatedCount,
      total_checked: videos?.length || 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in refresh-thumbnails function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});