// Secure Doodstream API integration using Supabase Edge Functions
// This approach keeps API keys secure on the server side

import { supabase } from "@/integrations/supabase/client";

interface DoodstreamAPIResponse {
  success: boolean;
  result?: any;
  error?: string;
}

export class SecureDoodstreamAPI {
  
  // 1. Get video information securely
  static async getVideoInfo(fileCode: string, syncToDatabase: boolean = false): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('doodstream-api', {
        body: { 
          action: 'getVideoInfo', 
          fileCode,
          syncToDatabase
        }
      });

      if (error) throw error;
      
      if (data?.success) {
        return data.result;
      } else {
        throw new Error(data?.error || 'Failed to get video info');
      }
    } catch (error) {
      console.error('Get video info error:', error);
      throw error;
    }
  }

  // 2. Get video list securely
  static async getVideoList(page: number = 1, perPage: number = 10): Promise<any[]> {
    try {
      const { data, error } = await supabase.functions.invoke('doodstream-api', {
        body: { 
          action: 'getVideoList', 
          page, 
          perPage 
        }
      });

      if (error) throw error;
      
      if (data?.success) {
        return data.result || [];
      } else {
        throw new Error(data?.error || 'Failed to get video list');
      }
    } catch (error) {
      console.error('Get video list error:', error);
      return [];
    }
  }

  // 3. Get account information securely
  static async getAccountInfo(): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('doodstream-api', {
        body: { 
          action: 'getAccountInfo' 
        }
      });

      if (error) throw error;
      
      if (data?.success) {
        return data.result;
      } else {
        throw new Error(data?.error || 'Failed to get account info');
      }
    } catch (error) {
      console.error('Get account info error:', error);
      throw error;
    }
  }

  // 4. Upload video securely
  static async uploadVideo(file: File, title?: string): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title || file.name.replace(/\.[^/.]+$/, ""));

      const { data, error } = await supabase.functions.invoke('doodstream-api', {
        body: formData
      });

      if (error) throw error;
      
      if (data?.success) {
        return {
          success: true,
          file_code: data.result?.file_code,
          message: data.result?.message
        };
      } else {
        return {
          success: false,
          error: data?.error || 'Upload failed'
        };
      }
    } catch (error) {
      console.error('Upload video error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  // 5. Get upload server securely
  static async getUploadServer(): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('doodstream-api', {
        body: { 
          action: 'getUploadServer' 
        }
      });

      if (error) throw error;
      
      if (data?.success) {
        return data.result;
      } else {
        throw new Error(data?.error || 'Failed to get upload server');
      }
    } catch (error) {
      console.error('Get upload server error:', error);
      throw error;
    }
  }

  // 6. Generate direct link securely (Premium feature)
  static async generateDirectLink(fileCode: string): Promise<string | null> {
    try {
      const { data, error } = await supabase.functions.invoke('doodstream-api', {
        body: { 
          action: 'generateDirectLink',
          fileCode 
        }
      });

      if (error) throw error;
      
      if (data?.success && data.result?.length > 0) {
        return data.result[0].direct_link;
      }
      
      return null;
    } catch (error) {
      console.error('Generate direct link error:', error);
      return null;
    }
  }

  // 7. Sync videos from Doodstream to database
  static async syncVideos(): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('doodstream-api', {
        body: { 
          action: 'syncVideos'
        }
      });

      if (error) throw error;
      
      if (data?.success) {
        return data.result;
      } else {
        throw new Error(data?.error || 'Failed to sync videos');
      }
    } catch (error) {
      console.error('Sync videos error:', error);
      throw error;
    }
  }

  // 8. Get videos from database
  static async getVideosFromDatabase(limit: number = 12): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .order('upload_date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get videos from database error:', error);
      return [];
    }
  }

  // 9. Get videos from database filtered by hashtag
  static async getVideosFromDatabaseByHashtag(hashtagId: string, limit: number = 12): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select(`
          *,
          video_hashtags!inner(
            hashtag_id
          )
        `)
        .eq('video_hashtags.hashtag_id', hashtagId)
        .order('upload_date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get videos by hashtag from database error:', error);
      return [];
    }
  }

  // 10. Get videos from database filtered by search query
  static async getVideosFromDatabaseBySearch(searchQuery: string, hashtagId?: string, limit: number = 12): Promise<any[]> {
    try {
      let query = supabase
        .from('videos')
        .select(`
          *,
          video_hashtags (
            hashtag_id,
            hashtags (
              id,
              name,
              color
            )
          )
        `);

      // Add search filter
      if (searchQuery.trim()) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      // Add hashtag filter if provided
      if (hashtagId) {
        query = query.eq('video_hashtags.hashtag_id', hashtagId);
      }

      const { data, error } = await query
        .order('upload_date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get videos by search from database error:', error);
      return [];
    }
  }

  // 11. Generate embed HTML
  static generateEmbedHTML(fileCode: string, width: number = 640, height: number = 360): string {
    return `<iframe src="https://dood.re/e/${fileCode}" width="${width}" height="${height}" frameborder="0" allowfullscreen></iframe>`;
  }

  // 12. Generate embed URL
  static generateEmbedURL(fileCode: string, autoplay: boolean = false): string {
    return `https://dood.re/e/${fileCode}${autoplay ? '?autoplay=1' : ''}`;
  }
}

// Helper functions
export const getDoodstreamEmbedUrl = (fileCode: string, autoplay: boolean = false) => {
  return SecureDoodstreamAPI.generateEmbedURL(fileCode, autoplay);
};

export const getDoodstreamEmbedHTML = (fileCode: string, width: number = 640, height: number = 360) => {
  return SecureDoodstreamAPI.generateEmbedHTML(fileCode, width, height);
};
