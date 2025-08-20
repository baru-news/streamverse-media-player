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
      const formattedVideos = videos.map(video => ({
        id: video.file_code || video.id,
        title: video.title,
        thumbnail: video.thumbnail_url || `https://img.doodcdn.io/snaps/${video.file_code}.jpg`,
        duration: formatDuration(video.duration || 0),
        views: formatViews(video.views || 0),
        creator: "DINO18",
        category: "Video",
        fileCode: video.file_code
      }));
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
              <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-4">Login Diperlukan</h1>
              <p className="text-muted-foreground mb-6">
                Silakan login untuk melihat video favorit Anda
              </p>
              <div className="flex gap-4 justify-center">
                <Link to="/login">
                  <Button variant="hero">Login</Button>
                </Link>
                <Link to="/">
                  <Button variant="outline">Kembali ke Beranda</Button>
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
        <div className="container mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="flex items-center gap-4 mb-8">
            <Link to="/">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                <Heart className="w-6 h-6 text-white fill-current" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  Favorit Saya
                </h1>
                <p className="text-muted-foreground">
                  {favoriteVideos.length} video tersimpan
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Memuat video favorit...</p>
            </div>
          ) : favoriteVideos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {favoriteVideos.map((video) => (
                <VideoCard key={video.id} {...video} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">
                Belum Ada Video Favorit
              </h2>
              <p className="text-muted-foreground mb-6">
                Mulai menambahkan video ke favorit dengan menekan tombol hati pada video yang Anda sukai
              </p>
              <Link to="/">
                <Button variant="hero" className="px-8">
                  Jelajahi Video
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