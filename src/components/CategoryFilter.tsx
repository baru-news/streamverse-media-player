import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Folder } from 'lucide-react';

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

const CategoryFilter = ({ selectedCategoryId, onCategoryChange }: CategoryFilterProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <section className="py-6 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-4">
            <Folder className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Kategori</h3>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex-shrink-0 h-12 w-28 bg-muted animate-pulse rounded-full" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-6 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 mb-4">
          <Folder className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Kategori</h3>
        </div>
        
        {/* Horizontal Scrollable Categories */}
        <div className="relative">
          {/* Gradient overlays for scroll indicators */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
          
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 px-1">
            {/* All Videos Button */}
            <button
              onClick={() => onCategoryChange(null)}
              className={`flex-shrink-0 px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 backdrop-blur-sm ${
                selectedCategoryId === null
                  ? 'bg-primary text-primary-foreground shadow-[0_0_20px_rgba(59,130,246,0.5)] scale-105 border-2 border-primary/30'
                  : 'bg-secondary/30 text-secondary-foreground hover:bg-secondary/50 hover:scale-105 border-2 border-secondary/20 hover:border-secondary/40'
              }`}
            >
              <span className="flex items-center gap-2">
                <Folder className="w-4 h-4" />
                Semua Video
              </span>
            </button>

            {/* Category Buttons */}
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => onCategoryChange(category.id)}
                className={`flex-shrink-0 px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 backdrop-blur-sm flex items-center gap-2 ${
                  selectedCategoryId === category.id
                    ? 'scale-105 shadow-[0_0_20px] hover:scale-110'
                    : 'hover:scale-105 hover:shadow-lg'
                }`}
                style={{
                  backgroundColor: selectedCategoryId === category.id 
                    ? category.color 
                    : `${category.color}15`,
                  color: selectedCategoryId === category.id ? '#ffffff' : category.color,
                  borderColor: selectedCategoryId === category.id 
                    ? `${category.color}80` 
                    : `${category.color}40`,
                  borderWidth: '2px',
                  borderStyle: 'solid',
                  boxShadow: selectedCategoryId === category.id 
                    ? `0 0 20px ${category.color}60` 
                    : undefined
                }}
                title={category.description}
              >
                <Folder className="w-4 h-4" />
                <span className="whitespace-nowrap">{category.name}</span>
              </button>
            ))}
            
            {/* Spacer for better scroll experience */}
            <div className="flex-shrink-0 w-4" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default CategoryFilter;