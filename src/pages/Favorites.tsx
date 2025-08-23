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
        <main className="pt-20">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center py-12">
              <div className="relative mx-auto w-20 h-20 mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-xl opacity-50 animate-pulse" />
                <div className="relative bg-gradient-to-br from-card via-card to-muted rounded-full p-4 border border-border shadow-xl">
                  <Heart className="w-12 h-12 text-primary mx-auto" />
                </div>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Login Diperlukan
              </h1>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
                Silakan login untuk melihat koleksi video favorit Anda dan nikmati pengalaman yang dipersonalisasi
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <Link to="/login" className="w-full sm:w-auto">
                  <Button variant="hero" size="default" className="w-full sm:w-auto min-h-[44px] bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                    Masuk Sekarang
                  </Button>
                </Link>
                <Link to="/" className="w-full sm:w-auto">
                  <Button variant="outline" size="default" className="w-full sm:w-auto min-h-[44px] border-primary/30 text-foreground hover:bg-primary/10 hover:border-primary/50 transition-all duration-300">
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
      
      <main className="pt-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
          {/* Enhanced Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mb-8 p-6 bg-gradient-to-r from-card/50 via-card/30 to-transparent border border-border/50 rounded-2xl backdrop-blur-sm">
            <Link to="/" className="self-start sm:self-auto">
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 transition-colors duration-300">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-accent/30 rounded-full blur-md opacity-60 animate-pulse"></div>
                <div className="relative w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center shadow-xl">
                  <Heart className="w-7 h-7 sm:w-8 sm:h-8 text-primary-foreground fill-current" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-1 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Favorit Saya
                </h1>
                <p className="text-muted-foreground text-sm sm:text-base">
                  {favoriteVideos.length} video tersimpan dalam koleksi Anda
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="text-center py-16">
              <div className="relative mx-auto w-16 h-16 mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-lg opacity-50 animate-pulse"></div>
                <div className="relative animate-spin rounded-full h-16 w-16 border-4 border-muted border-t-primary"></div>
              </div>
              <p className="text-muted-foreground text-lg">Memuat koleksi video favorit Anda...</p>
            </div>
          ) : favoriteVideos.length > 0 ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-semibold text-foreground">Koleksi Video ({favoriteVideos.length})</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Heart className="w-4 h-4 fill-current text-primary" />
                  <span>Disukai</span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                {favoriteVideos.map((video) => (
                  <VideoCard key={video.id} {...video} />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="relative mx-auto w-24 h-24 mb-8">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-xl opacity-50 animate-pulse" />
                <div className="relative bg-gradient-to-br from-card via-card/50 to-muted/30 rounded-full p-6 border border-border/50 shadow-xl">
                  <Heart className="w-12 h-12 text-muted-foreground mx-auto opacity-50" />
                </div>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-3 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Belum Ada Video Favorit
              </h2>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto leading-relaxed text-sm sm:text-base">
                Mulai membangun koleksi video favorit Anda dengan menekan tombol hati ❤️ pada video yang Anda sukai. 
                Video favorit akan tersimpan di sini untuk akses yang mudah.
              </p>
              <Link to="/" className="inline-block">
                <Button variant="hero" size="default" className="min-h-[48px] px-8 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
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