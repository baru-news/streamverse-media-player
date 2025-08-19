import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import VideoGrid from "@/components/VideoGrid";
import AgeVerificationModal from "@/components/AgeVerificationModal";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

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
            <div className="container mx-auto px-4 py-16 text-center">
              <h2 className="text-2xl font-bold mb-4">Masuk untuk Melihat Konten</h2>
              <p className="text-muted-foreground mb-6">
                Silakan masuk atau daftar untuk mengakses koleksi video kami.
              </p>
              <div className="flex gap-4 justify-center">
                <Button asChild variant="outline">
                  <Link to="/login">Masuk</Link>
                </Button>
                <Button asChild variant="hero">
                  <Link to="/register">Daftar</Link>
                </Button>
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
