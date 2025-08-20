import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export const useFavorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch user's favorites
  const fetchFavorites = async () => {
    if (!user) {
      setFavorites([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('video_favorites')
        .select('video_id')
        .eq('user_id', user.id);

      if (error) throw error;
      
      setFavorites(data.map(fav => fav.video_id));
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  // Add video to favorites
  const addToFavorites = async (videoId: string) => {
    if (!user) {
      toast.error('Silakan login untuk menambah favorit');
      return false;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('video_favorites')
        .insert({ 
          user_id: user.id, 
          video_id: videoId 
        });

      if (error) throw error;

      setFavorites(prev => [...prev, videoId]);
      toast.success('Video ditambahkan ke favorit');
      return true;
    } catch (error) {
      console.error('Error adding to favorites:', error);
      toast.error('Gagal menambahkan ke favorit');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Remove video from favorites
  const removeFromFavorites = async (videoId: string) => {
    if (!user) return false;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('video_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('video_id', videoId);

      if (error) throw error;

      setFavorites(prev => prev.filter(id => id !== videoId));
      toast.success('Video dihapus dari favorit');
      return true;
    } catch (error) {
      console.error('Error removing from favorites:', error);
      toast.error('Gagal menghapus dari favorit');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Toggle favorite status
  const toggleFavorite = async (videoId: string) => {
    if (favorites.includes(videoId)) {
      return await removeFromFavorites(videoId);
    } else {
      return await addToFavorites(videoId);
    }
  };

  // Check if video is favorite
  const isFavorite = (videoId: string) => favorites.includes(videoId);

  // Get favorite videos with details
  const getFavoriteVideos = async () => {
    if (!user || favorites.length === 0) return [];

    try {
      const { data, error } = await supabase
        .from('videos')
        .select(`
          *,
          video_hashtags (
            hashtags (*)
          )
        `)
        .in('id', favorites)
        .eq('status', 'ready')
        .order('upload_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching favorite videos:', error);
      return [];
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, [user]);

  return {
    favorites,
    loading,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    isFavorite,
    getFavoriteVideos,
    refetchFavorites: fetchFavorites
  };
};