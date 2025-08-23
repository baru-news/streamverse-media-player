import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAds } from "@/hooks/useAds";
import { Upload, Edit2, Trash2, Eye, EyeOff, Plus, Image } from "lucide-react";
import { toast } from "sonner";

interface AdFormData {
  title: string;
  image_url: string;
  link_url: string;
  position: string;
  sort_order: number;
}

// Informasi ukuran untuk setiap posisi
const AD_SIZE_INFO = {
  banner: { 
    recommended: '300x70px', 
    description: 'Banner horizontal (4 slot dalam grid 2x2)',
    ratio: '4.29:1',
    maxWidth: 400,
    minWidth: 200
  },
  content: { 
    recommended: '300x70px', 
    description: 'Banner di atas video player (mobile)',
    ratio: '4.29:1',
    maxWidth: 400,
    minWidth: 200
  },
  sidebar: { 
    recommended: '300x70px', 
    description: 'Banner di atas rekomendasi (desktop)',
    ratio: '4.29:1',
    maxWidth: 400,
    minWidth: 200
  },
  'video-grid': { 
    recommended: '180x150px', 
    description: 'Kartu kecil setiap 10 video (6 per baris)',
    ratio: '1.2:1',
    maxWidth: 250,
    minWidth: 120
  }
};

