import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Doodstream API Proxy Edge Function with Database Integration
// This securely handles Doodstream API calls and syncs with database

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('Doodstream API request received:', req.method, req.url);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role for database operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get the API key from environment variables
    const apiKey = Deno.env.get('DOODSTREAM_API_KEY');
    if (!apiKey) {
      console.error('DOODSTREAM_API_KEY not found in environment');
      return new Response(
        JSON.stringify({ success: false, error: 'API key not configured' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse request body
    const { action, fileCode, page = 1, perPage = 12, syncToDatabase = false } = await req.json();
    console.log('Processing action:', action, 'with params:', { fileCode, page, perPage, syncToDatabase });

    let apiUrl: string;
    let params = new URLSearchParams({ key: apiKey });

    // Build API URL based on action
    switch (action) {
      case 'getVideoInfo':
        if (!fileCode) {
          return new Response(
            JSON.stringify({ success: false, error: 'File code required' }), 
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        apiUrl = `https://doodapi.com/api/file/info?${params}&file_code=${fileCode}`;
        break;
      
      case 'getVideoList':
        params.append('page', page.toString());
        params.append('per_page', perPage.toString());
        apiUrl = `https://doodapi.com/api/file/list?${params}`;
        break;
      
      case 'getAccountInfo':
        apiUrl = `https://doodapi.com/api/account/info?${params}`;
        break;
      
      case 'getUploadServer':
        apiUrl = `https://doodapi.com/api/upload/server?${params}`;
        break;
      
      case 'generateDirectLink':
        if (!fileCode) {
          return new Response(
            JSON.stringify({ success: false, error: 'File code required' }), 
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        apiUrl = `https://doodapi.com/api/file/direct_link?${params}&file_code=${fileCode}`;
        break;

      case 'syncVideos':
        // Special action to sync all videos from Doodstream to database
        apiUrl = `https://doodapi.com/api/file/list?${params}&per_page=100`;
        break;
      
      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Unknown action' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    console.log('Making request to Doodstream API:', apiUrl);

    // Make request to Doodstream API
    const doodstreamResponse = await fetch(apiUrl);
    const data = await doodstreamResponse.json();

    console.log('Doodstream API response status:', data.status, 'message:', data.msg);

    // Process the response
    let result = data;
    
      // Transform data for specific actions
      if (action === 'getVideoInfo' && data.status === 200) {
        const fileInfo = data.result[0];
        const videoData = {
          fileCode: fileInfo.filecode,
          title: fileInfo.title,
          length: fileInfo.length,
          views: parseInt(fileInfo.views) || 0,
          uploadDate: fileInfo.uploaded,
          canPlay: fileInfo.canplay,
          size: fileInfo.size,
          thumbnail: `https://img.doodcdn.com/snaps/${fileInfo.filecode}.jpg`
        };

        // Sync to database if requested
        if (syncToDatabase) {
          const { error: upsertError } = await supabase.from('videos').upsert({
            file_code: videoData.fileCode,
            title: videoData.title,
            duration: videoData.length ? Math.floor(parseFloat(videoData.length)) : null,
            views: videoData.views,
            upload_date: videoData.uploadDate ? new Date(videoData.uploadDate).toISOString() : new Date().toISOString(),
            file_size: videoData.size ? parseInt(videoData.size) : null,
            status: videoData.canPlay ? 'active' : 'processing',
            thumbnail_url: videoData.thumbnail
          }, { onConflict: 'file_code' });

          if (upsertError) {
            console.error('Database upsert error for video info:', upsertError);
          } else {
            console.log('Successfully synced video info to database:', videoData.title);
          }
        }

        result = {
          success: true,
          result: videoData
        };
      } else if ((action === 'getVideoList' || action === 'syncVideos') && data.status === 200) {
        console.log('Raw Doodstream API response:', JSON.stringify(data, null, 2));
        
        const videos = data.result?.files?.map((file: any) => {
          console.log('Processing file:', JSON.stringify(file, null, 2));
          
          return {
            fileCode: file.filecode || file.file_code, // Handle both possible field names
            title: file.title || 'Untitled Video',
            length: file.length || file.duration || '0',
            views: parseInt(file.views) || 0,
            uploadDate: file.uploaded || file.upload_date,
            canPlay: file.canplay !== undefined ? file.canplay : 1, // Default to playable
            size: file.size || file.file_size,
            thumbnail: file.filecode ? `https://img.doodcdn.com/snaps/${file.filecode}.jpg` : 
                      file.file_code ? `https://img.doodcdn.com/snaps/${file.file_code}.jpg` : 
                      '/placeholder.svg'
          };
        }) || [];

        console.log('Processed videos:', JSON.stringify(videos, null, 2));

        // Sync to database if it's syncVideos action
        if (action === 'syncVideos' && videos.length > 0) {
          console.log(`Attempting to sync ${videos.length} videos to database`);
          
          const videoRecords = videos.map((video: any) => {
            console.log(`Processing video for sync: ${video.title} (${video.fileCode})`);
            
            return {
              file_code: video.fileCode,
              title: video.title,
              duration: video.length ? Math.floor(parseFloat(video.length)) : null,
              views: video.views || 0,
              upload_date: video.uploadDate ? new Date(video.uploadDate).toISOString() : new Date().toISOString(),
              file_size: video.size ? parseInt(video.size) : null,
              status: video.canPlay ? 'active' : 'processing',
              thumbnail_url: video.thumbnail
            };
          });

          console.log(`Prepared video records for upsert:`, JSON.stringify(videoRecords, null, 2));

          const { data: upsertData, error: upsertError } = await supabase
            .from('videos')
            .upsert(videoRecords, { onConflict: 'file_code' });

          if (upsertError) {
            console.error('Database upsert error:', upsertError);
            return new Response(
              JSON.stringify({ 
                success: false, 
                error: 'Failed to sync videos to database', 
                details: upsertError 
              }), 
              { 
                status: 500, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            );
          } else {
            console.log(`Successfully synced ${videos.length} videos to database`);
            console.log(`Upsert result:`, upsertData);
          }
        }

      result = {
        success: true,
        result: videos
      };
    } else if (data.status === 200) {
      result = { success: true, result: data.result };
    } else {
      result = { success: false, error: data.msg || 'API request failed' };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in doodstream-api function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});