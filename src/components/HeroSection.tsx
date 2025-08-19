import { Play, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  const featuredVideo = {
    id: "featured-1",
    title: "Perjalanan Menakjubkan ke Alam Semesta",
    description: "Jelajahi keajaiban kosmos dalam dokumenter spektakuler ini. Dari galaksi terjauh hingga planet-planet di tata surya kita, nikmati visual yang memukau dan narasi yang menginspirasi tentang pencarian manusia untuk memahami alam semesta.",
    duration: "2j 15m",
    year: "2024",
    rating: "9.2"
  };

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src={heroBg}
          alt="Hero Background"
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
            <span className="text-primary font-medium text-sm">Video Unggulan</span>
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            {featuredVideo.title}
          </h1>

          {/* Metadata */}
          <div className="flex items-center gap-4 text-muted-foreground mb-6">
            <span className="text-primary font-semibold">★ {featuredVideo.rating}</span>
            <span>{featuredVideo.year}</span>
            <span>{featuredVideo.duration}</span>
            <span className="bg-primary/20 px-3 py-1 rounded-full text-primary text-sm font-medium">
              HD
            </span>
          </div>

          {/* Description */}
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            {featuredVideo.description}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Link to={`/video/${featuredVideo.id}`}>
              <Button variant="play" size="lg" className="gap-3">
                <Play className="w-5 h-5" fill="currentColor" />
                Tonton Sekarang
              </Button>
            </Link>
            
            <Button variant="outline" size="lg" className="gap-3 bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20">
              <Info className="w-5 h-5" />
              Info Selengkapnya
            </Button>
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