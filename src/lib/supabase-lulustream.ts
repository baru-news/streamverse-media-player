import { supabase } from "@/integrations/supabase/client";

export interface LuluStreamResponse {
  msg: string;
  server_time: string;
  status: number;
  result?: any;
}

export class SecureLuluStreamAPI {
  /**
   * Get account information from LuluStream
   */
  static async getAccountInfo(): Promise<any> {
    const { data, error } = await supabase.functions.invoke('lulustream-api', {
      body: { action: 'getAccountInfo' }
    });

    if (error) throw error;
    return data;
  }

  /**
   * Get video information by file code
   */
  static async getVideoInfo(fileCode: string, syncToDatabase = false): Promise<any> {
    const { data, error } = await supabase.functions.invoke('lulustream-api', {
      body: { 
        action: 'getVideoInfo', 
        fileCode, 
        syncToDatabase 
      }
    });

    if (error) throw error;
    return data;
  }

  /**
   * Get list of videos with pagination
   */
  static async getVideoList(page = 1, perPage = 50): Promise<any[]> {
    const { data, error } = await supabase.functions.invoke('lulustream-api', {
      body: { 
        action: 'getVideoList', 
        page, 
        perPage 
      }
    });

    if (error) throw error;
    return data?.result?.files || [];
  }

  /**
   * Get upload server URL
   */
  static async getUploadServer(): Promise<any> {
    const { data, error } = await supabase.functions.invoke('lulustream-api', {
      body: { action: 'getUploadServer' }
    });

    if (error) throw error;
    return data;
  }

  /**
   * Upload video to LuluStream
   */
  static async uploadVideo(file: File, title?: string): Promise<any> {
    // First get upload server
    const serverResponse = await this.getUploadServer();
    const uploadUrl = serverResponse.result;

    // Convert file to base64 for transmission to edge function
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const fileData = Array.from(uint8Array);

    const { data, error } = await supabase.functions.invoke('lulustream-api', {
      body: { 
        action: 'uploadVideo',
        uploadUrl,
        fileData: fileData,
        fileName: file.name,
        fileType: file.type,
        fileTitle: title || file.name
      }
    });

    if (error) throw error;
    return data;
  }

  /**
   * Generate direct link for video download
   */
  static async generateDirectLink(fileCode: string): Promise<string | null> {
    try {
      const { data, error } = await supabase.functions.invoke('lulustream-api', {
        body: { 
          action: 'generateDirectLink', 
          fileCode 
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error generating direct link:', error);
      return null;
    }
  }

  /**
   * Sync videos from LuluStream to database
   */
  static async syncVideos(): Promise<any> {
    const { data, error } = await supabase.functions.invoke('lulustream-api', {
      body: { action: 'syncVideos' }
    });

    if (error) throw error;
    return data;
  }

  /**
   * Get videos from database with LuluStream provider
   */
  static async getVideosFromDatabase(page = 1, perPage = 50): Promise<any[]> {
    const offset = (page - 1) * perPage;
    
    const { data, error } = await supabase
      .from('videos')
      .select(`
        *,
        categories:category_id (id, name, color),
        video_hashtags (
          hashtag_id,
          hashtags (id, name, color)
        )
      `)
      .eq('provider', 'lulustream')
      .order('created_at', { ascending: false })
      .range(offset, offset + perPage - 1);

    if (error) throw error;
    return data || [];
  }

  /**
   * Get videos by hashtag from database
   */
  static async getVideosFromDatabaseByHashtag(hashtagId: string, page = 1, perPage = 50): Promise<any[]> {
    const offset = (page - 1) * perPage;
    
    const { data, error } = await supabase
      .from('videos')
      .select(`
        *,
        categories:category_id (id, name, color),
        video_hashtags!inner (
          hashtag_id,
          hashtags (id, name, color)
        )
      `)
      .eq('provider', 'lulustream')
      .eq('video_hashtags.hashtag_id', hashtagId)
      .order('created_at', { ascending: false })
      .range(offset, offset + perPage - 1);

    if (error) throw error;
    return data || [];
  }

  /**
   * Get videos by category from database
   */
  static async getVideosFromDatabaseByCategory(categoryId: string, page = 1, perPage = 50): Promise<any[]> {
    const offset = (page - 1) * perPage;
    
    const { data, error } = await supabase
      .from('videos')
      .select(`
        *,
        categories:category_id (id, name, color),
        video_hashtags (
          hashtag_id,
          hashtags (id, name, color)
        )
      `)
      .eq('provider', 'lulustream')
      .eq('category_id', categoryId)
      .order('created_at', { ascending: false })
      .range(offset, offset + perPage - 1);

    if (error) throw error;
    return data || [];
  }

  /**
   * Search videos with filters from database
   */
  static async getVideosFromDatabaseBySearch(
    searchQuery?: string,
    hashtagId?: string,
    categoryId?: string,
    page = 1,
    perPage = 50
  ): Promise<any[]> {
    const offset = (page - 1) * perPage;
    
    let query = supabase
      .from('videos')
      .select(`
        *,
        categories:category_id (id, name, color),
        video_hashtags (
          hashtag_id,
          hashtags (id, name, color)
        )
      `)
      .eq('provider', 'lulustream');

    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
    }

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    if (hashtagId) {
      query = query.eq('video_hashtags.hashtag_id', hashtagId);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + perPage - 1);

    if (error) throw error;
    return data || [];
  }

  /**
   * Get single video by file code from database
   */
  static async getVideoByFileCode(fileCode: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('videos')
      .select(`
        *,
        categories:category_id (id, name, color),
        video_hashtags (
          hashtag_id,
          hashtags (id, name, color)
        )
      `)
      .eq('provider', 'lulustream')
      .eq('file_code', fileCode)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  /**
   * Get total count of LuluStream videos in database
   */
  static async getTotalVideosCount(
    searchQuery?: string,
    hashtagId?: string,
    categoryId?: string
  ): Promise<number> {
    let query = supabase
      .from('videos')
      .select('*', { count: 'exact', head: true })
      .eq('provider', 'lulustream');

    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
    }

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    if (hashtagId) {
      query = query.eq('video_hashtags.hashtag_id', hashtagId);
    }

    const { count, error } = await query;

    if (error) throw error;
    return count || 0;
  }

  /**
   * Generate embed HTML for LuluStream video
   */
  static generateEmbedHTML(fileCode: string, width = 640, height = 360): string {
    const embedUrl = this.generateEmbedURL(fileCode);
    return `<iframe src="${embedUrl}" width="${width}" height="${height}" frameborder="0" allowfullscreen></iframe>`;
  }

  /**
   * Generate embed URL for LuluStream video
   */
  static generateEmbedURL(fileCode: string, autoplay = false): string {
    const baseUrl = `https://lulustream.com/e/${fileCode}`;
    const params = new URLSearchParams();
    
    if (autoplay) {
      params.append('autoplay', '1');
    }
    
    return params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
  }
}

// Helper functions
export function getLuluStreamEmbedUrl(fileCode: string, autoplay = false): string {
  return SecureLuluStreamAPI.generateEmbedURL(fileCode, autoplay);
}

export function getLuluStreamEmbedHTML(fileCode: string, width = 640, height = 360): string {
  return SecureLuluStreamAPI.generateEmbedHTML(fileCode, width, height);
}