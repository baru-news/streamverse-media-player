import { useState } from "react";
import { Globe, Image, FileText, Save, Loader2, Search, Upload, X, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";
import { supabase } from "@/integrations/supabase/client";

const WebsiteSettings = () => {
  const { settings, isLoading, updateSetting } = useWebsiteSettings();
  const [localSettings, setLocalSettings] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState<{ favicon?: boolean; logo?: boolean }>({});
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
        updateSetting('site_logo_url', currentSettings.site_logo_url || ''),
        updateSetting('favicon_url', currentSettings.favicon_url || ''),
        updateSetting('google_verification_code', currentSettings.google_verification_code || ''),
        updateSetting('meta_keywords', currentSettings.meta_keywords || ''),
        updateSetting('telegram_premium_group_id', currentSettings.telegram_premium_group_id || ''),
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

  const handleFileUpload = async (file: File, type: 'favicon' | 'logo') => {
    setIsUploading(prev => ({ ...prev, [type]: true }));
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}-${Date.now()}.${fileExt}`;
      const filePath = `${type}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('website-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('website-assets')
        .getPublicUrl(filePath);

      const settingKey = type === 'favicon' ? 'favicon_url' : 'site_logo_url';
      handleInputChange(settingKey, publicUrl);

      toast({
        title: "Berhasil",
        description: `${type === 'favicon' ? 'Favicon' : 'Logo'} berhasil diupload.`,
      });

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: `Gagal mengupload ${type === 'favicon' ? 'favicon' : 'logo'}.`,
        variant: "destructive",
      });
    } finally {
      setIsUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'favicon' | 'logo') => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/svg+xml'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Error",
          description: "Format file tidak didukung. Gunakan PNG, JPG, GIF, atau SVG.",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Ukuran file terlalu besar. Maksimal 5MB.",
          variant: "destructive",
        });
        return;
      }

      handleFileUpload(file, type);
    }
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
          <CardTitle className="text-foreground flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Informasi Website
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="site_title" className="text-foreground">Judul Website</Label>
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
            <Label htmlFor="site_description" className="text-foreground">Deskripsi Website</Label>
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


      {/* SEO & Analytics */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Search className="w-5 h-5" />
            SEO & Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="google_verification_code" className="text-foreground">Google Search Console Verification Code</Label>
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
            <Label htmlFor="meta_keywords" className="text-foreground">Meta Keywords</Label>
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
          <CardTitle className="text-foreground flex items-center gap-2">
            <Image className="w-5 h-5" />
            Logo dan Favicon
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Favicon Upload */}
          <div>
            <Label className="text-foreground mb-2 block">Favicon</Label>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {currentSettings.favicon_url && (
                  <div className="flex items-center gap-2">
                    <img 
                      src={currentSettings.favicon_url} 
                      alt="Favicon" 
                      className="w-8 h-8 rounded border"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleInputChange('favicon_url', '')}
                      className="h-8 w-8 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                <div className="flex-1 flex gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'favicon')}
                    className="hidden"
                    id="favicon-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('favicon-upload')?.click()}
                    disabled={isUploading.favicon}
                    className="gap-2"
                  >
                    {isUploading.favicon ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    Upload File
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="favicon_url" className="text-sm text-muted-foreground">Atau masukkan URL:</Label>
                <Input
                  id="favicon_url"
                  value={currentSettings.favicon_url || ''}
                  onChange={(e) => handleInputChange('favicon_url', e.target.value)}
                  placeholder="https://example.com/favicon.png"
                  className="bg-background/50 mt-1"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Upload file atau masukkan URL favicon (PNG, JPG, ICO). Ukuran recommended: 32x32px atau 16x16px
            </p>
          </div>

          {/* Logo Upload */}
          <div>
            <Label className="text-foreground mb-2 block">Logo Website</Label>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {currentSettings.site_logo_url && (
                  <div className="flex items-center gap-2">
                    <img 
                      src={currentSettings.site_logo_url} 
                      alt="Logo" 
                      className="h-12 w-auto rounded border"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleInputChange('site_logo_url', '')}
                      className="h-8 w-8 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                <div className="flex-1 flex gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'logo')}
                    className="hidden"
                    id="logo-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('logo-upload')?.click()}
                    disabled={isUploading.logo}
                    className="gap-2"
                  >
                    {isUploading.logo ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    Upload File
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="site_logo_url" className="text-sm text-muted-foreground">Atau masukkan URL:</Label>
                <Input
                  id="site_logo_url"
                  value={currentSettings.site_logo_url || ''}
                  onChange={(e) => handleInputChange('site_logo_url', e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="bg-background/50 mt-1"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Upload file atau masukkan URL logo (PNG, JPG, SVG). Ukuran recommended: 200x50px
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Telegram Integration */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Telegram Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="telegram_premium_group_id" className="text-foreground">Premium Group ID</Label>
            <Input
              id="telegram_premium_group_id"
              value={currentSettings.telegram_premium_group_id || ''}
              onChange={(e) => handleInputChange('telegram_premium_group_id', e.target.value)}
              placeholder="-1001234567890"
              className="bg-background/50"
            />
            <p className="text-xs text-muted-foreground mt-1">
              ID grup Telegram premium untuk undangan otomatis. Format: <code>-1001234567890</code>
            </p>
          </div>
          
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium mb-2">Cara mendapatkan Group ID:</p>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Invite bot @userinfobot ke grup Telegram</li>
              <li>Bot akan mengirim pesan dengan Group ID</li>
              <li>Copy ID yang dimulai dengan tanda minus (-)</li>
              <li>Paste ID tersebut ke field di atas</li>
              <li>Remove bot dari grup setelah selesai</li>
            </ol>
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