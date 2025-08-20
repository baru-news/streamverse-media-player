import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface UserCoins {
  id: string;
  user_id: string;
  balance: number;
  total_earned: number;
  total_spent: number;
}

export const useCoins = () => {
  const { user } = useAuth();
  const [coins, setCoins] = useState<UserCoins | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchCoins();
      
      // Handle daily login
      handleDailyLogin();
      
      // Subscribe to real-time updates
      const channel = supabase
        .channel('user_coins_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_coins',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
              setCoins(payload.new as UserCoins);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setCoins(null);
      setLoading(false);
    }
  }, [user]);

  const fetchCoins = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_coins')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // If no record exists, initialize with default values
        if (error.code === 'PGRST116') {
          const { data: newCoins, error: insertError } = await supabase
            .from('user_coins')
            .insert({
              user_id: user.id,
              balance: 0,
              total_earned: 0,
              total_spent: 0
            })
            .select()
            .single();

          if (insertError) throw insertError;
          setCoins(newCoins);
        } else {
          throw error;
        }
      } else {
        setCoins(data);
      }
    } catch (error) {
      console.error('Error fetching coins:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDailyLogin = async () => {
    if (!user) return;

    try {
      const { error } = await supabase.rpc('handle_daily_login', {
        user_id_param: user.id
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error handling daily login:', error);
    }
  };

  const spendCoins = async (amount: number) => {
    if (!user || !coins || coins.balance < amount) {
      toast.error('Insufficient coins!');
      return false;
    }

    try {
      const { error } = await supabase
        .from('user_coins')
        .update({
          balance: coins.balance - amount,
          total_spent: coins.total_spent + amount
        })
        .eq('user_id', user.id);

      if (error) throw error;
      
      toast.success(`Spent ${amount} coins!`);
      return true;
    } catch (error) {
      console.error('Error spending coins:', error);
      toast.error('Failed to spend coins');
      return false;
    }
  };

  return {
    coins,
    loading,
    spendCoins,
    refreshCoins: fetchCoins
  };
};