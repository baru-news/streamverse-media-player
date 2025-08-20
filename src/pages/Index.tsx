import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";
import Header from "@/components/Header";
import VideoGrid from "@/components/VideoGrid";
import HashtagFilter from "@/components/HashtagFilter";
import CategoryFilter from "@/components/CategoryFilter";
import SEO from "@/components/SEO";
import { AdContainer } from "@/components/ads/AdContainer";

const Index = () => {
  const { user } = useAuth();
  const { settings } = useWebsiteSettings();
  const [selectedHashtagId, setSelectedHashtagId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const getVideoGridTitle = () => {
    if (searchQuery.trim()) {
      return `Hasil pencarian: "${searchQuery}"`;
    }
    if (selectedCategoryId) {
      return "Video Berdasarkan Kategori";
    }
    if (selectedHashtagId) {
      return "Video Berdasarkan Tagar";
    }
    return "Video Terbaru";
  };
  
  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title={settings.site_title || "Platform Streaming Video Terdepan"}
        description={settings.site_description || "Nikmati ribuan video berkualitas tinggi di DINO18. Film, dokumenter, komedi, dan konten edukasi dalam satu platform streaming modern dengan Doodstream."}
        keywords="streaming video, doodstream, video online, film streaming, hiburan online, DINO18, platform streaming indonesia"
        type="website"
      />
      <Header onSearchChange={setSearchQuery} searchQuery={searchQuery} />
      
      <main>
        <div className="space-y-8">
          {!user && (
            <>
              {/* Category Filter for non-logged users - positioned above CTA */}
              <CategoryFilter
                selectedCategoryId={selectedCategoryId}
                onCategoryChange={setSelectedCategoryId}
              />
              
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
            </>
          )}
          
          {user && (
            <CategoryFilter
              selectedCategoryId={selectedCategoryId}
              onCategoryChange={setSelectedCategoryId}
            />
          )}
          
          {/* Ad Banner - Between Categories and Videos */}
          <AdContainer 
            position="content" 
            size="leaderboard" 
            placeholder={true}
          />
          
          {/* Video Grid with Sidebar - Always shown for everyone */}
          <div className="container mx-auto px-4">
            <div className="flex gap-8">
              {/* Main Content */}
              <div className="flex-1">
                <VideoGrid 
                  title={getVideoGridTitle()}
                  selectedHashtagId={selectedHashtagId}
                  selectedCategoryId={selectedCategoryId}
                  searchQuery={searchQuery}
                />
              </div>
              
              {/* Sidebar Ads - Desktop Only */}
              <div className="hidden lg:block">
                <AdContainer 
                  position="sidebar" 
                  size="rectangle" 
                  placeholder={true}
                  className="mb-6"
                />
                <AdContainer 
                  position="sidebar" 
                  size="skyscraper" 
                  placeholder={true}
                />
              </div>
            </div>
          </div>
          
          {/* Hashtag Filter */}
          <HashtagFilter
            selectedHashtagId={selectedHashtagId}
            onHashtagChange={setSelectedHashtagId}
          />
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
            <p className="text-muted-foreground mb-4">
              Update Video Viral Terbaru Setiap Hari
            </p>
            <div className="hidden justify-center gap-6 mb-4 text-sm">
              <Link to="/sitemap" className="text-muted-foreground hover:text-primary transition-colors">
                Peta Situs
              </Link>
              <a href="/sitemap.xml" className="text-muted-foreground hover:text-primary transition-colors">
                XML Sitemap
              </a>
            </div>
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
