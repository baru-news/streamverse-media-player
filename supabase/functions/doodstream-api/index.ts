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
        apiUrl = `https://doodapi.co/api/file/info?${params}&file_code=${fileCode}`;
        break;
      
      case 'getVideoList':
        params.append('page', page.toString());
        params.append('per_page', perPage.toString());
        apiUrl = `https://doodapi.co/api/file/list?${params}`;
        break;
      
      case 'getAccountInfo':
        apiUrl = `https://doodapi.co/api/account/info?${params}`;
        break;
      
      case 'getUploadServer':
        apiUrl = `https://doodapi.co/api/upload/server?${params}`;
        break;
      
      case 'generateDirectLink':
        if (!fileCode) {
          return new Response(
            JSON.stringify({ success: false, error: 'File code required' }), 
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        apiUrl = `https://doodapi.co/api/file/direct_link?${params}&file_code=${fileCode}`;
        break;

      case 'syncVideos':
        // Special action to sync all videos from Doodstream to database
        apiUrl = `https://doodapi.co/api/file/list?${params}&per_page=100`;
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
        
        // Ensure we always have a valid title
        const fallbackTitle = `Video ${fileInfo.filecode || 'Unknown'}`;
        const videoTitle = fileInfo.title || fallbackTitle;
        
        const videoData = {
          fileCode: fileInfo.filecode, // file/info uses 'filecode'
          title: videoTitle,
          length: fileInfo.length,
          views: parseInt(fileInfo.views) || 0,
          uploadDate: fileInfo.uploaded,
          canPlay: fileInfo.canplay,
          size: fileInfo.size,
          thumbnail: fileInfo.single_img || `https://img.doodcdn.io/snaps/${fileInfo.filecode}.jpg`,
          splashImg: fileInfo.splash_img || `https://img.doodcdn.io/splash/${fileInfo.filecode}.jpg`
        };

        // Sync to database if requested
        if (syncToDatabase) {
          // Check if video already exists and has been manually edited
          const { data: existingVideo } = await supabase
            .from('videos')
            .select('title_edited, description_edited, title, description')
            .eq('file_code', videoData.fileCode)
            .single();

          const updateData: any = {
            file_code: videoData.fileCode,
            duration: videoData.length ? Math.floor(parseFloat(videoData.length)) : null,
            views: videoData.views,
            upload_date: videoData.uploadDate ? new Date(videoData.uploadDate).toISOString() : new Date().toISOString(),
            file_size: videoData.size ? parseInt(videoData.size) : null,
            status: videoData.canPlay ? 'active' : 'processing',
            thumbnail_url: videoData.thumbnail
          };

          // Always ensure we have a valid title - use fallback if Doodstream title is empty
          const fallbackTitle = `Video ${videoData.fileCode}`;
          const doodstreamTitle = videoData.title || fallbackTitle;

          // Only update title if it hasn't been manually edited
          if (!existingVideo?.title_edited) {
            updateData.title = doodstreamTitle;
          } else if (!existingVideo?.title) {
            // If somehow the existing video has no title, set fallback
            updateData.title = fallbackTitle;
          }

          // Only update description if it hasn't been manually edited (keeping existing or setting from Doodstream if empty)
          if (!existingVideo?.description_edited && !existingVideo?.description) {
            updateData.description = doodstreamTitle; // Use title as fallback description
          }

          console.log('Syncing video to database:', JSON.stringify(updateData, null, 2));

          const { error: upsertError } = await supabase
            .from('videos')
            .upsert(updateData, { onConflict: 'file_code' });

          if (upsertError) {
            console.error('Database upsert error for video info:', upsertError);
          } else {
            console.log('Successfully synced video info to database:', updateData.title);
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
          
          // Ensure we always have a valid title
          const fallbackTitle = `Video ${file.file_code || 'Unknown'}`;
          const videoTitle = file.title || fallbackTitle;
          
          return {
            fileCode: file.file_code, // file/list uses 'file_code'
            title: videoTitle,
            length: file.length || '0',
            views: parseInt(file.views) || 0,
            uploadDate: file.uploaded,
            canPlay: file.canplay !== undefined ? file.canplay : 1, // Default to playable
            size: file.size,
            downloadUrl: file.download_url,
            thumbnail: file.single_img || `https://img.doodcdn.io/snaps/${file.file_code}.jpg`,
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
            // Get existing videos to check for manual edits
            const { data: existingVideos } = await supabase
              .from('videos')
              .select('file_code, title_edited, description_edited, title, description')
              .in('file_code', videos.map((v: any) => v.fileCode));

            const existingVideoMap = new Map();
            existingVideos?.forEach(video => {
              existingVideoMap.set(video.file_code, video);
            });

            const videoRecords = videos.map((video: any) => {
              console.log(`Processing video for sync: ${video.title} (${video.fileCode})`);
              
              const existing = existingVideoMap.get(video.fileCode);
              
              // Always ensure we have a valid title - use fallback if Doodstream title is empty
              const fallbackTitle = `Video ${video.fileCode}`;
              const doodstreamTitle = video.title || fallbackTitle;
              
              const record: any = {
                file_code: video.fileCode,
                duration: video.length ? Math.floor(parseFloat(video.length)) : null,
                views: video.views || 0,
                upload_date: video.uploadDate ? new Date(video.uploadDate).toISOString() : new Date().toISOString(),
                file_size: video.size ? parseInt(video.size) : null,
                status: video.canPlay ? 'active' : 'processing',
                thumbnail_url: video.thumbnail
              };

              // Only update title if it hasn't been manually edited
              if (!existing?.title_edited) {
                record.title = doodstreamTitle;
              } else if (!existing?.title) {
                // If somehow the existing video has no title, set fallback
                record.title = fallbackTitle;
              }

              // Only update description if it hasn't been manually edited and current description is empty
              if (!existing?.description_edited && !existing?.description) {
                record.description = doodstreamTitle; // Use title as fallback description
              }

              console.log('Prepared record:', JSON.stringify(record, null, 2));
              return record;
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
            }
          }
          
          // Remove videos from database that no longer exist in Doodstream
          if (doodstreamFileCodes.length > 0) {
            const { data: deletedVideos, error: deleteError } = await supabase
              .from('videos')
              .delete()
              .not('file_code', 'in', `(${doodstreamFileCodes.map(code => `"${code}"`).join(',')})`);

            if (deleteError) {
              console.error('Error deleting removed videos:', deleteError);
            } else {
              console.log('Successfully removed deleted videos from database');
            }
          } else {
            // If no videos from Doodstream, delete all videos from database
            const { error: deleteAllError } = await supabase
              .from('videos')
              .delete()
              .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

            if (deleteAllError) {
              console.error('Error deleting all videos:', deleteAllError);
            } else {
              console.log('No videos in Doodstream - removed all videos from database');
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