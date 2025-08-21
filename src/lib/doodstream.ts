// Doodstream API Integration
// PENTING: API key harus disimpan dengan aman di Supabase, bukan di kode

interface DoodstreamConfig {
  apiKey: string;
  baseUrl: string;
}

interface DoodstreamVideo {
  id: string;
  title: string;
  status: string;
  embed_url: string;
  download_url: string;
  splash_img: string;
  duration: string;
  size: string;
  views: number;
  uploaded: string;
}

interface UploadResponse {
  success: boolean;
  file_code?: string;
  download_url?: string;
  error?: string;
}

export class DoodstreamAPI {
  private config: DoodstreamConfig;

  constructor(apiKey: string) {
    this.config = {
      apiKey,
      baseUrl: 'https://doodapi.co/api'
    };
  }

  // 1. Upload Video ke Doodstream
  async uploadVideo(file: File, title?: string, folder?: string): Promise<UploadResponse> {
    try {
      // Langkah 1: Dapatkan upload server
      const serverResponse = await fetch(`${this.config.baseUrl}/upload/server?key=${this.config.apiKey}`);
      const serverData = await serverResponse.json();

      if (!serverData.success) {
        throw new Error('Gagal mendapatkan upload server');
      }

      // Langkah 2: Upload file
      const formData = new FormData();
      formData.append('api_key', this.config.apiKey);
      formData.append('file', file);
      if (title) formData.append('title', title);
      if (folder) formData.append('fld_id', folder);

      const uploadResponse = await fetch(serverData.upload_url, {
        method: 'POST',
        body: formData
      });

      const uploadResult = await uploadResponse.json();
      
      return {
        success: uploadResult.success,
        file_code: uploadResult.file_code,
        download_url: uploadResult.download_url,
        error: uploadResult.error
      };

    } catch (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload gagal'
      };
    }
  }

  // 2. Mendapatkan Info Video
  async getVideoInfo(fileCode: string): Promise<DoodstreamVideo | null> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/file/info?key=${this.config.apiKey}&file_code=${fileCode}`
      );
      
      const data = await response.json();
      
      if (data.success && data.result && data.result.length > 0) {
        const video = data.result[0];
        return {
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
        };
      }
      
      return null;
    } catch (error) {
      console.error('Get video info error:', error);
      return null;
    }
  }

  // 3. Mendapatkan Daftar Video
  async getVideoList(page: number = 1, perPage: number = 10, folderId?: string): Promise<DoodstreamVideo[]> {
    try {
      let url = `${this.config.baseUrl}/file/list?key=${this.config.apiKey}&page=${page}&per_page=${perPage}`;
      if (folderId) {
        url += `&fld_id=${folderId}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.success && data.result && data.result.files) {
        return data.result.files.map((video: any) => ({
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
        }));
      }

      return [];
    } catch (error) {
      console.error('Get video list error:', error);
      return [];
    }
  }

  // 4. Mendapatkan Akun Info
  async getAccountInfo() {
    try {
      const response = await fetch(`${this.config.baseUrl}/account/info?key=${this.config.apiKey}`);
      const data = await response.json();
      
      if (data.success) {
        return {
          email: data.result.email,
          balance: data.result.balance,
          storage_used: data.result.storage_used,
          storage_left: data.result.storage_left,
          premium_expire: data.result.premium_expire
        };
      }
      
      return null;
    } catch (error) {
      console.error('Get account info error:', error);
      return null;
    }
  }

  // 5. Generate Embed HTML
  generateEmbedHTML(fileCode: string, width: number = 640, height: number = 360): string {
    return `<iframe src="https://dood.re/e/${fileCode}" width="${width}" height="${height}" frameborder="0" allowfullscreen></iframe>`;
  }

  // 6. Generate Direct Link (Premium feature)
  async generateDirectLink(fileCode: string): Promise<string | null> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/file/direct_link?key=${this.config.apiKey}&file_code=${fileCode}`
      );
      
      const data = await response.json();
      
      if (data.success && data.result && data.result.length > 0) {
        return data.result[0].direct_link;
      }
      
      return null;
    } catch (error) {
      console.error('Generate direct link error:', error);
      return null;
    }
  }
}

// Helper function untuk inisialisasi API (akan menggunakan Supabase untuk API key)
export const initializeDoodstream = (apiKey: string) => {
  return new DoodstreamAPI(apiKey);
};

// Tipe data untuk komponen React
export type { DoodstreamVideo, UploadResponse };