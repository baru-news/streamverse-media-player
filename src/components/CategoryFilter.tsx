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
      <section className="py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-4">
            <Folder className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Kategori</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 w-24 bg-muted animate-pulse rounded-full" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-6">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 mb-4">
          <Folder className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Kategori</h3>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {/* All Videos Button */}
          <button
            onClick={() => onCategoryChange(null)}
            className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 ${
              selectedCategoryId === null
                ? 'bg-primary text-primary-foreground shadow-glow scale-105'
                : 'bg-secondary/50 text-secondary-foreground hover:bg-secondary/70 hover:scale-105'
            }`}
          >
            Semua Video
          </button>

          {/* Category Buttons */}
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                selectedCategoryId === category.id
                  ? 'shadow-glow scale-105'
                  : 'hover:scale-105'
              }`}
              style={{
                backgroundColor: selectedCategoryId === category.id ? category.color : `${category.color}20`,
                color: selectedCategoryId === category.id ? '#ffffff' : category.color,
                borderColor: category.color,
                borderWidth: '2px',
                borderStyle: 'solid'
              }}
              title={category.description}
            >
              <Folder className="w-4 h-4" />
              {category.name}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryFilter;