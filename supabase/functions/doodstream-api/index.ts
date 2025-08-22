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

    // Handle file upload action separately (multipart form data)
    if (req.headers.get('content-type')?.includes('multipart/form-data')) {
      console.log('Processing file upload action');
      
      const formData = await req.formData();
      const file = formData.get('file') as File;
      const title = formData.get('title') as string || 'Untitled Video';
      
      if (!file) {
        return new Response(
          JSON.stringify({ success: false, error: 'No file provided' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Step 1: Get upload server
      const uploadServerResponse = await fetch(`https://doodapi.com/api/upload/server?key=${apiKey}`);
      const uploadServerData = await uploadServerResponse.json();
      
      if (uploadServerData.status !== 200) {
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to get upload server' }), 
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Step 2: Upload file to Doodstream
      const uploadUrl = uploadServerData.result;
      const uploadFormData = new FormData();
      uploadFormData.append('api_key', apiKey);
      uploadFormData.append('file', file);
      uploadFormData.append('title', title);

      console.log('Uploading file to Doodstream:', uploadUrl);

      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        body: uploadFormData
      });

      const uploadResult = await uploadResponse.json();
      console.log('Doodstream upload response:', uploadResult);

      if (uploadResult.status === 200) {
        return new Response(JSON.stringify({
          success: true,
          result: {
            file_code: uploadResult.result?.[0]?.filecode,
            message: uploadResult.msg
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        return new Response(JSON.stringify({
          success: false,
          error: uploadResult.msg || 'Upload failed'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Parse request body for other actions
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
          fileCode: fileInfo.filecode, // file/info uses 'filecode'
          title: fileInfo.title,
          length: fileInfo.length,
          views: parseInt(fileInfo.views) || 0,
          uploadDate: fileInfo.uploaded,
          canPlay: fileInfo.canplay,
          size: fileInfo.size,
          thumbnail: `https://img.doodcdn.io/thumbnails/${fileInfo.filecode}.jpg`,
          splashImg: fileInfo.splash_img || `https://img.doodcdn.io/splash/${fileInfo.filecode}.jpg`
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
            fileCode: file.file_code, // file/list uses 'file_code'
            title: file.title || 'Untitled Video',
            length: file.length || '0',
            views: parseInt(file.views) || 0,
            uploadDate: file.uploaded,
            canPlay: file.canplay !== undefined ? file.canplay : 1, // Default to playable
            size: file.size,
            downloadUrl: file.download_url,
            thumbnail: file.single_img || `https://img.doodcdn.io/thumbnails/${file.file_code}.jpg`,
            publicStatus: file.public,
            folderId: file.fld_id
          };
        }) || [];

        console.log('Processed videos:', JSON.stringify(videos, null, 2));

        // Sync to database if it's syncVideos action
        if (action === 'syncVideos') {
          console.log(`Attempting to sync ${videos.length} videos to database`);
          
          // Get current file codes from Doodstream
          const doodstreamFileCodes = videos.map((video: any) => video.fileCode).filter(Boolean);
          console.log('Current Doodstream file codes:', doodstreamFileCodes);
          
          // If there are videos from Doodstream, sync them
          if (videos.length > 0) {
        // Transform video data and prepare for database sync
        const videoRecords = await Promise.all(videos.map(async (video: any) => {
          console.log(`Processing video for sync: ${video.title} (${video.fileCode})`);
          
          // Check if video exists and has edited title/description
          const { data: existingVideo } = await supabase
            .from('videos')
            .select('title, description, title_edited, description_edited')
            .eq('file_code', video.fileCode)
            .single();

           // Prepare record for database - preserve edited content
           const record = {
             file_code: video.fileCode,
             doodstream_file_code: video.fileCode, // Store DoodStream file code
             provider: 'doodstream',
             primary_provider: 'doodstream',
             title: (existingVideo?.title_edited && existingVideo?.title) ? existingVideo.title : video.title,
             description: (existingVideo?.description_edited && existingVideo?.description) ? existingVideo.description : null,
             original_title: video.title, // Always store original from Doodstream
             duration: video.length ? Math.floor(parseFloat(video.length)) : null,
             views: video.views || 0,
             upload_date: video.uploadDate ? new Date(video.uploadDate).toISOString() : new Date().toISOString(),
             file_size: video.size ? parseInt(video.size) : null,
             status: video.canPlay ? 'active' : 'processing',
             thumbnail_url: video.thumbnail,
             // Preserve edit flags
             title_edited: existingVideo?.title_edited || false,
             description_edited: existingVideo?.description_edited || false
           };
          
          console.log('Prepared record:', record);
          return record;
        }));

            console.log(`Prepared video records for upsert:`, JSON.stringify(videoRecords, null, 2));

            // Use upsert with individual error handling
            for (const record of videoRecords) {
              try {
                const { error } = await supabase
                  .from('videos')
                  .upsert(record, { 
                    onConflict: 'file_code',
                    ignoreDuplicates: false 
                  });

                if (error) {
                  console.error(`Database upsert error for ${record.file_code}:`, error);
                } else {
                  console.log(`Successfully synced video: ${record.title}`);
                }
              } catch (err) {
                console.error(`Failed to sync video ${record.file_code}:`, err);
              }
            }
          }
          
          // Remove DoodStream videos from database that no longer exist in Doodstream
          if (doodstreamFileCodes.length > 0) {
            const { data: deletedVideos, error: deleteError } = await supabase
              .from('videos')
              .delete()
              .eq('provider', 'doodstream')
              .not('file_code', 'in', `(${doodstreamFileCodes.map(code => `"${code}"`).join(',')})`);

            if (deleteError) {
              console.error('Error deleting removed DoodStream videos:', deleteError);
            } else {
              console.log('Successfully removed deleted DoodStream videos from database');
            }
          } else {
            // If no videos from Doodstream, delete all DoodStream videos from database
            const { error: deleteAllError } = await supabase
              .from('videos')
              .delete()
              .eq('provider', 'doodstream');

            if (deleteAllError) {
              console.error('Error deleting all DoodStream videos:', deleteAllError);
            } else {
              console.log('No videos in Doodstream - removed all DoodStream videos from database');
            }
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