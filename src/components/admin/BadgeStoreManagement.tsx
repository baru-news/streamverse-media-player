import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Edit, Trash2, Star, Shield, Crown, Gem, CircleDot, Upload, X } from "lucide-react";

interface BadgeStoreItem {
  id: string;
  badge_key: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  rarity: string;
  price_coins: number;
  is_active: boolean;
  sort_order: number;
  image_url: string | null;
  created_at: string;
}

const BadgeStoreManagement = () => {
  const [badges, setBadges] = useState<BadgeStoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingBadge, setEditingBadge] = useState<BadgeStoreItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    badge_key: "",
    name: "",
    description: "",
    icon: "star",
    color: "#3b82f6",
    rarity: "common",
    price_coins: 100,
    is_active: true,
    sort_order: 0,
    image_url: null as string | null
  });

  const iconOptions = [
    { value: "star", label: "Star", icon: Star },
    { value: "shield", label: "Shield", icon: Shield },
    { value: "crown", label: "Crown", icon: Crown },
    { value: "gem", label: "Gem", icon: Gem },
    { value: "circle-dot", label: "Circle Dot", icon: CircleDot }
  ];

  const rarityOptions = [
    { value: "common", label: "Common", color: "#9ca3af" },
    { value: "rare", label: "Rare", color: "#3b82f6" },
    { value: "epic", label: "Epic", color: "#8b5cf6" },
    { value: "legendary", label: "Legendary", color: "#f59e0b" }
  ];

  useEffect(() => {
    fetchBadges();
  }, []);

  const fetchBadges = async () => {
    try {
      const { data, error } = await supabase
        .from('badge_store')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setBadges(data || []);
    } catch (error) {
      console.error('Error fetching badges:', error);
      toast({
        title: "Error",
        description: "Failed to fetch badges",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingBadge) {
        // Update existing badge
        const { error } = await supabase
          .from('badge_store')
          .update(formData)
          .eq('id', editingBadge.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Badge updated successfully"
        });
      } else {
        // Create new badge
        const maxSortOrder = Math.max(...badges.map(b => b.sort_order), 0);
        const { error } = await supabase
          .from('badge_store')
          .insert([{
            ...formData,
            sort_order: maxSortOrder + 1
          }]);

        if (error) throw error;
        
        toast({
          title: "Success", 
          description: "Badge created successfully"
        });
      }

      resetForm();
      setDialogOpen(false);
      fetchBadges();
    } catch (error) {
      console.error('Error saving badge:', error);
      toast({
        title: "Error",
        description: "Failed to save badge",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (badge: BadgeStoreItem) => {
    setEditingBadge(badge);
    setFormData({
      badge_key: badge.badge_key,
      name: badge.name,
      description: badge.description || "",
      icon: badge.icon,
      color: badge.color,
      rarity: badge.rarity,
      price_coins: badge.price_coins,
      is_active: badge.is_active,
      sort_order: badge.sort_order,
      image_url: badge.image_url
    });
    setImagePreview(badge.image_url);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('badge_store')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Badge deleted successfully"
      });
      
      fetchBadges();
    } catch (error) {
      console.error('Error deleting badge:', error);
      toast({
        title: "Error",
        description: "Failed to delete badge",
        variant: "destructive"
      });
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('badge_store')
        .update({ is_active: !isActive })
        .eq('id', id);

      if (error) throw error;
      
      fetchBadges();
      toast({
        title: "Success",
        description: `Badge ${!isActive ? 'activated' : 'deactivated'} successfully`
      });
    } catch (error) {
      console.error('Error toggling badge status:', error);
      toast({
        title: "Error",
        description: "Failed to update badge status",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      badge_key: "",
      name: "",
      description: "",
      icon: "star",
      color: "#3b82f6",
      rarity: "common",
      price_coins: 100,
      is_active: true,
      sort_order: 0,
      image_url: null
    });
    setEditingBadge(null);
    setImagePreview(null);
  };

  const getIconComponent = (iconName: string) => {
    const iconOption = iconOptions.find(opt => opt.value === iconName);
    return iconOption ? iconOption.icon : Star;
  };

  const getRarityColor = (rarity: string) => {
    const rarityOption = rarityOptions.find(opt => opt.value === rarity);
    return rarityOption ? rarityOption.color : "#9ca3af";
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image size must be less than 2MB",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    
    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      // Upload to Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from('badge-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('badge-images')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      setImagePreview(publicUrl);
      
      toast({
        title: "Success",
        description: "Image uploaded successfully"
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image_url: null }));
    setImagePreview(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Badge Store Management</h2>
          <p className="text-muted-foreground">Kelola badge yang tersedia di toko</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Badge
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingBadge ? 'Edit Badge' : 'Add New Badge'}
              </DialogTitle>
              <DialogDescription>
                {editingBadge ? 'Update badge information' : 'Create a new badge for the store'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="badge_key">Badge Key</Label>
                <Input
                  id="badge_key"
                  value={formData.badge_key}
                  onChange={(e) => setFormData(prev => ({ ...prev, badge_key: e.target.value }))}
                  placeholder="unique_badge_key"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Badge Name"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Badge description"
                  rows={3}
                />
              </div>

              {/* Image Upload Section */}
              <div>
                <Label>Badge Image</Label>
                <div className="space-y-3">
                  {imagePreview ? (
                    <div className="flex items-center gap-3">
                      <img 
                        src={imagePreview} 
                        alt="Badge preview" 
                        className="w-16 h-16 object-cover rounded-lg border"
                      />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Custom image uploaded</p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={removeImage}
                          className="mt-1"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                        disabled={uploading}
                      />
                      <label
                        htmlFor="image-upload"
                        className="cursor-pointer flex flex-col items-center gap-2"
                      >
                        {uploading ? (
                          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                        ) : (
                          <Upload className="w-8 h-8 text-muted-foreground" />
                        )}
                        <div className="text-sm text-muted-foreground">
                          {uploading ? "Uploading..." : "Click to upload badge image"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Recommended: 64x64px, Max 2MB, PNG/JPG
                        </div>
                      </label>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="icon">Icon</Label>
                  <Select value={formData.icon} onValueChange={(value) => setFormData(prev => ({ ...prev, icon: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {iconOptions.map((option) => {
                        const IconComponent = option.icon;
                        return (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <IconComponent className="w-4 h-4" />
                              {option.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="rarity">Rarity</Label>
                  <Select value={formData.rarity} onValueChange={(value) => setFormData(prev => ({ ...prev, rarity: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {rarityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: option.color }}
                            />
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="price_coins">Price (Coins)</Label>
                  <Input
                    id="price_coins"
                    type="number"
                    min="0"
                    value={formData.price_coins}
                    onChange={(e) => setFormData(prev => ({ ...prev, price_coins: parseInt(e.target.value) || 0 }))}
                    required
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  {editingBadge ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Badges Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {badges.map((badge) => {
          const IconComponent = getIconComponent(badge.icon);
          const rarityColor = getRarityColor(badge.rarity);
          
          return (
            <Card key={badge.id} className={`bg-card/50 backdrop-blur-sm border-border/50 ${!badge.is_active ? 'opacity-50' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {badge.image_url ? (
                      <img 
                        src={badge.image_url} 
                        alt={badge.name}
                        className="w-12 h-12 object-cover rounded-lg border"
                      />
                    ) : (
                      <div 
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: badge.color + '20', color: badge.color }}
                      >
                        <IconComponent className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-lg text-white">{badge.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant="secondary" 
                          className="text-xs"
                          style={{ backgroundColor: rarityColor + '20', color: rarityColor }}
                        >
                          {badge.rarity}
                        </Badge>
                        <Badge variant={badge.is_active ? "default" : "secondary"} className="text-xs">
                          {badge.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
                
                {badge.description && (
                  <CardDescription className="text-sm">
                    {badge.description}
                  </CardDescription>
                )}
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-lg font-semibold text-white">
                    {badge.price_coins} coins
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(badge)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActive(badge.id, badge.is_active)}
                  >
                    <Switch checked={badge.is_active} className="w-4 h-4" />
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Badge</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{badge.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(badge.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {badges.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">No badges found</div>
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add First Badge
          </Button>
        </div>
      )}
    </div>
  );
};

export default BadgeStoreManagement;