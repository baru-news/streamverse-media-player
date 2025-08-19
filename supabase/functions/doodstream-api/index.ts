import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get Doodstream API key from Supabase secrets
    const DOODSTREAM_API_KEY = Deno.env.get('DOODSTREAM_API_KEY')
    
    if (!DOODSTREAM_API_KEY) {
      throw new Error('DOODSTREAM_API_KEY not configured in Supabase secrets')
    }

    const { action, fileCode, page = 1, perPage = 10 } = await req.json()

    const baseUrl = 'https://doodapi.com/api'
    let url = ''
    let responseData = null

    switch (action) {
      case 'getVideoInfo':
        if (!fileCode) {
          throw new Error('fileCode is required for getVideoInfo')
        }
        url = `${baseUrl}/file/info?key=${DOODSTREAM_API_KEY}&file_code=${fileCode}`
        break

      case 'getVideoList':
        url = `${baseUrl}/file/list?key=${DOODSTREAM_API_KEY}&page=${page}&per_page=${perPage}`
        break

      case 'getAccountInfo':
        url = `${baseUrl}/account/info?key=${DOODSTREAM_API_KEY}`
        break

      case 'getUploadServer':
        url = `${baseUrl}/upload/server?key=${DOODSTREAM_API_KEY}`
        break

      case 'generateDirectLink':
        if (!fileCode) {
          throw new Error('fileCode is required for generateDirectLink')
        }
        url = `${baseUrl}/file/direct_link?key=${DOODSTREAM_API_KEY}&file_code=${fileCode}`
        break

      default:
        throw new Error(`Unknown action: ${action}`)
    }

    // Make request to Doodstream API
    const response = await fetch(url)
    responseData = await response.json()

    // Process the response based on action
    let processedData = responseData

    if (action === 'getVideoInfo' && responseData.success && responseData.result?.length > 0) {
      const video = responseData.result[0]
      processedData = {
        success: true,
        result: {
          id: video.file_code,
          title: video.title,
          status: video.status,
          embed_url: `https://dood.re/e/${video.file_code}`,
          download_url: video.download_url,
          splash_img: video.splash_img,
          duration: video.length,
          size: video.size,
          views: parseInt(video.views) || 0,
          uploaded: video.uploaded
        }
      }
    }

    if (action === 'getVideoList' && responseData.success && responseData.result?.files) {
      processedData = {
        success: true,
        result: responseData.result.files.map((video: any) => ({
          id: video.file_code,
          title: video.title,
          status: video.status,
          embed_url: `https://dood.re/e/${video.file_code}`,
          download_url: video.download_url,
          splash_img: video.splash_img,
          duration: video.length,
          size: video.size,
          views: parseInt(video.views) || 0,
          uploaded: video.uploaded
        }))
      }
    }

    return new Response(
      JSON.stringify(processedData),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Doodstream API Error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})