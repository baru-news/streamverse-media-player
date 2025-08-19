import { useState, useEffect } from "react";
import { Plus, Edit3, Trash2, Hash, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Hashtag {
  id: string;
  name: string;
  description?: string;
  color: string;
  is_active: boolean;
  created_at: string;
}

const HashtagManagement = () => {
  const [hashtags, setHashtags] = useState<Hashtag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newHashtag, setNewHashtag] = useState({
    name: "",
    description: "",
    color: "#3b82f6"
  });
  const [editForm, setEditForm] = useState<{
    name: string;
    description: string;
    color: string;
  }>({ name: "", description: "", color: "#3b82f6" });
  const { toast } = useToast();

  const loadHashtags = async () => {
    try {
      const { data, error } = await supabase
        .from('hashtags')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHashtags(data || []);
    } catch (error) {
      console.error("Failed to load hashtags:", error);
      toast({
        title: "Error",
        description: "Gagal memuat hashtag. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateHashtag = async () => {
    if (!newHashtag.name.trim()) {
      toast({
        title: "Error",
        description: "Nama hashtag tidak boleh kosong.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('hashtags')
        .insert([{
          name: newHashtag.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
          description: newHashtag.description,
          color: newHashtag.color
        }])
        .select()
        .single();

      if (error) throw error;

      setHashtags([data, ...hashtags]);
      setNewHashtag({ name: "", description: "", color: "#3b82f6" });
      setIsCreating(false);

      toast({
        title: "Berhasil",
        description: "Hashtag berhasil dibuat.",
      });
    } catch (error: any) {
      console.error("Failed to create hashtag:", error);
      toast({
        title: "Error",
        description: error.message.includes('duplicate') 
          ? "Hashtag dengan nama tersebut sudah ada." 
          : "Gagal membuat hashtag. Silakan coba lagi.",
        variant: "destructive",
      });
    }
  };

  const handleEditHashtag = (hashtag: Hashtag) => {
    setEditingId(hashtag.id);
    setEditForm({
      name: hashtag.name,
      description: hashtag.description || "",
      color: hashtag.color
    });
  };

  const handleSaveEdit = async () => {
    if (!editForm.name.trim()) return;

    try {
      const { error } = await supabase
        .from('hashtags')
        .update({
          name: editForm.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
          description: editForm.description,
          color: editForm.color
        })
        .eq('id', editingId);

      if (error) throw error;

      setHashtags(hashtags.map(hashtag =>
        hashtag.id === editingId
          ? { ...hashtag, name: editForm.name, description: editForm.description, color: editForm.color }
          : hashtag
      ));

      setEditingId(null);
      toast({
        title: "Berhasil",
        description: "Hashtag berhasil diperbarui.",
      });
    } catch (error: any) {
      console.error("Failed to update hashtag:", error);
      toast({
        title: "Error",
        description: error.message.includes('duplicate') 
          ? "Hashtag dengan nama tersebut sudah ada." 
          : "Gagal memperbarui hashtag. Silakan coba lagi.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteHashtag = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus hashtag ini?")) return;

    try {
      const { error } = await supabase
        .from('hashtags')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setHashtags(hashtags.filter(hashtag => hashtag.id !== id));
      toast({
        title: "Berhasil",
        description: "Hashtag berhasil dihapus.",
      });
    } catch (error) {
      console.error("Failed to delete hashtag:", error);
      toast({
        title: "Error",
        description: "Gagal menghapus hashtag. Silakan coba lagi.",
        variant: "destructive",
      });
    }
  };

  const toggleHashtagStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('hashtags')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      setHashtags(hashtags.map(hashtag =>
        hashtag.id === id
          ? { ...hashtag, is_active: !currentStatus }
          : hashtag
      ));

      toast({
        title: "Berhasil",
        description: `Hashtag berhasil ${!currentStatus ? 'diaktifkan' : 'dinonaktifkan'}.`,
      });
    } catch (error) {
      console.error("Failed to toggle hashtag status:", error);
      toast({
        title: "Error",
        description: "Gagal mengubah status hashtag. Silakan coba lagi.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadHashtags();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2 text-muted-foreground">Memuat hashtag...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Hash className="w-6 h-6" />
            Kelola Hashtag
          </h2>
          <p className="text-muted-foreground">
            Tambah, edit, dan kelola hashtag untuk video Anda
          </p>
        </div>
        <Button
          variant="hero"
          onClick={() => setIsCreating(true)}
          className="gap-2"
          disabled={isCreating}
        >
          <Plus className="w-4 h-4" />
          Tambah Hashtag
        </Button>
      </div>

      {/* Create New Hashtag */}
      {isCreating && (
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-white">Buat Hashtag Baru</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="new-name" className="text-white">
                  Nama Hashtag
                </Label>
                <Input
                  id="new-name"
                  value={newHashtag.name}
                  onChange={(e) => setNewHashtag(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="gaming, tutorial, dll"
                  className="bg-background/50"
                />
              </div>
              <div>
                <Label htmlFor="new-color" className="text-white">
                  Warna
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="new-color"
                    type="color"
                    value={newHashtag.color}
                    onChange={(e) => setNewHashtag(prev => ({ ...prev, color: e.target.value }))}
                    className="w-16 h-10 bg-background/50"
                  />
                  <Input
                    value={newHashtag.color}
                    onChange={(e) => setNewHashtag(prev => ({ ...prev, color: e.target.value }))}
                    placeholder="#3b82f6"
                    className="bg-background/50"
                  />
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="new-description" className="text-white">
                Deskripsi (Opsional)
              </Label>
              <Textarea
                id="new-description"
                value={newHashtag.description}
                onChange={(e) => setNewHashtag(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Deskripsi singkat tentang hashtag ini..."
                className="bg-background/50"
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="hero"
                onClick={handleCreateHashtag}
                className="gap-2"
              >
                <Save className="w-4 h-4" />
                Simpan
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsCreating(false);
                  setNewHashtag({ name: "", description: "", color: "#3b82f6" });
                }}
                className="gap-2"
              >
                <X className="w-4 h-4" />
                Batal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hashtag List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {hashtags.map((hashtag) => (
          <Card key={hashtag.id} className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-4">
              {editingId === hashtag.id ? (
                <div className="space-y-4">
                  <div>
                    <Label className="text-white">Nama</Label>
                    <Input
                      value={editForm.name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      className="bg-background/50"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Warna</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={editForm.color}
                        onChange={(e) => setEditForm(prev => ({ ...prev, color: e.target.value }))}
                        className="w-16 h-8 bg-background/50"
                      />
                      <Input
                        value={editForm.color}
                        onChange={(e) => setEditForm(prev => ({ ...prev, color: e.target.value }))}
                        className="bg-background/50"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-white">Deskripsi</Label>
                    <Textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                      className="bg-background/50"
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSaveEdit}
                      className="gap-1 flex-1"
                    >
                      <Save className="w-3 h-3" />
                      Simpan
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingId(null)}
                      className="gap-1"
                    >
                      <X className="w-3 h-3" />
                      Batal
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <Badge 
                      style={{ backgroundColor: hashtag.color + '20', color: hashtag.color }}
                      className="font-medium"
                    >
                      #{hashtag.name}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditHashtag(hashtag)}
                        className="p-1"
                      >
                        <Edit3 className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteHashtag(hashtag.id)}
                        className="p-1 text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  
                  {hashtag.description && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {hashtag.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Status: 
                      <span className={`ml-1 ${hashtag.is_active ? 'text-green-400' : 'text-red-400'}`}>
                        {hashtag.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleHashtagStatus(hashtag.id, hashtag.is_active)}
                      className="text-xs"
                    >
                      {hashtag.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {hashtags.length === 0 && (
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="py-12 text-center">
            <Hash className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-white font-medium mb-2">Belum ada hashtag</p>
            <p className="text-muted-foreground">
              Buat hashtag pertama untuk mengorganisir video Anda
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HashtagManagement;