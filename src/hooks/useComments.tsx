import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface Comment {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  is_edited: boolean;
  user_id: string;
  video_id: string;
  parent_id?: string;
  profiles: {
    username: string;
    avatar_url?: string;
  };
  replies?: Comment[];
}

interface UseCommentsProps {
  videoId: string;
}

export const useComments = ({ videoId }: UseCommentsProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const loadComments = async () => {
    try {
      setIsLoading(true);
      
      // First get comments without profiles
      const { data: commentsData, error: commentsError } = await supabase
        .from('video_comments')
        .select('*')
        .eq('video_id', videoId)
        .is('parent_id', null)
        .order('created_at', { ascending: false });

      if (commentsError) throw commentsError;

      // Then get profiles for each comment
      const commentsWithProfiles = await Promise.all(
        (commentsData || []).map(async (comment) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', comment.user_id)
            .maybeSingle();

          return {
            ...comment,
            profiles: profile || { username: 'Unknown User', avatar_url: null }
          };
        })
      );

      // Load replies for each comment
      const commentsWithReplies = await Promise.all(
        commentsWithProfiles.map(async (comment) => {
          const { data: repliesData, error: repliesError } = await supabase
            .from('video_comments')
            .select('*')
            .eq('parent_id', comment.id)
            .order('created_at', { ascending: true });

          if (repliesError) {
            console.error('Error loading replies:', repliesError);
            return { ...comment, replies: [] };
          }

          // Get profiles for replies
          const repliesWithProfiles = await Promise.all(
            (repliesData || []).map(async (reply) => {
              const { data: profile } = await supabase
                .from('profiles')
                .select('username, avatar_url')
                .eq('id', reply.user_id)
                .maybeSingle();

              return {
                ...reply,
                profiles: profile || { username: 'Unknown User', avatar_url: null }
              };
            })
          );

          return { ...comment, replies: repliesWithProfiles };
        })
      );

      setComments(commentsWithReplies);
    } catch (error) {
      console.error('Error loading comments:', error);
      toast({
        title: "Error",
        description: "Gagal memuat komentar.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addComment = async (content: string, parentId?: string): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Login Diperlukan",
        description: "Silakan login untuk menambahkan komentar.",
        variant: "destructive",
      });
      return false;
    }

    if (!content.trim()) {
      toast({
        title: "Komentar Kosong",
        description: "Silakan tulis komentar Anda.",
        variant: "destructive",
      });
      return false;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('video_comments')
        .insert({
          video_id: videoId,
          user_id: user.id,
          content: content.trim(),
          parent_id: parentId || null
        });

      if (error) throw error;

      toast({
        title: "Komentar Ditambahkan",
        description: "Komentar Anda berhasil ditambahkan.",
      });

      await loadComments();
      return true;
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Gagal menambahkan komentar.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const editComment = async (commentId: string, newContent: string): Promise<boolean> => {
    if (!user) return false;

    if (!newContent.trim()) {
      toast({
        title: "Komentar Kosong",
        description: "Komentar tidak boleh kosong.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('video_comments')
        .update({
          content: newContent.trim(),
          updated_at: new Date().toISOString(),
          is_edited: true
        })
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Komentar Diperbarui",
        description: "Komentar berhasil diperbarui.",
      });

      await loadComments();
      return true;
    } catch (error) {
      console.error('Error editing comment:', error);
      toast({
        title: "Error",
        description: "Gagal memperbarui komentar.",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteComment = async (commentId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('video_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Komentar Dihapus",
        description: "Komentar berhasil dihapus.",
      });

      await loadComments();
      return true;
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus komentar.",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    if (videoId) {
      loadComments();
    }
  }, [videoId]);

  return {
    comments,
    isLoading,
    isSubmitting,
    addComment,
    editComment,
    deleteComment,
    loadComments
  };
};