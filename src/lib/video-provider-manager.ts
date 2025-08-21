import { SecureDoodstreamAPI } from "@/lib/supabase-doodstream";

export type VideoProvider = 'doodstream';

export interface VideoProviderConfig {
  name: string;
  displayName: string;
  uploadSupported: boolean;
  directDownloadSupported: boolean;
}

export class VideoProviderManager {
  private static readonly providers: Record<VideoProvider, VideoProviderConfig> = {
    doodstream: {
      name: 'doodstream',
      displayName: 'DoodStream',
      uploadSupported: true,
      directDownloadSupported: true,
    }
  };

  private static readonly apis = {
    doodstream: SecureDoodstreamAPI,
  };

  /**
   * Get all available providers
   */
  static getAllProviders(): VideoProviderConfig[] {
    return Object.values(this.providers);
  }

  /**
   * Get provider configuration
   */
  static getProviderConfig(provider: VideoProvider): VideoProviderConfig {
    return this.providers[provider];
  }

  /**
   * Detect provider from file code or URL
   */
  static detectProvider(fileCodeOrUrl: string): VideoProvider | null {
    if (fileCodeOrUrl.includes('doodstream') || fileCodeOrUrl.includes('dood')) {
      return 'doodstream';
    }
    return 'doodstream'; // Default fallback
  }

  /**
   * Get account info for a provider
   */
  static async getAccountInfo(provider: VideoProvider): Promise<any> {
    const api = this.apis[provider];
    return api.getAccountInfo();
  }

  /**
   * Get video info from a provider
   */
  static async getVideoInfo(provider: VideoProvider, fileCode: string, syncToDatabase = false): Promise<any> {
    const api = this.apis[provider];
    return api.getVideoInfo(fileCode, syncToDatabase);
  }

  /**
   * Get video list from a provider
   */
  static async getVideoList(provider: VideoProvider, page = 1, perPage = 50): Promise<any[]> {
    const api = this.apis[provider];
    return api.getVideoList(page, perPage);
  }

  /**
   * Upload video to a provider
   */
  static async uploadVideo(provider: VideoProvider, file: File, title?: string): Promise<any> {
    const config = this.getProviderConfig(provider);
    
    if (!config.uploadSupported) {
      throw new Error(`Upload not supported for provider: ${provider}`);
    }

    const api = this.apis[provider];
    return api.uploadVideo(file, title);
  }

  /**
   * Generate direct download link
   */
  static async generateDirectLink(provider: VideoProvider, fileCode: string): Promise<string | null> {
    const config = this.getProviderConfig(provider);
    
    if (!config.directDownloadSupported) {
      console.warn(`Direct download not supported for provider: ${provider}`);
      return null;
    }

    const api = this.apis[provider];
    return api.generateDirectLink(fileCode);
  }

  /**
   * Sync videos from a provider
   */
  static async syncVideos(provider: VideoProvider): Promise<any> {
    const api = this.apis[provider];
    return api.syncVideos();
  }

  /**
   * Get videos from database by provider
   */
  static async getVideosFromDatabase(provider: VideoProvider, page = 1, perPage = 50): Promise<any[]> {
    const api = this.apis[provider];
    return api.getVideosFromDatabase(page, perPage);
  }

  /**
   * Search videos across all providers or a specific provider
   */
  static async searchVideos(
    searchQuery?: string,
    hashtagId?: string,
    categoryId?: string,
    provider?: VideoProvider,
    page = 1,
    perPage = 50
  ): Promise<any[]> {
    if (provider) {
      // Search in specific provider
      const api = this.apis[provider];
      return api.getVideosFromDatabaseBySearch(searchQuery, hashtagId, categoryId, page, perPage);
    } else {
      // Search in DoodStream only
      return SecureDoodstreamAPI.getVideosFromDatabaseBySearch(searchQuery, hashtagId, categoryId, page, perPage);
    }
  }

  /**
   * Generate embed URL for a video
   */
  static generateEmbedURL(provider: VideoProvider, fileCode: string, autoplay = false): string {
    const api = this.apis[provider];
    return api.generateEmbedURL(fileCode, autoplay);
  }

  /**
   * Generate embed HTML for a video
   */
  static generateEmbedHTML(provider: VideoProvider, fileCode: string, width = 640, height = 360): string {
    const api = this.apis[provider];
    return api.generateEmbedHTML(fileCode, width, height);
  }
}