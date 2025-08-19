import React, { useState, useEffect } from 'react';
import VideoCard from './VideoCard';
import { SecureDoodstreamAPI } from '@/lib/supabase-doodstream';

interface VideoGridProps {
  title: string;
  limit?: number;
}

const VideoGrid = ({ title, limit = 12 }: VideoGridProps) => {
  const [videos, setVideos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadVideos();
  }, [limit]);

  const loadVideos = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get videos from database (now public access)
      const dbVideos = await SecureDoodstreamAPI.getVideosFromDatabase(limit);
      
      if (dbVideos && dbVideos.length > 0) {
        // Transform database videos to match VideoCard props
        const transformedVideos = dbVideos.map(video => ({
          id: video.id,
          title: video.title,
          thumbnail: video.thumbnail_url || (video.file_code ? `https://img.doodcdn.com/snaps/${video.file_code}.jpg` : '/placeholder.svg'),
          duration: formatDuration(video.duration || 0),
          views: formatViews(video.views || 0),
          creator: 'Doodstream',
          category: 'Video',
          fileCode: video.file_code
        }));
        setVideos(transformedVideos);
      } else {
        // If no videos in database, show message
        setError('Belum ada video yang tersedia. Admin perlu menambahkan video ke akun Doodstream terlebih dahulu.');
      }
    } catch (error) {
      console.error('Error loading videos:', error);
      setError('Gagal memuat video. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    if (!seconds) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatViews = (views: number): string => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  if (isLoading) {
    return (
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 flex items-center gap-3">
            <div className="w-1 h-8 bg-gradient-primary rounded-full" />
            {title}
          </h2>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading videos...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 flex items-center gap-3">
            <div className="w-1 h-8 bg-gradient-primary rounded-full" />
            {title}
          </h2>
          <div className="text-center py-8">
            <p className="text-destructive mb-4">{error}</p>
            <button 
              onClick={loadVideos}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
            <div className="w-1 h-8 bg-gradient-primary rounded-full" />
            {title}
          </h2>
          <button 
            onClick={loadVideos}
            className="px-4 py-2 bg-secondary/20 text-white rounded-md hover:bg-secondary/30 transition-colors text-sm"
          >
            Refresh
          </button>
        </div>
        
        {videos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/70 text-lg">
              Belum ada video yang tersedia.
            </p>
            <p className="text-sm text-white/50 mt-2">
              Video akan muncul setelah admin menambahkan konten.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {videos.map((video) => (
              <VideoCard key={video.id} {...video} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default VideoGrid;