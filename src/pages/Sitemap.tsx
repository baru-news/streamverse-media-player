import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Calendar, Eye } from 'lucide-react';
import SEO from '@/components/SEO';

interface Video {
  id: string;
  file_code: string;
  title: string;
  description: string;
  views: number;
  upload_date: string;
  thumbnail_url: string;
}

const Sitemap = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('status', 'active')
        .order('upload_date', { ascending: false })
        .limit(100);

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error('Error loading videos for sitemap:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const formatViews = (views: number): string => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Peta Situs - Semua Video"
        description="Temukan semua video yang tersedia di DINO18. Koleksi lengkap video streaming berkualitas tinggi dari Doodstream dengan berbagai kategori hiburan."
        keywords="peta situs, semua video, koleksi video, streaming, doodstream, DINO18, daftar video"
        type="website"
      />
      <Header />
      
      <main className="pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">Peta Situs Video</h1>
            <p className="text-muted-foreground text-lg">
              Temukan semua video yang tersedia di platform kami. Koleksi lengkap dengan kualitas streaming terbaik.
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Memuat peta situs...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((video) => (
                <Card key={video.id} className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/70 transition-all duration-300 group">
                  <CardHeader className="pb-4">
                    <div className="relative aspect-video rounded-lg overflow-hidden mb-4">
                      <img 
                        src={video.thumbnail_url || `https://img.doodcdn.io/snaps/${video.file_code}.jpg`}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <Play className="w-12 h-12 text-white" fill="currentColor" />
                      </div>
                    </div>
                    <CardTitle className="text-white group-hover:text-primary transition-colors duration-300 line-clamp-2">
                      <Link to={`/video/${video.file_code}`} className="hover:underline">
                        {video.title}
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                      {video.description || "Video menarik dari koleksi Doodstream kami dengan kualitas streaming terbaik."}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        <span>{formatViews(video.views)} views</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(video.upload_date)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {videos.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <p className="text-muted-foreground text-lg">
                    Belum ada video yang tersedia.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Sitemap;