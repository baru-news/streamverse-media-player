import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Play, Pause, Volume2, Maximize, ThumbsUp, Share2, Download, Eye, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import VideoCard from "@/components/VideoCard";
import Header from "@/components/Header";
import DoodstreamPlayer from "@/components/DoodstreamPlayer";
import { SecureDoodstreamAPI } from "@/lib/supabase-doodstream";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";

const VideoDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [video, setVideo] = useState<any>(null);
  const [relatedVideos, setRelatedVideos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [isSubscribeLoading, setIsSubscribeLoading] = useState(false);
  const [videoHashtags, setVideoHashtags] = useState<any[]>([]);

  useEffect(() => {
    loadVideoData();
  }, [id]);

  useEffect(() => {
    if (video && user) {
      checkLikeStatus();
      checkSubscriptionStatus();
    }
  }, [video, user]);

  const loadVideoData = async () => {
    try {
      setIsLoading(true);
      
      // Get all videos from database
      const allVideos = await SecureDoodstreamAPI.getVideosFromDatabase(20);
      
      if (allVideos && allVideos.length > 0) {
        // Find current video by file_code or id
        const currentVideo = allVideos.find(v => v.file_code === id || v.id === id);
        
        if (currentVideo) {
          // Format current video data
          const videoData = {
            id: currentVideo.id,
            title: currentVideo.title,
            description: currentVideo.description || "Video menarik dari koleksi Doodstream kami. Nikmati konten berkualitas tinggi dengan streaming yang lancar.",
            creator: "DINO18",
            views: formatViews(currentVideo.views || 0),
            uploadDate: formatDate(currentVideo.upload_date),
            duration: formatDuration(currentVideo.duration || 0),
            category: "Video",
            rating: "9.2",
            tags: ["Streaming", "Video", "Entertainment", "DINO18"],
            fileCode: currentVideo.file_code
          };
          setVideo(videoData);
          
          // Load likes count and hashtags
          await loadLikesCount(currentVideo.id);
          await loadVideoHashtags(currentVideo.id);
          
          // Get related videos (exclude current video)
          const related = allVideos
            .filter(v => v.file_code !== id && v.id !== id)
            .slice(0, 6)
            .map(v => ({
              id: v.file_code, // Use file_code as id for proper routing
              title: v.title,
              thumbnail: v.thumbnail_url || `https://img.doodcdn.io/snaps/${v.file_code}.jpg`,
              duration: formatDuration(v.duration || 0),
              views: formatViews(v.views || 0),
              creator: "DINO18",
              category: "Video",
              fileCode: v.file_code
            }));
          setRelatedVideos(related);
        }
      }
    } catch (error) {
      console.error('Error loading video data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLikesCount = async (videoId: string) => {
    try {
      const { count } = await supabase
        .from('video_likes')
        .select('*', { count: 'exact', head: true })
        .eq('video_id', videoId);
      
      setLikesCount(count || 0);
    } catch (error) {
      console.error('Error loading likes count:', error);
    }
  };

  const loadVideoHashtags = async (videoId: string) => {
    try {
      const { data } = await supabase
        .from('video_hashtags')
        .select('hashtags!inner(id, name, color)')
        .eq('video_id', videoId);
      
      setVideoHashtags(data?.map(vh => vh.hashtags) || []);
    } catch (error) {
      console.error('Error loading video hashtags:', error);
    }
  };

  const checkLikeStatus = async () => {
    if (!user || !video) return;
    
    try {
      const { data } = await supabase
        .from('video_likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('video_id', video.id)
        .maybeSingle();
      
      setIsLiked(!!data);
    } catch (error) {
      console.error('Error checking like status:', error);
    }
  };

  const checkSubscriptionStatus = async () => {
    if (!user || !video) return;
    
    try {
      const { data } = await supabase
        .from('user_subscriptions')
        .select('id')
        .eq('subscriber_id', user.id)
        .eq('creator_name', video.creator)
        .maybeSingle();
      
      setIsSubscribed(!!data);
    } catch (error) {
      console.error('Error checking subscription status:', error);
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast({
        title: "Login Diperlukan",
        description: "Silakan login untuk menyukai video ini",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    if (!video) return;

    setIsLikeLoading(true);
    try {
      if (isLiked) {
        // Unlike
        await supabase
          .from('video_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('video_id', video.id);
        
        setIsLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
        toast({
          title: "Like Dihapus",
          description: "Anda telah menghapus like dari video ini",
        });
      } else {
        // Like
        await supabase
          .from('video_likes')
          .insert({
            user_id: user.id,
            video_id: video.id
          });
        
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
        toast({
          title: "Video Disukai!",
          description: "Terima kasih telah menyukai video ini",
        });
      }
    } catch (error) {
      console.error('Error handling like:', error);
      toast({
        title: "Error",
        description: "Terjadi kesalahan. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsLikeLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!user) {
      toast({
        title: "Login Diperlukan",
        description: "Silakan login untuk subscribe creator ini",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    if (!video) return;

    setIsSubscribeLoading(true);
    try {
      if (isSubscribed) {
        // Unsubscribe
        await supabase
          .from('user_subscriptions')
          .delete()
          .eq('subscriber_id', user.id)
          .eq('creator_name', video.creator);
        
        setIsSubscribed(false);
        toast({
          title: "Unsubscribe Berhasil",
          description: `Anda telah unsubscribe dari ${video.creator}`,
        });
      } else {
        // Subscribe
        await supabase
          .from('user_subscriptions')
          .insert({
            subscriber_id: user.id,
            creator_name: video.creator
          });
        
        setIsSubscribed(true);
        toast({
          title: "Subscribe Berhasil!",
          description: `Anda sekarang mengikuti ${video.creator}`,
        });
      }
    } catch (error) {
      console.error('Error handling subscription:', error);
      toast({
        title: "Error",
        description: "Terjadi kesalahan. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsSubscribeLoading(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: video?.title || 'Video DINO18',
          text: `Tonton video menarik ini: ${video?.title}`,
          url: shareUrl,
        });
        toast({
          title: "Dibagikan!",
          description: "Video berhasil dibagikan",
        });
      } catch (error) {
        // User cancelled share or error occurred
        handleCopyLink(shareUrl);
      }
    } else {
      handleCopyLink(shareUrl);
    }
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      toast({
        title: "Link Disalin!",
        description: "Link video telah disalin ke clipboard",
      });
    }).catch(() => {
      toast({
        title: "Error",
        description: "Gagal menyalin link",
        variant: "destructive",
      });
    });
  };

  const handleDownload = async () => {
    if (!user) {
      toast({
        title: "Login Diperlukan",
        description: "Silakan login untuk mengunduh video ini",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    if (video?.fileCode) {
      try {
        // Use the SecureDoodstreamAPI to generate direct link
        const downloadLink = await SecureDoodstreamAPI.generateDirectLink(video.fileCode);
        if (downloadLink) {
          window.open(downloadLink, '_blank');
          toast({
            title: "Download Dimulai",
            description: "Video akan segera diunduh",
          });
        } else {
          toast({
            title: "Error",
            description: "Link download tidak tersedia saat ini",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error getting download link:', error);
        toast({
          title: "Error",
          description: "Terjadi kesalahan saat mendapatkan link download",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Error",
        description: "File code tidak tersedia",
        variant: "destructive",
      });
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

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'Tidak diketahui';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Memuat video...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center py-12">
              <p className="text-white text-lg mb-4">Video tidak ditemukan</p>
              <Link to="/">
                <Button variant="hero">Kembali ke Beranda</Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title={video?.title}
        description={video?.description}
        keywords={`${video?.title}, streaming video, doodstream, ${videoHashtags.map(h => h.name).join(', ')}, DINO18`}
        image={`https://img.doodcdn.io/snaps/${video?.fileCode}.jpg`}
        type="video.other"
        video={{
          title: video?.title || '',
          description: video?.description || '',
          thumbnail: `https://img.doodcdn.io/snaps/${video?.fileCode}.jpg`,
          duration: video?.duration ? parseInt(video.duration.split(':')[0]) * 60 + parseInt(video.duration.split(':')[1]) : undefined,
          uploadDate: new Date().toISOString(),
          embedUrl: `https://doodstream.com/e/${video?.fileCode}`
        }}
      />
      <Header />
      
      <main className="pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Video Player - Doodstream Integration */}
              <DoodstreamPlayer 
                fileCode={video.fileCode || "sample-file-code"} 
                title={video.title}
                width={800}
                height={450}
                className="mb-6"
              />

              {/* Video Info */}
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">
                    {video.title}
                  </h1>
                  
                  <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-4">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      <span>{video.views} tayangan</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{video.uploadDate}</span>
                    </div>
                    <span className="text-primary font-semibold">★ {video.rating}</span>
                    <span className="bg-primary/20 px-3 py-1 rounded-full text-primary text-sm">
                      {video.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mb-6">
                    <Button 
                      variant={isLiked ? "default" : "hero"} 
                      className="gap-2" 
                      onClick={handleLike}
                      disabled={isLikeLoading}
                    >
                      <ThumbsUp className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                      {isLiked ? 'Disukai' : 'Suka'} ({likesCount})
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={handleShare}>
                      <Share2 className="w-4 h-4" />
                      Bagikan
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={handleDownload}>
                      <Download className="w-4 h-4" />
                      Unduh
                    </Button>
                  </div>
                </div>

                {/* Creator Info */}
                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">{video.creator}</h3>
                        <p className="text-muted-foreground text-sm">Creator verified</p>
                      </div>
                      <Button 
                        variant="hero" 
                        size="sm"
                        onClick={handleSubscribe}
                        disabled={isSubscribeLoading}
                      >
                        {isSubscribed ? 'Subscribed' : 'Subscribe'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Description */}
                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-white mb-3">Deskripsi</h3>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      {video.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-2">
                      {videoHashtags.map((hashtag, index) => (
                        <span
                          key={hashtag.id}
                          className="px-3 py-1 rounded-full text-sm transition-colors cursor-pointer"
                          style={{ 
                            backgroundColor: hashtag.color + '20', 
                            color: hashtag.color,
                            border: `1px solid ${hashtag.color}40`
                          }}
                        >
                          #{hashtag.name}
                        </span>
                      ))}
                      {videoHashtags.length === 0 && (
                        <span className="text-muted-foreground text-sm italic">
                          Belum ada hashtag untuk video ini
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Sidebar - Recommended Videos */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <div className="w-1 h-6 bg-gradient-primary rounded-full" />
                Rekomendasi Untuk Anda
              </h2>
              
              {relatedVideos.length > 0 ? (
                <div className="space-y-4">
                  {relatedVideos.map((relatedVideo) => (
                    <VideoCard key={relatedVideo.id} {...relatedVideo} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Belum ada video lain yang tersedia</p>
                </div>
              )}

              <div className="text-center">
                <Link to="/">
                  <Button variant="outline" className="w-full">
                    Lihat Semua Video
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default VideoDetail;