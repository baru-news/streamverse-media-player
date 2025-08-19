import React from "react";
import { TrendingUp, Play, Star, Trophy, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";

const FeaturedSection = () => {
  const { settings } = useWebsiteSettings();

  const features = [
    {
      icon: TrendingUp,
      title: "Trending Videos",
      description: "Video paling populer minggu ini",
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/20"
    },
    {
      icon: Star,
      title: "Video Berkualitas",
      description: "Konten berkualitas tinggi HD/4K",
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/20"
    },
    {
      icon: Trophy,
      title: "Koleksi Terlengkap",
      description: "Ribuan video dari berbagai kategori",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20"
    },
    {
      icon: Eye,
      title: "Streaming Cepat",
      description: "Teknologi streaming Doodstream",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20"
    }
  ];

  const stats = [
    { label: "Total Video", value: "10K+", icon: Play },
    { label: "Penonton Aktif", value: "50K+", icon: Eye },
    { label: "Rating Platform", value: "4.9", icon: Star },
    { label: "Kategori", value: "25+", icon: Trophy }
  ];

  return (
    <section className="relative py-20 bg-gradient-to-br from-background via-background/90 to-primary/5">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 bg-primary/10 text-primary border-primary/30">
            Platform Streaming Terdepan
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
            {settings.hero_title || "Selamat Datang di DINO18"}
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
            {settings.hero_description || "Platform streaming video terdepan dengan koleksi konten berkualitas tinggi dari Doodstream. Nikmati pengalaman menonton yang tak terlupakan dengan teknologi streaming terdepan."}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="hero" 
              size="lg" 
              className="gap-2"
              onClick={() => window.scrollTo({ 
                top: window.innerHeight, 
                behavior: 'smooth' 
              })}
            >
              <Play className="w-5 h-5" />
              Mulai Menonton
            </Button>
            <Link to="/register">
              <Button variant="outline" size="lg" className="gap-2 bg-card/50 backdrop-blur-sm">
                <Star className="w-5 h-5" />
                Bergabung Gratis
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/70 transition-colors">
                <CardContent className="p-6 text-center">
                  <Icon className="w-8 h-8 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index} 
                className={`bg-card/30 backdrop-blur-sm border ${feature.borderColor} hover:bg-card/50 transition-all duration-300 hover:scale-105`}
              >
                <CardContent className="p-6 text-center">
                  <div className={`w-16 h-16 ${feature.bgColor} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                    <Icon className={`w-8 h-8 ${feature.color}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-primary/10 backdrop-blur-sm border border-primary/20 rounded-2xl p-8 max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white">
              Siap untuk Memulai?
            </h2>
            <p className="text-muted-foreground mb-6">
              Bergabunglah dengan ribuan pengguna yang sudah menikmati pengalaman streaming terbaik di DINO18
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button variant="hero" size="lg" className="w-full sm:w-auto">
                  Daftar Sekarang
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full sm:w-auto bg-card/50 backdrop-blur-sm"
                onClick={() => window.scrollTo({ 
                  top: window.innerHeight + 400, 
                  behavior: 'smooth' 
                })}
              >
                Lihat Video
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedSection;