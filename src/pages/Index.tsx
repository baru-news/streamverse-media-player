import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import VideoGrid from "@/components/VideoGrid";
import AgeVerificationModal from "@/components/AgeVerificationModal";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Play } from "lucide-react";

const Index = () => {
  const { user } = useAuth();
  const [showAgeVerification, setShowAgeVerification] = useState(false);
  const [ageVerified, setAgeVerified] = useState(false);

  useEffect(() => {
    if (user) {
      // Check if user has verified their age
      supabase
        .from('profiles')
        .select('age_verified')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data?.age_verified) {
            setAgeVerified(true);
          } else {
            setShowAgeVerification(true);
          }
        });
    }
  }, [user]);

  const handleAgeVerified = () => {
    setAgeVerified(true);
    setShowAgeVerification(false);
  };
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        <HeroSection />
        
        <div className="space-y-8">
          {!user ? (
            <div className="container mx-auto px-4 py-16">
              {/* Features Section */}
              <div className="grid md:grid-cols-3 gap-8 mb-16">
                <div className="text-center p-6 rounded-lg bg-card/30 backdrop-blur-sm border border-border/50">
                  <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <Play className="w-8 h-8 text-white" fill="currentColor" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Streaming HD</h3>
                  <p className="text-muted-foreground">
                    Nikmati video berkualitas tinggi dengan streaming yang lancar dan stabil.
                  </p>
                </div>
                
                <div className="text-center p-6 rounded-lg bg-card/30 backdrop-blur-sm border border-border/50">
                  <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-white">∞</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Koleksi Lengkap</h3>
                  <p className="text-muted-foreground">
                    Akses ribuan video dari berbagai kategori yang terus diperbarui.
                  </p>
                </div>
                
                <div className="text-center p-6 rounded-lg bg-card/30 backdrop-blur-sm border border-border/50">
                  <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-white">🔒</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Aman & Privat</h3>
                  <p className="text-muted-foreground">
                    Platform yang aman dengan sistem keamanan terdepan untuk privasi Anda.
                  </p>
                </div>
              </div>
              
              {/* Call to Action */}
              <div className="text-center bg-gradient-primary/10 backdrop-blur-sm border border-primary/20 rounded-2xl p-8">
                <h2 className="text-3xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
                  Bergabung dengan Streamverse
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
          ) : user && !ageVerified ? (
            <div className="container mx-auto px-4 py-16 text-center">
              <h2 className="text-2xl font-bold mb-4">Verifikasi Usia Diperlukan</h2>
              <p className="text-muted-foreground">
                Silakan verifikasi usia Anda untuk melihat konten video.
              </p>
            </div>
          ) : (
            <VideoGrid title="Video Terbaru dari Doodstream" limit={20} />
          )}
        </div>
        
        {/* Age Verification Modal */}
        <AgeVerificationModal 
          open={showAgeVerification} 
          onVerified={handleAgeVerified} 
        />
      </main>
      
      {/* Footer */}
      <footer className="bg-card/30 backdrop-blur-sm border-t border-border/50 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Streamverse
              </span>
            </div>
            <p className="text-muted-foreground">
              Platform streaming video terdepan dengan koleksi konten dari Doodstream
            </p>
            <div className="mt-4 text-sm text-muted-foreground">
              © 2024 Streamverse. Semua hak dilindungi.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
