import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useVideoStatus = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const hideVideo = async (videoId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('videos')
        .update({ status: 'hidden' })
        .eq('id', videoId);

      if (error) throw error;

      toast({
        title: "Video disembunyikan",
        description: "Video berhasil disembunyikan dari publikasi.",
      });

      return true;
    } catch (error) {
      console.error('Failed to hide video:', error);
      toast({
        title: "Error",
        description: "Gagal menyembunyikan video.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const showVideo = async (videoId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('videos')
        .update({ status: 'active' })
        .eq('id', videoId);

      if (error) throw error;

      toast({
        title: "Video dipublikasikan",
        description: "Video berhasil dipublikasikan kembali.",
      });

      return true;
    } catch (error) {
      console.error('Failed to show video:', error);
      toast({
        title: "Error",
        description: "Gagal mempublikasikan video.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVideoStatus = async (videoId: string, currentStatus: string): Promise<boolean> => {
    if (currentStatus === 'active') {
      return await hideVideo(videoId);
    } else {
      return await showVideo(videoId);
    }
  };

  const bulkHideVideos = async (videoIds: string[]): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('videos')
        .update({ status: 'hidden' })
        .in('id', videoIds);

      if (error) throw error;

      toast({
        title: "Video disembunyikan",
        description: `${videoIds.length} video berhasil disembunyikan.`,
      });

      return true;
    } catch (error) {
      console.error('Failed to bulk hide videos:', error);
      toast({
        title: "Error",
        description: "Gagal menyembunyikan video secara massal.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const bulkShowVideos = async (videoIds: string[]): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('videos')
        .update({ status: 'active' })
        .in('id', videoIds);

      if (error) throw error;

      toast({
        title: "Video dipublikasikan",
        description: `${videoIds.length} video berhasil dipublikasikan.`,
      });

      return true;
    } catch (error) {
      console.error('Failed to bulk show videos:', error);
      toast({
        title: "Error", 
        description: "Gagal mempublikasikan video secara massal.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    hideVideo,
    showVideo,
    toggleVideoStatus,
    bulkHideVideos,
    bulkShowVideos,
    isLoading
  };
};