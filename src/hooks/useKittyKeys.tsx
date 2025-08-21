import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface UserKittyKeys {
  id: string;
  user_id: string;
  balance: number;
  total_earned: number;
  total_spent: number;
}

export const useKittyKeys = () => {
  const { user } = useAuth();
  const [kittyKeys, setKittyKeys] = useState<UserKittyKeys | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchKittyKeys();
      
      // Subscribe to changes
      const channel = supabase
        .channel('kitty_keys_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_kitty_keys',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            fetchKittyKeys();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchKittyKeys = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_kitty_keys')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // Initialize kitty keys record if it doesn't exist
        const { data: newData, error: insertError } = await supabase
          .from('user_kitty_keys')
          .insert({
            user_id: user.id,
            balance: 0,
            total_earned: 0,
            total_spent: 0
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setKittyKeys(newData);
      } else {
        setKittyKeys(data);
      }
    } catch (error) {
      console.error('Error fetching kitty keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const canClaimKittyKey = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.rpc('can_user_claim_kitty_key_today', {
        user_id_param: user.id
      });

      if (error) throw error;
      return data || false;
    } catch (error) {
      console.error('Error checking kitty key claim eligibility:', error);
      return false;
    }
  };

  const claimKittyKey = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.rpc('claim_kitty_key', {
        user_id_param: user.id
      });

      if (error) throw error;

      if (data) {
        toast.success('🗝️ Kitty Key diklaim! Sekarang kamu bisa memutar roda beruntung! 🎀');
        await fetchKittyKeys();
        return true;
      } else {
        toast.error('Gagal mengklaim Kitty Key. Pastikan semua tugas telah selesai!');
        return false;
      }
    } catch (error) {
      console.error('Error claiming kitty key:', error);
      toast.error('Terjadi kesalahan saat mengklaim Kitty Key');
      return false;
    }
  };

  const spendKittyKey = async (amount: number = 1): Promise<boolean> => {
    if (!user || !kittyKeys) return false;

    if (kittyKeys.balance < amount) {
      toast.error('Kitty Key tidak cukup!');
      return false;
    }

    try {
      const { error } = await supabase
        .from('user_kitty_keys')
        .update({
          balance: kittyKeys.balance - amount,
          total_spent: kittyKeys.total_spent + amount
        })
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchKittyKeys();
      return true;
    } catch (error) {
      console.error('Error spending kitty key:', error);
      toast.error('Gagal menggunakan Kitty Key');
      return false;
    }
  };

  return {
    kittyKeys,
    loading,
    canClaimKittyKey,
    claimKittyKey,
    spendKittyKey,
    refreshKittyKeys: fetchKittyKeys
  };
};