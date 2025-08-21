import { SecureDoodstreamAPI } from "@/lib/supabase-doodstream";
import { SecureLuluStreamAPI } from "@/lib/supabase-lulustream";

export type VideoProvider = 'doodstream' | 'lulustream';

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
    },
    lulustream: {
      name: 'lulustream',
      displayName: 'LuluStream',
      uploadSupported: true,
      directDownloadSupported: false, // LuluStream may not support direct downloads like Doodstream
    }
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
    // Simple detection logic - can be enhanced
    if (fileCodeOrUrl.includes('doodstream') || fileCodeOrUrl.includes('dood')) {
      return 'doodstream';
    }
    if (fileCodeOrUrl.includes('lulustream') || fileCodeOrUrl.includes('lulu')) {
      return 'lulustream';
    }
    
    // Default to doodstream for backward compatibility
    return 'doodstream';
  }

  /**
   * Get account info for a provider
   */
  static async getAccountInfo(provider: VideoProvider): Promise<any> {
    switch (provider) {
      case 'doodstream':
        return SecureDoodstreamAPI.getAccountInfo();
      case 'lulustream':
        return SecureLuluStreamAPI.getAccountInfo();
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  /**
   * Get video info from a provider
   */
  static async getVideoInfo(provider: VideoProvider, fileCode: string, syncToDatabase = false): Promise<any> {
    switch (provider) {
      case 'doodstream':
        return SecureDoodstreamAPI.getVideoInfo(fileCode, syncToDatabase);
      case 'lulustream':
        return SecureLuluStreamAPI.getVideoInfo(fileCode, syncToDatabase);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  /**
   * Get video list from a provider
   */
  static async getVideoList(provider: VideoProvider, page = 1, perPage = 50): Promise<any[]> {
    switch (provider) {
      case 'doodstream':
        return SecureDoodstreamAPI.getVideoList(page, perPage);
      case 'lulustream':
        return SecureLuluStreamAPI.getVideoList(page, perPage);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  /**
   * Upload video to a provider
   */
  static async uploadVideo(provider: VideoProvider, file: File, title?: string): Promise<any> {
    const config = this.getProviderConfig(provider);
    
    if (!config.uploadSupported) {
      throw new Error(`Upload not supported for provider: ${provider}`);
    }

    switch (provider) {
      case 'doodstream':
        return SecureDoodstreamAPI.uploadVideo(file, title);
      case 'lulustream':
        return SecureLuluStreamAPI.uploadVideo(file, title);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
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

    switch (provider) {
      case 'doodstream':
        return SecureDoodstreamAPI.generateDirectLink(fileCode);
      case 'lulustream':
        return SecureLuluStreamAPI.generateDirectLink(fileCode);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  /**
   * Sync videos from a provider
   */
  static async syncVideos(provider: VideoProvider): Promise<any> {
    switch (provider) {
      case 'doodstream':
        return SecureDoodstreamAPI.syncVideos();
      case 'lulustream':
        return SecureLuluStreamAPI.syncVideos();
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  /**
   * Get videos from database by provider
   */
  static async getVideosFromDatabase(provider: VideoProvider, page = 1, perPage = 50): Promise<any[]> {
    switch (provider) {
      case 'doodstream':
        return SecureDoodstreamAPI.getVideosFromDatabase(page, perPage);
      case 'lulustream':
        return SecureLuluStreamAPI.getVideosFromDatabase(page, perPage);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
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
      switch (provider) {
        case 'doodstream':
          return SecureDoodstreamAPI.getVideosFromDatabaseBySearch(searchQuery, hashtagId, categoryId, page, perPage);
        case 'lulustream':
          return SecureLuluStreamAPI.getVideosFromDatabaseBySearch(searchQuery, hashtagId, categoryId, page, perPage);
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }
    } else {
      // Search across all providers and merge results
      const [doodstreamResults, luluStreamResults] = await Promise.allSettled([
        SecureDoodstreamAPI.getVideosFromDatabaseBySearch(searchQuery, hashtagId, categoryId, page, perPage),
        SecureLuluStreamAPI.getVideosFromDatabaseBySearch(searchQuery, hashtagId, categoryId, page, perPage)
      ]);

      const results: any[] = [];
      
      if (doodstreamResults.status === 'fulfilled') {
        results.push(...doodstreamResults.value);
      }
      
      if (luluStreamResults.status === 'fulfilled') {
        results.push(...luluStreamResults.value);
      }

      // Sort by created_at descending
      return results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  }

  /**
   * Generate embed URL for a video
   */
  static generateEmbedURL(provider: VideoProvider, fileCode: string, autoplay = false): string {
    switch (provider) {
      case 'doodstream':
        return SecureDoodstreamAPI.generateEmbedURL(fileCode, autoplay);
      case 'lulustream':
        return SecureLuluStreamAPI.generateEmbedURL(fileCode, autoplay);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  /**
   * Generate embed HTML for a video
   */
  static generateEmbedHTML(provider: VideoProvider, fileCode: string, width = 640, height = 360): string {
    switch (provider) {
      case 'doodstream':
        return SecureDoodstreamAPI.generateEmbedHTML(fileCode, width, height);
      case 'lulustream':
        return SecureLuluStreamAPI.generateEmbedHTML(fileCode, width, height);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }
}