import React, { useState, useEffect } from "react";
import { Play, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";
import { supabase } from "@/integrations/supabase/client";
import { SecureDoodstreamAPI } from "@/lib/supabase-doodstream";
import { useAuth } from "@/hooks/useAuth";

const HeroSection = () => {
  const { user } = useAuth();
  const [featuredVideo, setFeaturedVideo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      // Only try to load videos if user is authenticated
      loadFeaturedVideo();
    } else {
      // Show default content for non-authenticated users
      setFeaturedVideo({
        id: "default",
        title: "Selamat Datang di DINO18",
        description: "Platform streaming terbaik untuk menonton video berkualitas tinggi dari Doodstream. Masuk atau daftar untuk mengakses koleksi video eksklusif kami dan nikmati pengalaman streaming yang luar biasa.",
        duration: "∞",
        views: "1M+",
        uploadDate: "2024",
        thumbnail: heroBg,
        fileCode: null
      });
      setIsLoading(false);
    }
  }, [user]);

  const loadFeaturedVideo = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get the most popular video from database (highest view count)
      const { data: popularVideo, error } = await supabase
        .from('videos')
        .select('*')
        .eq('status', 'active')
        .order('views', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (popularVideo) {
        setFeaturedVideo({
          id: popularVideo.file_code,
          title: popularVideo.title,
          description: popularVideo.description || "Video populer dari Doodstream dengan jutaan penonton di seluruh dunia. Nikmati konten berkualitas tinggi yang telah menjadi favorit banyak orang.",
          duration: formatDuration(popularVideo.duration || 0),
          views: formatViews(popularVideo.views || 0),
          uploadDate: new Date(popularVideo.upload_date).getFullYear().toString(),
          thumbnail: popularVideo.thumbnail_url || `https://img.doodcdn.com/snaps/${popularVideo.file_code}.jpg`,
          fileCode: popularVideo.file_code
        });
      } else {
        // If no videos in database, try to sync and get most popular
        try {
          await SecureDoodstreamAPI.syncVideos();
          
          // Try to get popular video again after sync
          const { data: syncedVideo } = await supabase
            .from('videos')
            .select('*')
            .eq('status', 'active')
            .order('views', { ascending: false })
            .limit(1)
            .single();

          if (syncedVideo) {
            setFeaturedVideo({
              id: syncedVideo.file_code,
              title: syncedVideo.title,
              description: syncedVideo.description || "Video populer dari Doodstream dengan jutaan penonton di seluruh dunia. Nikmati konten berkualitas tinggi yang telah menjadi favorit banyak orang.",
              duration: formatDuration(syncedVideo.duration || 0),
              views: formatViews(syncedVideo.views || 0),
              uploadDate: new Date(syncedVideo.upload_date).getFullYear().toString(),
              thumbnail: syncedVideo.thumbnail_url || `https://img.doodcdn.com/snaps/${syncedVideo.file_code}.jpg`,
              fileCode: syncedVideo.file_code
            });
          } else {
            // Fallback to default content if no videos available
            setFeaturedVideo({
              id: "default",
              title: "Selamat Datang di DINO18",
              description: "Platform streaming terbaik untuk menonton video berkualitas tinggi dari Doodstream. Upload video Anda di Doodstream untuk mulai menikmati layanan streaming yang luar biasa.",
              duration: "∞",
              views: "0",
              uploadDate: "2024",
              thumbnail: heroBg,
              fileCode: null
            });
          }
        } catch (syncError) {
          console.error('Sync error:', syncError);
          setError('Gagal memuat video unggulan');
        }
      }
    } catch (err) {
      console.error('Error loading featured video:', err);
      setError('Gagal memuat video unggulan');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    if (!seconds) return '0m';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}j ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatViews = (views: number): string => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  // Loading state
  if (isLoading) {
    return (
      <section className="relative h-screen w-full overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroBg}
            alt="Hero Background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-hero" />
        </div>
        <div className="relative z-10 container mx-auto px-4 h-full flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-white text-lg">Memuat video unggulan...</p>
          </div>
        </div>
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section className="relative h-screen w-full overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroBg}
            alt="Hero Background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-hero" />
        </div>
        <div className="relative z-10 container mx-auto px-4 h-full flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-400 text-lg mb-4">{error}</p>
            <Button onClick={loadFeaturedVideo} variant="outline" className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20">
              Coba Lagi
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src={featuredVideo?.thumbnail || heroBg}
          alt="Featured Video Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-hero" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 h-full flex items-center">
        <div className="max-w-2xl animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-primary/20 backdrop-blur-sm border border-primary/30 rounded-full px-4 py-2 mb-6">
            <div className="w-2 h-2 bg-primary rounded-full animate-glow-pulse" />
            <span className="text-primary font-medium text-sm">
              {featuredVideo?.fileCode ? 'Video Terpopuler' : 'Video Unggulan'}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            {featuredVideo?.title}
          </h1>

          {/* Metadata */}
          <div className="flex items-center gap-4 text-muted-foreground mb-6">
            <span className="text-primary font-semibold">👁 {featuredVideo?.views} views</span>
            <span>{featuredVideo?.uploadDate}</span>
            <span>{featuredVideo?.duration}</span>
            <span className="bg-primary/20 px-3 py-1 rounded-full text-primary text-sm font-medium">
              HD
            </span>
          </div>

          {/* Description */}
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            {featuredVideo?.description}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {user && featuredVideo?.fileCode ? (
              <Link to={`/video/${featuredVideo.fileCode}`}>
                <Button variant="play" size="lg" className="gap-3">
                  <Play className="w-5 h-5" fill="currentColor" />
                  Tonton Sekarang
                </Button>
              </Link>
            ) : !user ? (
              <div className="flex gap-4">
                <Link to="/login">
                  <Button variant="play" size="lg" className="gap-3">
                    <Play className="w-5 h-5" fill="currentColor" />
                    Masuk untuk Menonton
                  </Button>
                </Link>
                <Link to="/register">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="gap-3 bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20"
                  >
                    <Info className="w-5 h-5" />
                    Daftar Gratis
                  </Button>
                </Link>
              </div>
            ) : (
              <Button 
                variant="play" 
                size="lg" 
                className="gap-3" 
                onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
              >
                <Play className="w-5 h-5" fill="currentColor" />
                Lihat Video
              </Button>
            )}
            
            {user && (
              <Button 
                variant="outline" 
                size="lg" 
                className="gap-3 bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20"
                onClick={loadFeaturedVideo}
              >
                <Info className="w-5 h-5" />
                Refresh
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/70 animate-bounce">
        <div className="flex flex-col items-center gap-2">
          <span className="text-sm">Scroll untuk melihat lebih banyak</span>
          <div className="w-px h-8 bg-gradient-to-b from-white/70 to-transparent" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;