import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAds } from "@/hooks/useAds";
import { Upload, Edit2, Trash2, Eye, EyeOff, Plus } from "lucide-react";
import { toast } from "sonner";

interface AdFormData {
  title: string;
  image_url: string;
  link_url: string;
  position: string;
  size: string;
  sort_order: number;
}

const AdsManagement = () => {
  const { ads, settings, isLoading, updateSetting, createAd, updateAd, deleteAd } = useAds();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<any>(null);
  const [formData, setFormData] = useState<AdFormData>({
    title: "",
    image_url: "",
    link_url: "",
    position: "content",
    size: "banner",
    sort_order: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      size: "banner",
      sort_order: 0,
    });
    setEditingAd(null);
  };

  const handleEdit = (ad: any) => {
    setEditingAd(ad);
    setFormData({
      title: ad.title,
      image_url: ad.image_url,
      link_url: ad.link_url || "",
      position: ad.position,
      size: ad.size,
      sort_order: ad.sort_order,
    });
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
                  <Label htmlFor="image_url">URL Gambar</Label>
                  <Input
                    id="image_url"
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                    required
                  />
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
                      <SelectItem value="content">Content</SelectItem>
                      <SelectItem value="sidebar">Sidebar</SelectItem>
                      <SelectItem value="banner">Banner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="size">Ukuran</Label>
                  <Select
                    value={formData.size}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, size: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="banner">Banner</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="square">Square</SelectItem>
                    </SelectContent>
                  </Select>
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
                        {ad.position} • {ad.size} • Urutan: {ad.sort_order}
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