const AdsManagement = () => {
  const { ads, settings, isLoading, updateSetting, createAd, updateAd, deleteAd, uploadAdImage } = useAds();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<'url' | 'upload'>('url');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string>("");
  const [formData, setFormData] = useState<AdFormData>({
    title: "",
    image_url: "",
    link_url: "",
    position: "content",
    sort_order: 0,
  });

  const validateImageDimensions = (file: File, position: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new HTMLImageElement();
      img.onload = () => {
        const sizeInfo = AD_SIZE_INFO[position as keyof typeof AD_SIZE_INFO];
        if (!sizeInfo) return resolve(true);

        const aspectRatio = img.width / img.height;
        const [targetWidth, targetHeight] = sizeInfo.recommended.split('x').map(Number);
        const targetRatio = targetWidth / targetHeight;
        
        // Allow 10% tolerance for aspect ratio
        const tolerance = 0.1;
        const ratioMatch = Math.abs(aspectRatio - targetRatio) <= (targetRatio * tolerance);
        
        if (!ratioMatch) {
          toast.error(`Rasio gambar tidak sesuai. Untuk posisi ${position}, gunakan rasio ${sizeInfo.ratio} (disarankan: ${sizeInfo.recommended})`);
          return resolve(false);
        }
        
        if (img.width > sizeInfo.maxWidth || img.width < sizeInfo.minWidth) {
          toast.error(`Lebar gambar ${img.width}px tidak sesuai. Untuk posisi ${position}, gunakan lebar ${sizeInfo.minWidth}-${sizeInfo.maxWidth}px`);
          return resolve(false);
        }
        
        resolve(true);
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Validate file type (support images including GIF)
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Format file tidak didukung. Gunakan JPG, PNG, GIF, atau WebP.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file terlalu besar. Maksimal 5MB.');
      return;
    }

    // Validate image dimensions
    const isValidDimensions = await validateImageDimensions(file, formData.position);
    if (!isValidDimensions) return;

    setIsUploading(true);
    try {
      const imageUrl = await uploadAdImage(file);
      setFormData(prev => ({ ...prev, image_url: imageUrl }));
      setPreviewImage(imageUrl);
      toast.success('Gambar berhasil diupload');
    } catch (error) {
      // Error handled in hook
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.image_url) {
      toast.error('Gambar iklan wajib diisi');
      return;
    }
    
    try {
      if (editingAd) {
        await updateAd(editingAd.id, {
          ...formData,
          is_active: editingAd.is_active,
        });
      } else {
        await createAd({
          ...formData,
          is_active: true,
        });
      }
      
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      // Error handled in hook
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      image_url: "",
      link_url: "",
      position: "content",
      sort_order: 0,
    });
    setEditingAd(null);
    setUploadMethod('url');
    setPreviewImage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleEdit = (ad: any) => {
    setEditingAd(ad);
    setFormData({
      title: ad.title,
      image_url: ad.image_url,
      link_url: ad.link_url || "",
      position: ad.position,
      sort_order: ad.sort_order,
    });
    setPreviewImage(ad.image_url);
    setUploadMethod('url');
    setIsDialogOpen(true);
  };

  const toggleAdStatus = async (ad: any) => {
    await updateAd(ad.id, { is_active: !ad.is_active });
  };

  const handleDelete = async (ad: any) => {
    if (confirm('Apakah Anda yakin ingin menghapus iklan ini?')) {
      await deleteAd(ad.id);
    }
  };

  if (isLoading) {
    return <div>Memuat...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Pengaturan Iklan Global</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="ads-enabled">Aktifkan Iklan</Label>
            <Switch
              id="ads-enabled"
              checked={settings.ads_enabled}
              onCheckedChange={(checked) => updateSetting('ads_enabled', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="ads-guests">Tampilkan ke Tamu</Label>
            <Switch
              id="ads-guests"
              checked={settings.show_ads_to_guests}
              onCheckedChange={(checked) => updateSetting('show_ads_to_guests', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="ads-users">Tampilkan ke User Terdaftar</Label>
            <Switch
              id="ads-users"
              checked={settings.show_ads_to_users}
              onCheckedChange={(checked) => updateSetting('show_ads_to_users', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Manajemen Iklan</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Iklan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingAd ? 'Edit Iklan' : 'Tambah Iklan Baru'}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Judul</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <Label>Metode Gambar</Label>
                  <div className="flex gap-2 mb-3">
                    <Button
                      type="button"
                      variant={uploadMethod === 'url' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setUploadMethod('url')}
                    >
                      URL
                    </Button>
                    <Button
                      type="button"
                      variant={uploadMethod === 'upload' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setUploadMethod('upload')}
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      Upload
                    </Button>
                  </div>

                  {uploadMethod === 'url' ? (
                    <div>
                      <Label htmlFor="image_url">URL Gambar</Label>
                      <Input
                        id="image_url"
                        type="url"
                        value={formData.image_url}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, image_url: e.target.value }));
                          setPreviewImage(e.target.value);
                        }}
                        placeholder="https://example.com/image.jpg"
                        required
                      />
                    </div>
                  ) : (
                    <div>
                      <Label htmlFor="file_upload">Upload Gambar</Label>
                      <div className="mt-2">
                        <input
                          ref={fileInputRef}
                          id="file_upload"
                          type="file"
                          accept="image/*,.gif"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFileUpload(file);
                            }
                          }}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                          className="w-full"
                        >
                          {isUploading ? (
                            "Mengupload..."
                          ) : (
                            <>
                              <Image className="h-4 w-4 mr-2" />
                              Pilih File (JPG, PNG, GIF, WebP)
                            </>
                          )}
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Maksimal 5MB. Format: JPG, PNG, GIF, WebP
                      </p>
                    </div>
                  )}

                  {previewImage && (
                    <div className="mt-3">
                      <Label>Preview</Label>
                      <div className="mt-1 p-2 border rounded-lg">
                        <img
                          src={previewImage}
                          alt="Preview"
                          className="max-w-full h-32 object-contain mx-auto"
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="link_url">URL Link (Opsional)</Label>
                  <Input
                    id="link_url"
                    type="url"
                    value={formData.link_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, link_url: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="position">Posisi</Label>
                  <Select
                    value={formData.position}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, position: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(AD_SIZE_INFO).map(([key, info]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {key === 'content' && 'Content'}
                              {key === 'sidebar' && 'Sidebar'}
                              {key === 'banner' && 'Banner'}
                              {key === 'video-grid' && 'Setiap 10 Video'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {info.recommended} • {info.description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {formData.position && (
                    <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-start gap-2">
                        <div className="text-sm">
                          <p className="font-medium text-primary">
                            📐 Ukuran Optimal: {AD_SIZE_INFO[formData.position as keyof typeof AD_SIZE_INFO]?.recommended}
                          </p>
                          <p className="text-muted-foreground mt-1">
                            {AD_SIZE_INFO[formData.position as keyof typeof AD_SIZE_INFO]?.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Rasio: {AD_SIZE_INFO[formData.position as keyof typeof AD_SIZE_INFO]?.ratio}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="sort_order">Urutan</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {editingAd ? 'Perbarui' : 'Tambah'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="flex-1"
                  >
                    Batal
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {ads.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Belum ada iklan. Tambahkan iklan pertama Anda.
              </p>
            ) : (
              ads.map((ad) => (
                <div key={ad.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <img
                      src={ad.image_url}
                      alt={ad.title}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div>
                      <h3 className="font-medium">{ad.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {ad.position} • Urutan: {ad.sort_order}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleAdStatus(ad)}
                    >
                      {ad.is_active ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(ad)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(ad)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdsManagement;