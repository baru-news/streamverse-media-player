import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";
import { useAds } from "@/hooks/useAds";
import { useWelcomeBonus } from "@/hooks/useWelcomeBonus";
import Header from "@/components/Header";
import VideoGrid from "@/components/VideoGrid";
import HashtagFilter from "@/components/HashtagFilter";
import CategoryFilter from "@/components/CategoryFilter";
import SEO from "@/components/SEO";
import { AdContainer } from "@/components/ads/AdContainer";
import { Skeleton } from "@/components/ui/skeleton";
import WelcomeBonusDialog from "@/components/WelcomeBonusDialog";
const Index = () => {
  const {
    user
  } = useAuth();
  const {
    settings,
    isLoading
  } = useWebsiteSettings();
  const {
    settings: adsSettings,
    isLoading: adsLoading
  } = useAds();
  const welcomeBonus = useWelcomeBonus();
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

  // Check if ads should be displayed
  const shouldShowAds = !adsLoading && adsSettings.ads_enabled && (!user && adsSettings.show_ads_to_guests || user && adsSettings.show_ads_to_users);
  return <div className="min-h-screen bg-background">
      <SEO title={settings.site_title || "Platform Streaming Video Terdepan"} description={settings.site_description || "Nikmati ribuan video berkualitas tinggi di DINO18. Film, dokumenter, komedi, dan konten edukasi dalam satu platform streaming modern dengan Doodstream."} keywords="streaming video, doodstream, video online, film streaming, hiburan online, DINO18, platform streaming indonesia" type="website" />
      <Header onSearchChange={setSearchQuery} searchQuery={searchQuery} />
      
      <main>
        <div className="my-0 py-0 px-0 mx-0">
          {!user && <>
              {/* Category Filter for non-logged users - positioned above CTA */}
              <CategoryFilter selectedCategoryId={selectedCategoryId} onCategoryChange={setSelectedCategoryId} />
              
              <div className="container mx-auto px-4 py-0">
                {/* Call to Action */}
                <div className="text-center bg-gradient-primary/10 backdrop-blur-sm border border-primary/20 rounded-2xl px-4 sm:px-8 py-8">
                  <h2 className="text-2xl sm:text-3xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
                    Bergabung dengan {settings.site_title || 'DINO18'}
                  </h2>
                  <p className="text-muted-foreground mb-6 sm:mb-8 text-base sm:text-lg max-w-2xl mx-auto px-2">
                    Dapatkan Berbagai Fitur Menarik Seperti Menambahkan Video Favorite dan Limited Badge!
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center max-w-sm sm:max-w-none mx-auto">
                    <Button asChild variant="hero" size="default" className="w-full sm:w-auto">
                      <Link to="/register">Daftar Gratis</Link>
                    </Button>
                    <Button asChild variant="outline" size="default" className="w-full sm:w-auto">
                      <Link to="/login">Sudah Punya Akun?</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </>}
          
          {user && <CategoryFilter selectedCategoryId={selectedCategoryId} onCategoryChange={setSelectedCategoryId} />}
          
          {/* Ad Banners - Only show if ads are enabled */}
          {shouldShowAds && <div className="container mx-auto">
              <div className="flex flex-col md:flex-row justify-center max-w-6xl mx-auto">
                <div className="w-full md:w-1/2">
                  <AdContainer position="banner" placeholder={false} adIndex={0} />
                </div>
                <div className="w-full md:w-1/2">
                  <AdContainer position="banner" placeholder={false} adIndex={1} />
                </div>
              </div>
              <div className="flex flex-col md:flex-row justify-center max-w-6xl mx-auto">
                <div className="w-full md:w-1/2">
                  <AdContainer position="banner" placeholder={false} adIndex={2} />
                </div>
                <div className="w-full md:w-1/2">
                  <AdContainer position="banner" placeholder={false} adIndex={3} />
                </div>
              </div>
            </div>}
          
          {/* Video Grid - Full Width */}
          <VideoGrid title={getVideoGridTitle()} selectedHashtagId={selectedHashtagId} selectedCategoryId={selectedCategoryId} searchQuery={searchQuery} />
          
          {/* Hashtag Filter */}
          <HashtagFilter selectedHashtagId={selectedHashtagId} onHashtagChange={setSelectedHashtagId} />
          
          {/* Disclaimer */}
          <div className="container mx-auto px-4 py-6">
            <div className="text-center text-sm text-muted-foreground bg-muted/30 rounded-lg p-4 border border-border/40">
              <p>
                Disclaimer: I don't own any content here. If you need a video removed or credited please contact me{" "}
                <Link to="/contact" className="text-primary hover:underline font-medium">
                  here
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </main>
      
      {/* Welcome Bonus Dialog */}
      <WelcomeBonusDialog
        open={welcomeBonus.showDialog}
        onClose={welcomeBonus.hideDialog}
        onClaim={welcomeBonus.claimBonus}
        loading={welcomeBonus.loading}
      />
      
      {/* Footer */}
      <footer className="bg-footer-bg backdrop-blur-md border-t border-border/40 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className="h-6 w-20" />
                </div>
              ) : settings.site_logo_url ? (
                <img 
                  src={settings.site_logo_url} 
                  alt="Logo" 
                  className="h-8 w-auto"
                />
              ) : (
                <>
                  <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">D</span>
                  </div>
                  <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                    {settings.site_title || 'DINO18'}
                  </span>
                </>
              )}
            </div>
            <p className="text-muted-foreground mb-4">
              {settings.site_description || 'Update Video Viral Terbaru Setiap Hari'}
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
              © 2024 {settings.site_title || 'DINO18'}. Semua hak dilindungi.
            </div>
          </div>
        </div>
      </footer>
    </div>;
};
export default Index;