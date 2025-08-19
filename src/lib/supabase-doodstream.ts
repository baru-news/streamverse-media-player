// Secure Doodstream API integration using Supabase Edge Functions
// This approach keeps API keys secure on the server side
// NOTE: This requires Supabase integration to be enabled first

// Uncomment this import after Supabase integration is complete:
// import { supabase } from "@/integrations/supabase/client";

interface DoodstreamAPIResponse {
  success: boolean;
  result?: any;
  error?: string;
}

export class SecureDoodstreamAPI {
  
  // 1. Get video information securely
  static async getVideoInfo(fileCode: string): Promise<any> {
    try {
      // TODO: Uncomment after Supabase integration
      /*
      const { data, error } = await supabase.functions.invoke('doodstream-api', {
        body: { 
          action: 'getVideoInfo', 
          fileCode 
        }
      });

      if (error) throw error;
      
      if (data?.success) {
        return data.result;
      } else {
        throw new Error(data?.error || 'Failed to get video info');
      }
      */
      
      // Temporary placeholder until Supabase is integrated
      throw new Error('Supabase integration required. Please integrate Supabase first.');
    } catch (error) {
      console.error('Get video info error:', error);
      throw error;
    }
  }

  // 2. Get video list securely
  static async getVideoList(page: number = 1, perPage: number = 10): Promise<any[]> {
    try {
      // TODO: Uncomment after Supabase integration
      /*
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
      */
      
      // Temporary placeholder until Supabase is integrated
      console.warn('Supabase integration required for video list');
      return [];
    } catch (error) {
      console.error('Get video list error:', error);
      return [];
    }
  }

  // 3. Get account information securely
  static async getAccountInfo(): Promise<any> {
    try {
      // TODO: Uncomment after Supabase integration
      /*
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
      */
      
      // Temporary placeholder until Supabase is integrated
      return null;
    } catch (error) {
      console.error('Get account info error:', error);
      throw error;
    }
  }

  // 4. Get upload server securely
  static async getUploadServer(): Promise<any> {
    try {
      // TODO: Uncomment after Supabase integration
      /*
      const { data, error } = await supabase.functions.invoke('doodstream-api', {
        body: { 
          action: 'getUploadServer' 
        }
      });

      if (error) throw error;
      
      if (data?.success) {
        return data;
      } else {
        throw new Error(data?.error || 'Failed to get upload server');
      }
      */
      
      // Temporary placeholder until Supabase is integrated
      throw new Error('Supabase integration required');
    } catch (error) {
      console.error('Get upload server error:', error);
      throw error;
    }
  }

  // 5. Generate direct link securely (Premium feature)
  static async generateDirectLink(fileCode: string): Promise<string | null> {
    try {
      // TODO: Uncomment after Supabase integration
      /*
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
      */
      
      return null;
    } catch (error) {
      console.error('Generate direct link error:', error);
      return null;
    }
  }

  // 6. Upload video with secure API handling
  static async uploadVideo(file: File, title?: string, folder?: string): Promise<any> {
    try {
      // Step 1: Get upload server
      const serverData = await this.getUploadServer();
      
      if (!serverData.upload_url) {
        throw new Error('Failed to get upload server');
      }

      // Step 2: Upload file directly to Doodstream
      // Note: This still requires the API key to be sent with the file
      // For maximum security, consider implementing a proxy upload through edge functions
      const formData = new FormData();
      formData.append('file', file);
      if (title) formData.append('title', title);
      if (folder) formData.append('fld_id', folder);

      // This would need to be handled through the edge function for complete security
      // For now, we'll throw an error to indicate this needs backend implementation
      throw new Error('Direct upload needs to be implemented through edge functions for security');

    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  // 7. Generate embed HTML
  static generateEmbedHTML(fileCode: string, width: number = 640, height: number = 360): string {
    return `<iframe src="https://dood.re/e/${fileCode}" width="${width}" height="${height}" frameborder="0" allowfullscreen></iframe>`;
  }

  // 8. Generate embed URL
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
