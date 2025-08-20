import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Hash } from 'lucide-react';
interface Hashtag {
  id: string;
  name: string;
  color: string;
  description: string;
}
interface HashtagFilterProps {
  selectedHashtagId: string | null;
  onHashtagChange: (hashtagId: string | null) => void;
}
const HashtagFilter = ({
  selectedHashtagId,
  onHashtagChange
}: HashtagFilterProps) => {
  const [hashtags, setHashtags] = useState<Hashtag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    loadHashtags();
  }, []);
  const loadHashtags = async () => {
    try {
      setIsLoading(true);
      const {
        data,
        error
      } = await supabase.from('hashtags').select('*').eq('is_active', true).order('name');
      if (error) throw error;
      setHashtags(data || []);
    } catch (error) {
      console.error('Error loading hashtags:', error);
    } finally {
      setIsLoading(false);
    }
  };
  if (isLoading) {
    return <section className="py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-4">
            <Hash className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Tagar</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-8 w-20 bg-muted animate-pulse rounded-full" />)}
          </div>
        </div>
      </section>;
  }
  return <section className="py-[2px]">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 mb-4">
          <Hash className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Tagar</h3>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {/* All Videos Button */}
          <button onClick={() => onHashtagChange(null)} className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${selectedHashtagId === null ? 'bg-primary text-primary-foreground shadow-glow' : 'bg-secondary/50 text-secondary-foreground hover:bg-secondary/70'}`}>
            Semua Video
          </button>

          {/* Hashtag Buttons */}
          {hashtags.map(hashtag => <button key={hashtag.id} onClick={() => onHashtagChange(hashtag.id)} className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1 ${selectedHashtagId === hashtag.id ? 'shadow-glow' : 'hover:scale-105'}`} style={{
          backgroundColor: selectedHashtagId === hashtag.id ? hashtag.color : `${hashtag.color}20`,
          color: selectedHashtagId === hashtag.id ? '#ffffff' : hashtag.color,
          borderColor: hashtag.color,
          borderWidth: '1px',
          borderStyle: 'solid'
        }} title={hashtag.description}>
              #{hashtag.name}
            </button>)}
        </div>
      </div>
    </section>;
};
export default HashtagFilter;