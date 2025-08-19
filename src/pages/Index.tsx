import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import VideoGrid from "@/components/VideoGrid";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        <HeroSection />
        
        <div className="space-y-8">
          <VideoGrid title="Video Terbaru dari Doodstream" limit={20} />
        </div>
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
