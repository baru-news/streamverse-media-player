import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET',
  'Content-Type': 'application/xml'
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get all active videos
    const { data: videos, error } = await supabase
      .from('videos')
      .select('file_code, title, upload_date, updated_at')
      .eq('status', 'active')
      .order('upload_date', { ascending: false })

    if (error) {
      throw error
    }

    // Base URL - in production, this should be the actual domain
    const baseUrl = 'https://11cc05e7-b7b1-4d35-9388-063b8de4e12a.sandbox.lovable.dev'
    
    // Generate sitemap XML
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  
  <!-- Main Pages -->
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/sitemap</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/login</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/register</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  
  <!-- Video Pages -->
${videos?.map(video => {
  const lastModified = video.updated_at 
    ? new Date(video.updated_at).toISOString().split('T')[0]
    : new Date(video.upload_date).toISOString().split('T')[0]
  
  return `  <url>
    <loc>${baseUrl}/video/${video.file_code}</loc>
    <lastmod>${lastModified}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <video:video>
      <video:thumbnail_loc>https://img.doodcdn.io/snaps/${video.file_code}.jpg</video:thumbnail_loc>
      <video:title>${video.title ? video.title.replace(/[<>&"']/g, (char) => {
        const escapes: { [key: string]: string } = {
          '<': '&lt;',
          '>': '&gt;',
          '&': '&amp;',
          '"': '&quot;',
          "'": '&#39;'
        }
        return escapes[char]
      }) : 'Video'}</video:title>
      <video:description>Tonton video ${video.title || 'menarik'} di DINO18 - Platform streaming video berkualitas tinggi dengan Doodstream</video:description>
      <video:content_loc>https://doodstream.com/e/${video.file_code}</video:content_loc>
      <video:player_loc>https://doodstream.com/e/${video.file_code}</video:player_loc>
      <video:duration>0</video:duration>
      <video:publication_date>${new Date(video.upload_date).toISOString()}</video:publication_date>
    </video:video>
    <image:image>
      <image:loc>https://img.doodcdn.io/snaps/${video.file_code}.jpg</image:loc>
      <image:title>${video.title ? video.title.replace(/[<>&"']/g, (char) => {
        const escapes: { [key: string]: string } = {
          '<': '&lt;',
          '>': '&gt;',
          '&': '&amp;',
          '"': '&quot;',
          "'": '&#39;'
        }
        return escapes[char]
      }) : 'Video Thumbnail'}</image:title>
    </image:image>
  </url>`
}).join('\n') || ''}

</urlset>`

    return new Response(sitemap, {
      headers: corsHeaders,
      status: 200
    })

  } catch (error) {
    console.error('Error generating sitemap:', error)
    return new Response('Error generating sitemap', { 
      status: 500,
      headers: corsHeaders 
    })
  }
})