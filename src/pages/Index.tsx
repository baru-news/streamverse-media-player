import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import VideoGrid from "@/components/VideoGrid";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Play } from "lucide-react";

const Index = () => {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        <HeroSection />
        
        <div className="space-y-8">
          {!user && (
            <div className="container mx-auto px-4 py-16">
              {/* Call to Action */}
              <div className="text-center bg-gradient-primary/10 backdrop-blur-sm border border-primary/20 rounded-2xl p-8 mb-16">
                <h2 className="text-3xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
                  Bergabung dengan DINO18
                </h2>
                <p className="text-muted-foreground mb-8 text-lg max-w-2xl mx-auto">
                  Dapatkan akses penuh ke koleksi video eksklusif kami. Daftar sekarang dan mulai menikmati pengalaman streaming yang tak terlupakan.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button asChild variant="hero" size="lg">
                    <Link to="/register">Daftar Gratis</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link to="/login">Sudah Punya Akun?</Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {/* Video Grid - Always shown for everyone */}
          <VideoGrid title="Video Terbaru" limit={20} />
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-card/30 backdrop-blur-sm border-t border-border/50 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">D</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                DINO18
              </span>
            </div>
            <p className="text-muted-foreground">
              Platform streaming video terdepan dengan koleksi konten dari Doodstream
            </p>
            <div className="mt-4 text-sm text-muted-foreground">
              © 2024 DINO18. Semua hak dilindungi.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
