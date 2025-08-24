import { useState, useEffect, useCallback } from 'react';
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
  grace_period_end: string | null;
  plan_price: number | null;
  created_at: string;
  updated_at: string;
}

interface PremiumStatus {
  telegram: {
    subscription: PremiumSubscription | null;
    isActive: boolean;
    loading: boolean;
  };
  streaming: {
    subscription: PremiumSubscription | null;
    isActive: boolean;
    isInGracePeriod: boolean;
    loading: boolean;
  };
  overall: {
    hasAnyPremium: boolean;
    loading: boolean;
  };
}

export const usePremium = () => {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<PremiumSubscription[]>([]);
  const [status, setStatus] = useState<PremiumStatus>({
    telegram: { subscription: null, isActive: false, loading: true },
    streaming: { subscription: null, isActive: false, isInGracePeriod: false, loading: true },
    overall: { hasAnyPremium: false, loading: true }
  });
  const [error, setError] = useState<string | null>(null);

  const isStreamingSubscription = useCallback((subscriptionType: string) => {
    return subscriptionType.startsWith('streaming_');
  }, []);

  const isTelegramSubscription = useCallback((subscriptionType: string) => {
    return subscriptionType === 'lifetime' || subscriptionType.includes('telegram');
  }, []);

  const updateStatus = useCallback((subs: PremiumSubscription[]) => {
    const now = new Date();
    
    const telegramSub = subs.find(sub => isTelegramSubscription(sub.subscription_type));
    const streamingSub = subs.find(sub => isStreamingSubscription(sub.subscription_type));

    // Telegram status
    const telegramActive = telegramSub?.is_active && 
      (!telegramSub.end_date || new Date(telegramSub.end_date) > now);

    // Streaming status
    let streamingActive = false;
    let inGracePeriod = false;
    
    if (streamingSub) {
      const endDate = streamingSub.end_date ? new Date(streamingSub.end_date) : null;
      const gracePeriodEnd = streamingSub.grace_period_end ? new Date(streamingSub.grace_period_end) : null;

      if (streamingSub.is_active && (!endDate || endDate > now)) {
        streamingActive = true;
      } else if (gracePeriodEnd && gracePeriodEnd > now) {
        streamingActive = true;
        inGracePeriod = true;
      }
    }

    setStatus({
      telegram: {
        subscription: telegramSub || null,
        isActive: Boolean(telegramActive),
        loading: false
      },
      streaming: {
        subscription: streamingSub || null,
        isActive: streamingActive,
        isInGracePeriod: inGracePeriod,
        loading: false
      },
      overall: {
        hasAnyPremium: Boolean(telegramActive || streamingActive),
        loading: false
      }
    });
  }, [isTelegramSubscription, isStreamingSubscription]);

  const fetchSubscriptions = useCallback(async () => {
    if (!user) {
      setSubscriptions([]);
      setStatus({
        telegram: { subscription: null, isActive: false, loading: false },
        streaming: { subscription: null, isActive: false, isInGracePeriod: false, loading: false },
        overall: { hasAnyPremium: false, loading: false }
      });
      return;
    }

    try {
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('premium_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      const subs = data || [];
      setSubscriptions(subs);
      updateStatus(subs);
    } catch (err: any) {
      console.error('Error fetching subscriptions:', err);
      setError(err.message || 'Failed to load premium status');
      setStatus({
        telegram: { subscription: null, isActive: false, loading: false },
        streaming: { subscription: null, isActive: false, isInGracePeriod: false, loading: false },
        overall: { hasAnyPremium: false, loading: false }
      });
    }
  }, [user, updateStatus]);

  useEffect(() => {
    fetchSubscriptions();

    if (!user) return;

    // Subscribe to real-time updates with enhanced error handling
    const channel = supabase
      .channel('premium_subscriptions_consolidated')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'premium_subscriptions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          try {
            if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
              const newSub = payload.new as PremiumSubscription;
              setSubscriptions(prev => {
                const filtered = prev.filter(s => s.id !== newSub.id);
                const updated = [...filtered, newSub];
                updateStatus(updated);
                return updated;
              });
            } else if (payload.eventType === 'DELETE') {
              const deletedSub = payload.old as PremiumSubscription;
              setSubscriptions(prev => {
                const updated = prev.filter(s => s.id !== deletedSub.id);
                updateStatus(updated);
                return updated;
              });
            }
          } catch (err) {
            console.error('Error handling real-time update:', err);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchSubscriptions, updateStatus]);

  const checkPremiumStatus = useCallback(async (userId?: string, type?: 'telegram' | 'streaming') => {
    try {
      const targetUserId = userId || user?.id;
      if (!targetUserId) return false;

      const { data, error } = await supabase
        .rpc('check_user_premium_status', {
          user_id_param: targetUserId
        });

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error checking premium status:', err);
      return false;
    }
  }, [user]);

  const createSubscription = useCallback(async (subscriptionData: {
    subscription_type: string;
    telegram_username?: string;
    payment_info?: Record<string, any>;
    end_date?: string;
    plan_price?: number;
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
      
      toast.success('Premium subscription activated!');
      fetchSubscriptions(); // Refresh all subscriptions
      return true;
    } catch (err: any) {
      console.error('Error creating subscription:', err);
      toast.error(err.message || 'Failed to create subscription');
      return false;
    }
  }, [user, fetchSubscriptions]);

  const getSubscriptionDetails = useCallback((subscriptionType: string) => {
    const subscriptionTypes = {
      'lifetime': { name: 'Telegram Lifetime', price: 50000 },
      'streaming_1month': { name: '1 Bulan', price: 15000 },
      'streaming_3month': { name: '3 Bulan', price: 40000 },
      'streaming_6month': { name: '6 Bulan', price: 75000 },
      'streaming_1year': { name: '1 Tahun', price: 140000 }
    };

    return subscriptionTypes[subscriptionType as keyof typeof subscriptionTypes] || null;
  }, []);

  // Legacy compatibility methods
  const getLegacyTelegramHook = useCallback(() => ({
    subscription: status.telegram.subscription,
    loading: status.telegram.loading,
    isPremium: status.telegram.isActive,
    checkPremiumStatus,
    createSubscription,
    refreshSubscription: fetchSubscriptions
  }), [status.telegram, checkPremiumStatus, createSubscription, fetchSubscriptions]);

  const getLegacyStreamingHook = useCallback(() => ({
    subscription: status.streaming.subscription,
    loading: status.streaming.loading,
    isPremiumStreaming: status.streaming.isActive,
    isInGracePeriod: status.streaming.isInGracePeriod,
    checkStreamingStatus: (userId?: string) => checkPremiumStatus(userId, 'streaming'),
    refreshSubscription: fetchSubscriptions,
    subscriptionDetails: status.streaming.subscription ? getSubscriptionDetails(status.streaming.subscription.subscription_type) : null
  }), [status.streaming, checkPremiumStatus, fetchSubscriptions, getSubscriptionDetails]);

  return {
    // New consolidated interface
    status,
    subscriptions,
    error,
    loading: status.overall.loading,
    
    // Actions
    fetchSubscriptions,
    createSubscription,
    checkPremiumStatus,
    getSubscriptionDetails,
    
    // Legacy compatibility
    telegram: getLegacyTelegramHook(),
    streaming: getLegacyStreamingHook(),
    
    // Quick access properties
    isPremium: status.telegram.isActive,
    isPremiumStreaming: status.streaming.isActive,
    hasAnyPremium: status.overall.hasAnyPremium,
    isInGracePeriod: status.streaming.isInGracePeriod
  };
};