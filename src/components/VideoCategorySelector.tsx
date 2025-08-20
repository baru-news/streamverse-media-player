import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Folder } from 'lucide-react';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;
  description: string;
}

interface VideoCategorySelectorProps {
  videoId: string;
  selectedCategoryId?: string | null;
  onCategoryChange?: (categoryId: string | null) => void;
  className?: string;
}

const VideoCategorySelector: React.FC<VideoCategorySelectorProps> = ({
  videoId,
  selectedCategoryId,
  onCategoryChange,
  className
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentCategoryId, setCurrentCategoryId] = useState<string | null>(selectedCategoryId || null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadCategories();
    loadVideoCategory();
  }, [videoId]);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Gagal memuat kategori');
    }
  };

  const loadVideoCategory = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('videos')
        .select('category_id')
        .eq('id', videoId)
        .maybeSingle();

      if (error) throw error;
      
      const categoryId = data?.category_id || null;
      setCurrentCategoryId(categoryId);
      
      if (onCategoryChange && categoryId !== selectedCategoryId) {
        onCategoryChange(categoryId);
      }
    } catch (error) {
      console.error('Error loading video category:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryChange = async (categoryId: string | null) => {
    try {
      setIsSaving(true);
      
      const { error } = await supabase
        .from('videos')
        .update({ category_id: categoryId })
        .eq('id', videoId);

      if (error) throw error;

      setCurrentCategoryId(categoryId);
      onCategoryChange?.(categoryId);
      
      const selectedCategory = categories.find(c => c.id === categoryId);
      toast.success(
        categoryId 
          ? `Video dikategorikan sebagai "${selectedCategory?.name}"`
          : 'Kategori video dihapus'
      );
    } catch (error: any) {
      console.error('Error updating video category:', error);
      toast.error(error.message || 'Gagal mengubah kategori video');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`space-y-2 ${className}`}>
        <Label className="text-sm font-medium">Kategori Video</Label>
        <div className="h-10 bg-muted animate-pulse rounded-md" />
      </div>
    );
  }

  const selectedCategory = categories.find(c => c.id === currentCategoryId);

  return (
    <div className={`space-y-2 ${className}`}>
      <Label className="text-sm font-medium flex items-center gap-2">
        <Folder className="w-4 h-4" />
        Kategori Video
        {isSaving && <span className="text-xs text-muted-foreground">(Menyimpan...)</span>}
      </Label>
      
      <div className="space-y-2">
        <Select
          value={currentCategoryId || 'none'}
          onValueChange={(value) => handleCategoryChange(value === 'none' ? null : value)}
          disabled={isSaving}
        >
          <SelectTrigger>
            <SelectValue placeholder="Pilih kategori">
              {selectedCategory ? (
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: selectedCategory.color }}
                  />
                  {selectedCategory.name}
                </div>
              ) : (
                'Tidak ada kategori'
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-400" />
                Tidak ada kategori
              </div>
            </SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  {category.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedCategory && (
          <Badge 
            variant="secondary"
            className="text-xs"
            style={{
              backgroundColor: `${selectedCategory.color}20`,
              color: selectedCategory.color,
              borderColor: selectedCategory.color
            }}
          >
            <Folder className="w-3 h-3 mr-1" />
            {selectedCategory.name}
          </Badge>
        )}
      </div>
    </div>
  );
};

export default VideoCategorySelector;