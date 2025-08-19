import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Play, Pause, Volume2, Maximize, ThumbsUp, Share2, Download, Eye, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import VideoCard from "@/components/VideoCard";
import Header from "@/components/Header";

const VideoDetail = () => {
  const { id } = useParams();
  const [isPlaying, setIsPlaying] = useState(false);

  // Mock video data - in real app this would come from API
  const video = {
    id: id || "1",
    title: "Perjalanan Menakjubkan ke Alam Semesta",
    description: "Jelajahi keajaiban kosmos dalam dokumenter spektakuler ini. Dari galaksi terjauh hingga planet-planet di tata surya kita, nikmati visual yang memukau dan narasi yang menginspirasi tentang pencarian manusia untuk memahami alam semesta. Dokumenter ini menampilkan penelitian terbaru dari NASA dan berbagai observatorium dunia.",
    creator: "National Geographic",
    views: "2.5M",
    uploadDate: "15 Des 2024",
    duration: "2j 15m",
    category: "Dokumenter",
    rating: "9.2",
    tags: ["Sains", "Alam Semesta", "Dokumenter", "NASA", "Astronomi"]
  };

  const relatedVideos = [
    {
      id: "2",
      title: "Misteri Lubang Hitam",
      thumbnail: "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=400&h=225&fit=crop",
      duration: "1j 45m",
      views: "1.8M",
      creator: "Science Channel",
      category: "Dokumenter"
    },
    {
      id: "3", 
      title: "Kehidupan di Mars",
      thumbnail: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=225&fit=crop",
      duration: "58m",
      views: "3.2M",
      creator: "NASA Official",
      category: "Dokumenter"
    },
    {
      id: "4",
      title: "Eksplorasi Galaksi Bima Sakti",
      thumbnail: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400&h=225&fit=crop",
      duration: "2j 30m",
      views: "950k",
      creator: "Cosmos Explorer",
      category: "Dokumenter"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Video Player */}
              <div className="relative aspect-video bg-black rounded-xl overflow-hidden mb-6 group">
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />
                
                {/* Play/Pause Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-20 h-20 bg-black/50 backdrop-blur-sm rounded-full hover:bg-black/70 transition-all duration-300"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? (
                      <Pause className="w-8 h-8 text-white" />
                    ) : (
                      <Play className="w-8 h-8 text-white ml-1" fill="white" />
                    )}
                  </Button>
                </div>

                {/* Video Controls */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                        <Volume2 className="w-5 h-5" />
                      </Button>
                      <span className="text-white text-sm">0:00 / {video.duration}</span>
                    </div>
                    
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                      <Maximize className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                {/* Placeholder Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center -z-10">
                  <div className="text-center text-white/50">
                    <Play className="w-16 h-16 mx-auto mb-4" />
                    <p>Video Player</p>
                  </div>
                </div>
              </div>

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
                    <Button variant="hero" className="gap-2">
                      <ThumbsUp className="w-4 h-4" />
                      Suka
                    </Button>
                    <Button variant="outline" className="gap-2">
                      <Share2 className="w-4 h-4" />
                      Bagikan
                    </Button>
                    <Button variant="outline" className="gap-2">
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
                      <Button variant="hero" size="sm">
                        Subscribe
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
                      {video.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="bg-muted/50 hover:bg-primary/20 px-3 py-1 rounded-full text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Sidebar - Related Videos */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <div className="w-1 h-6 bg-gradient-primary rounded-full" />
                Video Terkait
              </h2>
              
              <div className="space-y-4">
                {relatedVideos.map((relatedVideo) => (
                  <VideoCard key={relatedVideo.id} {...relatedVideo} />
                ))}
              </div>

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