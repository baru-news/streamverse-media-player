import { useState, useEffect } from "react";
import { Heart, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import VideoCard from "@/components/VideoCard";
import SEO from "@/components/SEO";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";

const Favorites = () => {
  const { user } = useAuth();
  const { getFavoriteVideos } = useFavorites();
  const [favoriteVideos, setFavoriteVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, [user]);

  const loadFavorites = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const videos = await getFavoriteVideos();
      console.log('Fetched favorite videos:', videos); // Debug log
      const formattedVideos = videos.map(video => ({
        id: video.file_code || video.id,
        title: video.title,
        thumbnail: video.thumbnail_url || `https://img.doodcdn.io/snaps/${video.file_code}.jpg`,
        duration: formatDuration(video.duration || 0),
        views: formatViews(video.views || 0),
        creator: "DINO18",
        category: "Video",
        fileCode: video.file_code,
        videoId: video.id // Pass database ID for favorites
      }));
      console.log('Formatted favorite videos:', formattedVideos); // Debug log
      setFavoriteVideos(formattedVideos);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    if (!seconds) return '0:00';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}j ${minutes}m`;
    }
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

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <SEO 
          title="Favorit Saya - DINO18"
          description="Akses semua video favorit Anda di DINO18. Login untuk melihat koleksi video yang telah Anda simpan."
          keywords="favorit, video favorit, koleksi video, dino18, streaming"
        />
        <Header />
        <main className="pt-16 sm:pt-20 pb-4">
          <div className="w-full max-w-full overflow-x-hidden px-3 sm:px-4 md:px-6 lg:px-8 mx-auto">
            <div className="text-center py-12 sm:py-16">
              <div className="relative mx-auto w-16 h-16 sm:w-20 sm:h-20 mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-xl opacity-50 animate-pulse" />
                <div className="relative bg-gradient-to-br from-card via-card to-muted rounded-full p-3 sm:p-4 border border-border shadow-xl">
                  <Heart className="w-10 h-10 sm:w-12 sm:h-12 text-primary mx-auto" />
                </div>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent px-4">
                Login Diperlukan
              </h1>
              <p className="text-muted-foreground mb-6 sm:mb-8 max-w-xs sm:max-w-md mx-auto leading-relaxed text-sm sm:text-base px-4">
                Silakan login untuk melihat koleksi video favorit Anda dan nikmati pengalaman yang dipersonalisasi
              </p>
              <div className="flex flex-col gap-3 justify-center items-center px-4 max-w-sm mx-auto">
                <Link to="/login" className="w-full">
                  <Button variant="hero" size="default" className="w-full min-h-[48px] bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all duration-300 touch-manipulation">
                    Masuk Sekarang
                  </Button>
                </Link>
                <Link to="/" className="w-full">
                  <Button variant="outline" size="default" className="w-full min-h-[48px] border-primary/30 text-foreground hover:bg-primary/10 hover:border-primary/50 transition-all duration-300 touch-manipulation">
                    Kembali ke Beranda
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Favorit Saya - DINO18"
        description="Koleksi video favorit Anda di DINO18. Akses semua video yang telah Anda simpan dalam satu tempat."
        keywords="favorit, video favorit, koleksi video, dino18, streaming"
      />
      <Header />
      
      <main className="pt-16 sm:pt-20 pb-4">
        <div className="w-full max-w-full overflow-x-hidden px-3 sm:px-4 md:px-6 lg:px-8 mx-auto">
          {/* Enhanced Header Section - Mobile Optimized */}
          <div className="flex flex-col gap-3 sm:gap-4 mb-6 sm:mb-8 p-4 sm:p-6 bg-gradient-to-r from-card/50 via-card/30 to-transparent border border-border/50 rounded-xl sm:rounded-2xl backdrop-blur-sm mx-auto max-w-full">
            <div className="flex items-center gap-3 sm:gap-4">
              <Link to="/" className="flex-shrink-0">
                <Button variant="ghost" size="sm" className="w-10 h-10 sm:w-12 sm:h-12 rounded-full hover:bg-primary/10 transition-colors duration-300 touch-manipulation">
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-accent/30 rounded-full blur-md opacity-60 animate-pulse"></div>
                  <div className="relative w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center shadow-xl">
                    <Heart className="w-6 h-6 sm:w-7 sm:h-7 text-primary-foreground fill-current" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-1 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent leading-tight">
                    Favorit Saya
                  </h1>
                  <p className="text-muted-foreground text-sm sm:text-base truncate">
                    {favoriteVideos.length} video tersimpan
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="text-center py-12 sm:py-16 px-4">
              <div className="relative mx-auto w-14 h-14 sm:w-16 sm:h-16 mb-4 sm:mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-lg opacity-50 animate-pulse"></div>
                <div className="relative animate-spin rounded-full h-full w-full border-4 border-muted border-t-primary"></div>
              </div>
              <p className="text-muted-foreground text-base sm:text-lg">Memuat koleksi video favorit...</p>
            </div>
          ) : favoriteVideos.length > 0 ? (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-1">
                <h2 className="text-base sm:text-lg md:text-xl font-semibold text-foreground">
                  Koleksi Video ({favoriteVideos.length})
                </h2>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <Heart className="w-3 h-3 sm:w-4 sm:h-4 fill-current text-primary" />
                  <span>Disukai</span>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
                {favoriteVideos.map((video) => (
                  <VideoCard key={video.id} {...video} />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 sm:py-20 px-4">
              <div className="relative mx-auto w-20 h-20 sm:w-24 sm:h-24 mb-6 sm:mb-8">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-xl opacity-50 animate-pulse" />
                <div className="relative bg-gradient-to-br from-card via-card/50 to-muted/30 rounded-full p-5 sm:p-6 border border-border/50 shadow-xl">
                  <Heart className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto opacity-50" />
                </div>
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground mb-3 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent px-4">
                Belum Ada Video Favorit
              </h2>
              <p className="text-muted-foreground mb-6 sm:mb-8 max-w-sm sm:max-w-lg mx-auto leading-relaxed text-sm sm:text-base px-4">
                Mulai membangun koleksi video favorit Anda dengan menekan tombol hati ❤️ pada video yang Anda sukai.
              </p>
              <Link to="/" className="inline-block px-4">
                <Button 
                  variant="hero" 
                  size="default" 
                  className="w-full sm:w-auto min-h-[48px] px-6 sm:px-8 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 touch-manipulation"
                >
                  🎬 Jelajahi Video Sekarang
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Favorites;