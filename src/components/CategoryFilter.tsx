import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// CategoryFilter component for filtering videos by category

interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;
  description: string;
  sort_order: number;
}
interface CategoryFilterProps {
  selectedCategoryId: string | null;
  onCategoryChange: (categoryId: string | null) => void;
}
const CategoryFilter = ({
  selectedCategoryId,
  onCategoryChange
}: CategoryFilterProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    loadCategories();
  }, []);
  const loadCategories = async () => {
    try {
      setIsLoading(true);
      const {
        data,
        error
      } = await supabase.from('categories').select('*').eq('is_active', true).order('sort_order');
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setIsLoading(false);
    }
  };
  if (isLoading) {
    return <section className="py-6 overflow-hidden">
        <div className="container mx-auto px-4">
          <h3 className="text-lg font-semibold text-foreground mb-4">Kategori</h3>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 px-1">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="flex-shrink-0 h-10 w-24 bg-card/50 animate-pulse rounded-lg border border-border" />)}
          </div>
        </div>
      </section>;
  }
  return <section className="overflow-hidden py-0 my-[35px]">
      <div className="container mx-auto px-4">
        <h3 className="text-lg font-semibold text-foreground mb-4">Kategori</h3>
        
        {/* Horizontal Scrollable Categories */}
        <div className="relative">
          {/* Gradient overlays for scroll indicators */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
          
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 px-1">
            {/* All Videos Button */}
            <button onClick={() => onCategoryChange(null)} className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${selectedCategoryId === null ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'bg-card/50 text-foreground hover:bg-card/80 border-border hover:border-border/60'}`}>
              Semua Video
            </button>

            {/* Category Buttons */}
            {categories.map(category => <button key={category.id} onClick={() => onCategoryChange(category.id)} className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${selectedCategoryId === category.id ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'bg-card/50 text-foreground hover:bg-card/80 border-border hover:border-border/60'}`} title={category.description}>
                <span className="whitespace-nowrap">{category.name}</span>
              </button>)}
            
            {/* Spacer for better scroll experience */}
            <div className="flex-shrink-0 w-4" />
          </div>
        </div>
      </div>
    </section>;
};
export default CategoryFilter;