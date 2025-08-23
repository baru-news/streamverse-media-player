import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

interface PremiumRequest {
  id: string;
  user_id: string;
  trakteer_transaction_id?: string;
  payment_proof_url?: string;
  telegram_username?: string;
  amount: number;
  subscription_type: string;
  status: string;
  admin_notes?: string;
  admin_user_id?: string;
  created_at: string;
  updated_at: string;
  processed_at?: string;
}

export const usePremiumRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<PremiumRequest[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserRequests();
    }
  }, [user]);

  const fetchUserRequests = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('premium_subscription_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching premium requests:', error);
      toast({
        title: "Error",
        description: "Failed to fetch premium requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const submitRequest = async (requestData: {
    trakteer_transaction_id?: string;
    payment_proof_url?: string;
    telegram_username?: string;
    amount: number;
    subscription_type?: string;
  }) => {
    if (!user) return { error: 'User not authenticated' };

    // Validate that user has linked Telegram account
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('telegram_user_id, telegram_username')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return { error: 'Failed to verify user profile' };
      }

      if (!profile?.telegram_user_id || !profile?.telegram_username) {
        return { error: 'You must link your Telegram account before submitting a premium request' };
      }

      // Use the verified Telegram username from profile
      const { data, error } = await supabase
        .from('premium_subscription_requests')
        .insert({
          user_id: user.id,
          trakteer_transaction_id: requestData.trakteer_transaction_id,
          payment_proof_url: requestData.payment_proof_url,
          telegram_username: profile.telegram_username,
          amount: requestData.amount,
          subscription_type: requestData.subscription_type || 'lifetime',
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: `Premium request submitted successfully! We'll review it within 24 hours and invite @${profile.telegram_username} to the premium channel upon approval.`,
      });

      await fetchUserRequests();
      return { data };
    } catch (error) {
      console.error('Error submitting premium request:', error);
      const errorMessage = error?.message || "Failed to submit premium request";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return { error: errorMessage };
    }
  };

  const updateRequest = async (requestId: string, updates: {
    trakteer_transaction_id?: string;
    payment_proof_url?: string;
    amount?: number;
  }) => {
    try {
      const { error } = await supabase
        .from('premium_subscription_requests')
        .update(updates)
        .eq('id', requestId)
        .eq('status', 'pending');

      if (error) throw error;

      toast({
        title: "Success",
        description: "Premium request updated successfully",
      });

      await fetchUserRequests();
    } catch (error) {
      console.error('Error updating premium request:', error);
      toast({
        title: "Error",
        description: "Failed to update premium request",
        variant: "destructive",
      });
    }
  };

  return {
    requests,
    loading,
    submitRequest,
    updateRequest,
    refreshRequests: fetchUserRequests,
  };
};