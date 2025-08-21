import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export const useContactMessages = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_messages' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching contact messages:', error);
        toast({
          title: "Error",
          description: "Gagal memuat pesan kontak",
          variant: "destructive",
        });
        return;
      }

      const messages = (data as unknown) as ContactMessage[];
      setMessages(messages);
      setUnreadCount(messages.filter(msg => !msg.is_read).length);
    } catch (error) {
      console.error('Error fetching contact messages:', error);
      toast({
        title: "Error",
        description: "Gagal memuat pesan kontak",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('contact_messages' as any)
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('id', messageId);

      if (error) {
        console.error('Error marking message as read:', error);
        toast({
          title: "Error",
          description: "Gagal menandai pesan sebagai sudah dibaca",
          variant: "destructive",
        });
        return;
      }

      // Update local state
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, is_read: true, updated_at: new Date().toISOString() }
            : msg
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      toast({
        title: "Berhasil",
        description: "Pesan telah ditandai sebagai sudah dibaca",
      });
    } catch (error) {
      console.error('Error marking message as read:', error);
      toast({
        title: "Error",
        description: "Gagal menandai pesan sebagai sudah dibaca",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchMessages();

    // Set up real-time subscription for new messages
    const channel = supabase
      .channel('contact_messages_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'contact_messages'
        },
        (payload) => {
          console.log('New contact message received:', payload);
          const newMessage = payload.new as ContactMessage;
          setMessages(prev => [newMessage, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          toast({
            title: "Pesan Baru",
            description: `Pesan baru dari ${newMessage.name}`,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'contact_messages'
        },
        (payload) => {
          console.log('Contact message updated:', payload);
          const updatedMessage = payload.new as ContactMessage;
          setMessages(prev => 
            prev.map(msg => 
              msg.id === updatedMessage.id ? updatedMessage : msg
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  return {
    messages,
    unreadCount,
    isLoading,
    markAsRead,
    refetch: fetchMessages,
  };
};