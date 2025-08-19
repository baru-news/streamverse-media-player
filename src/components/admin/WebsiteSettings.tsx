import { useState } from "react";
import { Globe, Image, FileText, Save, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";

const WebsiteSettings = () => {
  const { settings, isLoading, updateSetting } = useWebsiteSettings();
  const [localSettings, setLocalSettings] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Use settings from hook, fallback to local state
  const currentSettings = { ...settings, ...localSettings };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Update all settings
      await Promise.all([
        updateSetting('site_title', currentSettings.site_title || ''),
        updateSetting('site_description', currentSettings.site_description || ''),
        updateSetting('hero_title', currentSettings.hero_title || ''),
        updateSetting('hero_description', currentSettings.hero_description || ''),
        updateSetting('site_logo_url', currentSettings.site_logo_url || ''),
        updateSetting('favicon_url', currentSettings.favicon_url || ''),
        updateSetting('google_verification_code', currentSettings.google_verification_code || ''),
        updateSetting('meta_keywords', currentSettings.meta_keywords || ''),
      ]);

      toast({
        title: "Berhasil",
        description: "Pengaturan website berhasil disimpan.",
      });

      // Clear local changes
      setLocalSettings({});

    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan pengaturan.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (key: string, value: string) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="ml-2 text-muted-foreground">Memuat pengaturan...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Basic Website Information */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Informasi Website
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="site_title" className="text-white">Judul Website</Label>
            <Input
              id="site_title"
              value={currentSettings.site_title || ''}
              onChange={(e) => handleInputChange('site_title', e.target.value)}
              placeholder="Contoh: DINO18 - Platform Streaming Video"
              className="bg-background/50"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Judul ini akan muncul di tab browser dan mesin pencari
            </p>
          </div>

          <div>
            <Label htmlFor="site_description" className="text-white">Deskripsi Website</Label>
            <Textarea
              id="site_description"
              value={currentSettings.site_description || ''}
              onChange={(e) => handleInputChange('site_description', e.target.value)}
              placeholder="Deskripsi singkat tentang website Anda..."
              className="bg-background/50"
              rows={3}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Deskripsi untuk SEO dan media sosial
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Hero Section Settings */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Bagian Hero
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="hero_title" className="text-white">Judul Hero</Label>
            <Input
              id="hero_title"
              value={currentSettings.hero_title || ''}
              onChange={(e) => handleInputChange('hero_title', e.target.value)}
              placeholder="Selamat Datang di DINO18"
              className="bg-background/50"
            />
          </div>

          <div>
            <Label htmlFor="hero_description" className="text-white">Deskripsi Hero</Label>
            <Textarea
              id="hero_description"
              value={currentSettings.hero_description || ''}
              onChange={(e) => handleInputChange('hero_description', e.target.value)}
              placeholder="Platform streaming terbaik untuk menonton video..."
              className="bg-background/50"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* SEO & Analytics */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Search className="w-5 h-5" />
            SEO & Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="google_verification_code" className="text-white">Google Search Console Verification Code</Label>
            <Input
              id="google_verification_code"
              value={currentSettings.google_verification_code || ''}
              onChange={(e) => handleInputChange('google_verification_code', e.target.value)}
              placeholder="google-site-verification=xxxxxxxxx"
              className="bg-background/50"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Masukkan kode verifikasi dari Google Search Console (tanpa tag meta)
            </p>
          </div>

          <div>
            <Label htmlFor="meta_keywords" className="text-white">Meta Keywords</Label>
            <Textarea
              id="meta_keywords"
              value={currentSettings.meta_keywords || ''}
              onChange={(e) => handleInputChange('meta_keywords', e.target.value)}
              placeholder="video streaming, film online, entertainment"
              className="bg-background/50"
              rows={2}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Keywords umum untuk SEO (pisahkan dengan koma)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Logo and Favicon */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Image className="w-5 h-5" />
            Logo dan Favicon
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Favicon URL */}
          <div>
            <Label htmlFor="favicon_url" className="text-white mb-2 block">URL Favicon</Label>
            <div className="flex items-center gap-4">
              {currentSettings.favicon_url && (
                <img 
                  src={currentSettings.favicon_url} 
                  alt="Favicon" 
                  className="w-8 h-8 rounded"
                />
              )}
              <div className="flex-1">
                <Input
                  id="favicon_url"
                  value={currentSettings.favicon_url || ''}
                  onChange={(e) => handleInputChange('favicon_url', e.target.value)}
                  placeholder="https://example.com/favicon.png"
                  className="bg-background/50"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Masukkan URL gambar favicon (PNG, JPG, ICO). Ukuran recommended: 32x32px atau 16x16px
            </p>
          </div>

          {/* Logo URL */}
          <div>
            <Label htmlFor="site_logo_url" className="text-white mb-2 block">URL Logo Website</Label>
            <div className="flex items-center gap-4">
              {currentSettings.site_logo_url && (
                <img 
                  src={currentSettings.site_logo_url} 
                  alt="Logo" 
                  className="h-12 w-auto rounded"
                />
              )}
              <div className="flex-1">
                <Input
                  id="site_logo_url"
                  value={currentSettings.site_logo_url || ''}
                  onChange={(e) => handleInputChange('site_logo_url', e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="bg-background/50"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Masukkan URL gambar logo (PNG, JPG, SVG). Ukuran recommended: 200x50px
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          variant="hero"
          size="lg"
          className="gap-2"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Simpan Pengaturan
        </Button>
      </div>
    </div>
  );
};

export default WebsiteSettings;