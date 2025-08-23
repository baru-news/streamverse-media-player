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
import { cn } from "@/lib/utils";

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
          <h2 className="text-2xl font-bold text-foreground">Badge Store Management</h2>
          <p className="text-muted-foreground">Kelola badge yang tersedia di toko</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => resetForm()} 
              className="gap-2 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg hover:shadow-primary/25 transition-all duration-300"
            >
              <Plus className="w-4 h-4" />
              Add Badge
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-md bg-gradient-to-br from-background via-background to-muted/20 border border-border/50 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {editingBadge ? 'Edit Badge' : 'Add New Badge'}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {editingBadge ? 'Update badge information and settings' : 'Create a new badge for the store with custom properties'}
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
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setDialogOpen(false)}
                  className="border-border/50 hover:bg-muted/50"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={submitting}
                  className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 disabled:opacity-50 shadow-lg transition-all duration-300"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  {editingBadge ? 'Update Badge' : 'Create Badge'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Badges Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {badges.map((badge, index) => {
          const IconComponent = getIconComponent(badge.icon);
          const rarityColor = getRarityColor(badge.rarity);
          
          return (
            <Card 
              key={badge.id} 
              className={cn(
                "group relative overflow-hidden transition-all duration-300 hover-scale cursor-pointer",
                "bg-gradient-to-br from-card via-card to-muted/20 border border-border/50",
                "hover:shadow-xl hover:shadow-primary/10 hover:border-primary/30 animate-fade-in",
                !badge.is_active && 'opacity-60 grayscale'
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <CardHeader className="pb-3 relative z-10">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {badge.image_url ? (
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <img 
                            src={badge.image_url} 
                            alt={badge.name}
                            className="w-12 h-12 object-cover rounded-xl border border-border/50 relative z-10"
                          />
                        </div>
                      ) : (
                        <div 
                          className="p-3 rounded-xl shadow-md relative z-10 transition-transform duration-300 group-hover:scale-110"
                          style={{ backgroundColor: badge.color + '20', color: badge.color }}
                        >
                          <IconComponent className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors duration-300">
                        {badge.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-xs font-medium border-2 px-2 py-1",
                            badge.rarity === 'common' && "border-gray-400/50 bg-gray-100/50 text-gray-600 dark:bg-gray-800/50 dark:text-gray-300",
                            badge.rarity === 'rare' && "border-blue-400/50 bg-blue-100/50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300",
                            badge.rarity === 'epic' && "border-purple-400/50 bg-purple-100/50 text-purple-600 dark:bg-purple-900/50 dark:text-purple-300",
                            badge.rarity === 'legendary' && "border-yellow-400/50 bg-yellow-100/50 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-300"
                          )}
                        >
                          {badge.rarity}
                        </Badge>
                        <Badge 
                          variant={badge.is_active ? "default" : "secondary"} 
                          className={cn(
                            "text-xs font-medium",
                            badge.is_active && "bg-gradient-to-r from-primary/80 to-accent/80"
                          )}
                        >
                          {badge.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
                
                {badge.description && (
                  <CardDescription className="text-sm mt-3 line-clamp-2">
                    {badge.description}
                  </CardDescription>
                )}
              </CardHeader>
              
              <CardContent className="pt-0 relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-full border border-yellow-500/20 shadow-sm">
                    <Gem className="w-4 h-4 text-yellow-500" />
                    <span className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{badge.price_coins}</span>
                    <span className="text-sm text-muted-foreground">coins</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Key: <span className="font-mono bg-muted/50 px-1 py-0.5 rounded">{badge.badge_key}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(badge)}
                    className="flex-1 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30 hover:from-primary/20 hover:to-accent/20 transition-all duration-300"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  
                  <div className="flex items-center space-x-2 px-2 py-1 bg-muted/30 rounded-lg border border-border/30">
                    <Switch 
                      checked={badge.is_active} 
                      onCheckedChange={(checked) => toggleActive(badge.id, !badge.is_active)}
                      className="w-4 h-4" 
                    />
                    <Label className="text-xs whitespace-nowrap">Active</Label>
                  </div>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30 transition-colors duration-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-gradient-to-br from-background via-background to-muted/20 border border-border/50 shadow-2xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Badge</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete <strong>"{badge.name}"</strong>? This action cannot be undone and will affect all users who own this badge.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(badge.id)}
                          className="bg-gradient-to-r from-destructive to-destructive/90 hover:from-destructive/90 hover:to-destructive text-destructive-foreground"
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
        <div className="text-center py-16">
          <div className="relative mx-auto w-24 h-24 mb-8">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-xl opacity-50 animate-pulse" />
            <div className="relative bg-gradient-to-br from-muted via-card to-muted/50 rounded-full p-6 border border-border/50 shadow-lg">
              <Star className="w-12 h-12 text-muted-foreground/70 mx-auto" />
            </div>
          </div>
          <h3 className="text-2xl font-bold mb-2 text-foreground">No badges found</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Start building your badge collection by creating the first badge for your store.
          </p>
          <Button 
            onClick={() => setDialogOpen(true)} 
            className="gap-2 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg hover:shadow-primary/25 font-medium transition-all duration-300"
          >
            <Plus className="w-4 h-4" />
            Add First Badge
          </Button>
        </div>
      )}
    </div>
  );
};

export default BadgeStoreManagement;