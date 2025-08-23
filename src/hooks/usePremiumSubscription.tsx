import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface PremiumSubscription {
  id: string;
  user_id: string;
  subscription_type: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  telegram_username: string | null;
  telegram_user_id: number | null;
  created_at: string;
  updated_at: string;
}

export const usePremiumSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<PremiumSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSubscription();
      
      // Subscribe to real-time updates
      const channel = supabase
        .channel('premium_subscription_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'premium_subscriptions',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
              const newSub = payload.new as PremiumSubscription;
              setSubscription(newSub);
              setIsPremium(newSub.is_active && (!newSub.end_date || new Date(newSub.end_date) > new Date()));
            } else if (payload.eventType === 'DELETE') {
              setSubscription(null);
              setIsPremium(false);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setSubscription(null);
      setIsPremium(false);
      setLoading(false);
    }
  }, [user]);

  const fetchSubscription = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('premium_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching subscription:', error);
        return;
      }

      setSubscription(data);
      if (data) {
        const isActive = data.is_active && (!data.end_date || new Date(data.end_date) > new Date());
        setIsPremium(isActive);
      } else {
        setIsPremium(false);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkPremiumStatus = async (userId?: string) => {
    if (!userId && !user) return false;

    try {
      const { data, error } = await supabase
        .rpc('check_user_premium_status', {
          user_id_param: userId || user!.id
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error checking premium status:', error);
      return false;
    }
  };

  const createSubscription = async (subscriptionData: {
    subscription_type: string;
    telegram_username?: string;
    payment_info?: Record<string, any>;
  }) => {
    if (!user) {
      toast.error('Must be logged in to subscribe');
      return false;
    }

    try {
      const { data, error } = await supabase
        .from('premium_subscriptions')
        .insert({
          user_id: user.id,
          ...subscriptionData
        })
        .select()
        .single();

      if (error) throw error;
      
      setSubscription(data);
      setIsPremium(true);
      toast.success('Premium subscription activated!');
      return true;
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast.error('Failed to create subscription');
      return false;
    }
  };

  return {
    subscription,
    loading,
    isPremium,
    checkPremiumStatus,
    createSubscription,
    refreshSubscription: fetchSubscription
  };
};