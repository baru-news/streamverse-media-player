import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface PremiumStreamingSubscription {
  id: string;
  user_id: string;
  subscription_type: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  grace_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export const usePremiumStreaming = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<PremiumStreamingSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPremiumStreaming, setIsPremiumStreaming] = useState(false);
  const [isInGracePeriod, setIsInGracePeriod] = useState(false);

  useEffect(() => {
    if (user) {
      fetchStreamingSubscription();
      
      // Subscribe to real-time updates
      const channel = supabase
        .channel('streaming_subscription_changes')
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
              const newSub = payload.new as PremiumStreamingSubscription;
              if (isStreamingSubscription(newSub.subscription_type)) {
                setSubscription(newSub);
                updateStreamingStatus(newSub);
              }
            } else if (payload.eventType === 'DELETE') {
              const deletedSub = payload.old as PremiumStreamingSubscription;
              if (isStreamingSubscription(deletedSub.subscription_type)) {
                setSubscription(null);
                setIsPremiumStreaming(false);
                setIsInGracePeriod(false);
              }
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setSubscription(null);
      setIsPremiumStreaming(false);
      setIsInGracePeriod(false);
      setLoading(false);
    }
  }, [user]);

  const isStreamingSubscription = (subscriptionType: string) => {
    return subscriptionType.startsWith('streaming_');
  };

  const fetchStreamingSubscription = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('premium_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .like('subscription_type', 'streaming_%')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching streaming subscription:', error);
        return;
      }

      setSubscription(data);
      if (data) {
        updateStreamingStatus(data);
      } else {
        setIsPremiumStreaming(false);
        setIsInGracePeriod(false);
      }
    } catch (error) {
      console.error('Error fetching streaming subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStreamingStatus = (sub: PremiumStreamingSubscription) => {
    const now = new Date();
    const endDate = sub.end_date ? new Date(sub.end_date) : null;
    const gracePeriodEnd = sub.grace_period_end ? new Date(sub.grace_period_end) : null;

    if (sub.is_active && (!endDate || endDate > now)) {
      // Active subscription
      setIsPremiumStreaming(true);
      setIsInGracePeriod(false);
    } else if (gracePeriodEnd && gracePeriodEnd > now) {
      // In grace period
      setIsPremiumStreaming(true);
      setIsInGracePeriod(true);
    } else {
      // Expired
      setIsPremiumStreaming(false);
      setIsInGracePeriod(false);
    }
  };

  const checkStreamingStatus = async (userId?: string) => {
    if (!userId && !user) return false;

    try {
      const { data, error } = await supabase
        .from('premium_subscriptions')
        .select('*')
        .eq('user_id', userId || user!.id)
        .like('subscription_type', 'streaming_%')
        .maybeSingle();

      if (error) throw error;
      
      if (!data) return false;

      const now = new Date();
      const endDate = data.end_date ? new Date(data.end_date) : null;
      const gracePeriodEnd = data.grace_period_end ? new Date(data.grace_period_end) : null;

      if (data.is_active && (!endDate || endDate > now)) {
        return true;
      } else if (gracePeriodEnd && gracePeriodEnd > now) {
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking streaming status:', error);
      return false;
    }
  };

  const getSubscriptionDetails = () => {
    if (!subscription) return null;

    const subscriptionTypes = {
      'streaming_1month': { name: '1 Bulan', price: 15000 },
      'streaming_3month': { name: '3 Bulan', price: 40000 },
      'streaming_6month': { name: '6 Bulan', price: 75000 },
      'streaming_1year': { name: '1 Tahun', price: 140000 }
    };

    return subscriptionTypes[subscription.subscription_type as keyof typeof subscriptionTypes] || null;
  };

  return {
    subscription,
    loading,
    isPremiumStreaming,
    isInGracePeriod,
    checkStreamingStatus,
    refreshSubscription: fetchStreamingSubscription,
    subscriptionDetails: getSubscriptionDetails()
  };
};