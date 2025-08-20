import { useState, useEffect } from "react";
import { Hash, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Hashtag {
  id: string;
  name: string;
  color: string;
  description?: string;
}

interface VideoHashtagSelectorProps {
  videoId: string;
  selectedHashtags?: string[];
  onHashtagsChange?: (hashtags: string[]) => void;
  className?: string;
}

const VideoHashtagSelector = ({ 
  videoId, 
  selectedHashtags = [], 
  onHashtagsChange,
  className = "" 
}: VideoHashtagSelectorProps) => {
  const [availableHashtags, setAvailableHashtags] = useState<Hashtag[]>([]);
  const [currentHashtags, setCurrentHashtags] = useState<string[]>(selectedHashtags);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const loadHashtags = async () => {
    try {
      // Load all available hashtags
      const { data: hashtags, error: hashtagsError } = await supabase
        .from('hashtags')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (hashtagsError) throw hashtagsError;

      // Load current video hashtags
      const { data: videoHashtags, error: videoHashtagsError } = await supabase
        .from('video_hashtags')
        .select('hashtag_id, hashtags!inner(id, name, color)')
        .eq('video_id', videoId);

      if (videoHashtagsError && videoHashtagsError.code !== 'PGRST116') {
        throw videoHashtagsError;
      }

      setAvailableHashtags(hashtags || []);
      const currentIds = videoHashtags?.map(vh => vh.hashtag_id) || [];
      setCurrentHashtags(currentIds);
      onHashtagsChange?.(currentIds);
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

  const handleHashtagToggle = async (hashtagId: string, isChecked: boolean) => {
    setIsSaving(true);
    try {
      if (isChecked) {
        // Add hashtag to video
        const { error } = await supabase
          .from('video_hashtags')
          .insert([{ video_id: videoId, hashtag_id: hashtagId }]);

        if (error && error.code !== '23505') { // Ignore duplicate errors
          throw error;
        }

        const newHashtags = [...currentHashtags, hashtagId];
        setCurrentHashtags(newHashtags);
        onHashtagsChange?.(newHashtags);
      } else {
        // Remove hashtag from video
        const { error } = await supabase
          .from('video_hashtags')
          .delete()
          .eq('video_id', videoId)
          .eq('hashtag_id', hashtagId);

        if (error) throw error;

        const newHashtags = currentHashtags.filter(id => id !== hashtagId);
        setCurrentHashtags(newHashtags);
        onHashtagsChange?.(newHashtags);
      }

      toast({
        title: "Berhasil",
        description: `Hashtag berhasil ${isChecked ? 'ditambahkan' : 'dihapus'}.`,
      });
    } catch (error) {
      console.error("Failed to update video hashtags:", error);
      toast({
        title: "Error",
        description: "Gagal mengubah hashtag video. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (videoId) {
      loadHashtags();
    }
  }, [videoId]);

  if (isLoading) {
    return (
      <div className={`space-y-3 ${className}`}>
        <Label className="text-foreground">Hashtag Video</Label>
        <div className="animate-pulse">
          <div className="h-4 bg-muted/50 rounded mb-2"></div>
          <div className="flex gap-2">
            <div className="h-6 bg-muted/50 rounded-full w-16"></div>
            <div className="h-6 bg-muted/50 rounded-full w-20"></div>
            <div className="h-6 bg-muted/50 rounded-full w-14"></div>
          </div>
        </div>
      </div>
    );
  }

  const selectedHashtagsData = availableHashtags.filter(h => currentHashtags.includes(h.id));

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <Label className="text-foreground flex items-center gap-2">
          <Hash className="w-4 h-4" />
          Hashtag Video
        </Label>
        {selectedHashtagsData.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {selectedHashtagsData.length} dipilih
          </span>
        )}
      </div>

      {/* Selected Hashtags Display */}
      {selectedHashtagsData.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-muted/10 rounded-lg">
          {selectedHashtagsData.map((hashtag) => (
            <Badge
              key={hashtag.id}
              style={{ 
                backgroundColor: hashtag.color + '20', 
                color: hashtag.color,
                borderColor: hashtag.color + '40'
              }}
              className="border font-medium"
            >
              #{hashtag.name}
            </Badge>
          ))}
        </div>
      )}

      {/* Hashtag Selection */}
      <Card className="bg-background/30 border-border/50">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {availableHashtags.map((hashtag) => {
              const isSelected = currentHashtags.includes(hashtag.id);
              return (
                <div
                  key={hashtag.id}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted/20 transition-colors"
                >
                  <Checkbox
                    id={`hashtag-${hashtag.id}`}
                    checked={isSelected}
                    disabled={isSaving}
                    onCheckedChange={(checked) => 
                      handleHashtagToggle(hashtag.id, checked as boolean)
                    }
                  />
                  <Label
                    htmlFor={`hashtag-${hashtag.id}`}
                    className="flex-1 cursor-pointer text-sm"
                  >
                    <Badge
                      variant="outline"
                      style={{ 
                        borderColor: hashtag.color + '60', 
                        color: isSelected ? hashtag.color : 'inherit'
                      }}
                      className="font-normal"
                    >
                      #{hashtag.name}
                    </Badge>
                  </Label>
                </div>
              );
            })}
          </div>

          {availableHashtags.length === 0 && (
            <div className="text-center py-6">
              <Hash className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">
                Belum ada hashtag tersedia. 
                <br />
                Buat hashtag baru di panel admin.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {isSaving && (
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
          Menyimpan perubahan...
        </div>
      )}
    </div>
  );
};

export default VideoHashtagSelector;