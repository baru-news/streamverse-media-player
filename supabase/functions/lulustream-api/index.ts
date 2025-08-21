import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const luluStreamApiKey = Deno.env.get('LULUSTREAM_API_KEY');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...params } = await req.json();

    if (!luluStreamApiKey) {
      throw new Error('LuluStream API key not configured');
    }

    let result;
    
    switch (action) {
      case 'getAccountInfo':
        result = await getAccountInfo();
        break;
      case 'getVideoInfo':
        result = await getVideoInfo(params.fileCode, params.syncToDatabase);
        break;
      case 'getVideoList':
        result = await getVideoList(params.page, params.perPage);
        break;
      case 'getUploadServer':
        result = await getUploadServer();
        break;
      case 'uploadVideo':
        result = await uploadVideo(params.uploadUrl, params.fileData, params.fileName, params.fileType, params.fileTitle);
        break;
      case 'syncVideos':
        result = await syncVideos();
        break;
      case 'generateDirectLink':
        result = await generateDirectLink(params.fileCode);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in lulustream-api function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function getAccountInfo() {
  const response = await fetch(`https://lulustream.com/api/account/info?key=${luluStreamApiKey}`);
  const data = await response.json();
  
  if (data.status !== 200) {
    throw new Error(data.msg || 'Failed to get account info');
  }
  
  return data;
}

async function getVideoInfo(fileCode: string, syncToDatabase = false) {
  if (!fileCode) {
    throw new Error('File code is required');
  }

  const response = await fetch(`https://lulustream.com/api/file/info?key=${luluStreamApiKey}&file_code=${fileCode}`);
  const data = await response.json();
  
  if (data.status !== 200) {
    throw new Error(data.msg || 'Failed to get video info');
  }

  if (syncToDatabase && data.result && data.result.length > 0) {
    const videoData = data.result[0];
    
    // Sync to database
    const { error } = await supabase
      .from('videos')
      .upsert({
        file_code: videoData.file_code,
        provider: 'lulustream',
        title: videoData.file_title || videoData.file_code,
        original_title: videoData.file_title || videoData.file_code,
        description: '',
        thumbnail_url: videoData.player_img || null,
        duration: videoData.file_length ? parseInt(videoData.file_length) : null,
        views: videoData.file_views ? parseInt(videoData.file_views) : 0,
        status: videoData.canplay === 1 ? 'active' : 'processing',
        upload_date: videoData.file_created || new Date().toISOString(),
        provider_data: {
          file_public: videoData.file_public,
          file_adult: videoData.file_adult,
          cat_id: videoData.cat_id,
          file_fld_id: videoData.file_fld_id,
          tags: videoData.tags,
          file_premium_only: videoData.file_premium_only
        }
      }, {
        onConflict: 'file_code,provider'
      });

    if (error) {
      console.error('Error syncing video to database:', error);
    }
  }
  
  return data;
}

async function getVideoList(page = 1, perPage = 50) {
  const response = await fetch(`https://lulustream.com/api/file/list?key=${luluStreamApiKey}&page=${page}&per_page=${perPage}`);
  const data = await response.json();
  
  if (data.status !== 200) {
    throw new Error(data.msg || 'Failed to get video list');
  }
  
  return data;
}

async function getUploadServer() {
  const response = await fetch(`https://lulustream.com/api/upload/server?key=${luluStreamApiKey}`);
  const data = await response.json();
  
  if (data.status !== 200) {
    throw new Error(data.msg || 'Failed to get upload server');
  }
  
  return data;
}

async function uploadVideo(uploadUrl: string, fileData: number[], fileName: string, fileType: string, fileTitle: string) {
  try {
    // Recreate the file from the data
    const uint8Array = new Uint8Array(fileData);
    const blob = new Blob([uint8Array], { type: fileType });
    
    const form = new FormData();
    form.append('key', luluStreamApiKey!);
    form.append('file', blob, fileName);
    if (fileTitle) {
      form.append('file_title', fileTitle);
    }
    // Make file public by default
    form.append('file_public', '1');

    console.log(`Uploading file to LuluStream: ${uploadUrl}`);
    console.log(`File name: ${fileName}, size: ${blob.size} bytes`);
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: form
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('LuluStream upload response:', data);
    
    if (data.status !== 200) {
      throw new Error(data.msg || 'Upload failed');
    }
    
    // According to API docs, response format is:
    // { "msg": "OK", "status": 200, "files": [{"filecode": "...", "filename": "...", "status": "OK"}] }
    if (!data.files || !data.files[0] || !data.files[0].filecode) {
      throw new Error('Invalid response format: missing filecode');
    }
    
    return {
      success: true,
      file_code: data.files[0].filecode,
      status: 200,
      msg: data.msg,
      result: data.files
    };
  } catch (error) {
    console.error('LuluStream upload error:', error);
    throw error;
  }
}

async function generateDirectLink(fileCode: string) {
  // LuluStream direct links - this may need to be adjusted based on their premium features
  // For now, return embed URL as LuluStream may not have direct download like Doodstream
  return `https://lulustream.com/e/${fileCode}`;
}

async function syncVideos() {
  let page = 1;
  const perPage = 50;
  let totalSynced = 0;
  let hasMore = true;

  while (hasMore) {
    try {
      const response = await fetch(`https://lulustream.com/api/file/list?key=${luluStreamApiKey}&page=${page}&per_page=${perPage}`);
      const data = await response.json();
      
      if (data.status !== 200) {
        console.error('Error fetching video list:', data.msg);
        break;
      }

      const videos = data.result?.files || [];
      
      if (videos.length === 0) {
        hasMore = false;
        break;
      }

      // Process videos in batches
      const videoInserts = videos.map((video: any) => ({
        file_code: video.file_code,
        provider: 'lulustream',
        title: video.title || video.file_code,
        original_title: video.title || video.file_code,
        description: '',
        thumbnail_url: video.thumbnail || null,
        duration: video.length ? parseInt(video.length) : null,
        views: video.views ? parseInt(video.views) : 0,
        status: video.canplay === 1 ? 'active' : 'processing',
        upload_date: video.uploaded || new Date().toISOString(),
        provider_data: {
          public: video.public,
          fld_id: video.fld_id,
          link: video.link
        }
      }));

      const { error } = await supabase
        .from('videos')
        .upsert(videoInserts, {
          onConflict: 'file_code,provider',
          ignoreDuplicates: false
        });

      if (error) {
        console.error('Error inserting videos:', error);
      } else {
        totalSynced += videos.length;
      }

      page++;
      
      // Check if we have more pages
      if (page > (data.result?.pages || 1)) {
        hasMore = false;
      }
      
    } catch (error) {
      console.error('Error in sync loop:', error);
      break;
    }
  }

  return {
    success: true,
    totalSynced,
    message: `Successfully synced ${totalSynced} videos from LuluStream`
  };
}