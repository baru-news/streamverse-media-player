import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCoins } from '@/hooks/useCoins';
import { useKittyKeys } from '@/hooks/useKittyKeys';
import { toast } from 'sonner';

interface SpinWheelReward {
  id: string;
  name: string;
  coin_amount: number;
  rarity: string;
  probability: number;
  color: string;
  sort_order: number;
}

interface SpinAttempt {
  id: string;
  reward_id: string;
  coins_won: number;
  spin_date: string;
  created_at: string;
}

export const useSpinWheel = () => {
  const { user } = useAuth();
  const { refreshCoins } = useCoins();
  const { spendKittyKey } = useKittyKeys();
  const [rewards, setRewards] = useState<SpinWheelReward[]>([]);
  const [canSpin, setCanSpin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [todayAttempts, setTodayAttempts] = useState<SpinAttempt[]>([]);

  // Fetch available rewards
  const fetchRewards = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('spin_wheel_rewards')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setRewards(data || []);
    } catch (error) {
      console.error('Error fetching rewards:', error);
    }
  }, []);

  // Check if user can spin today
  const checkCanSpin = useCallback(async () => {
    if (!user) {
      setCanSpin(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('can_user_spin_today', {
        user_id_param: user.id
      });

      if (error) throw error;
      setCanSpin(data || false);
    } catch (error) {
      console.error('Error checking spin eligibility:', error);
      setCanSpin(false);
    }
  }, [user]);

  // Fetch today's spin attempts
  const fetchTodayAttempts = useCallback(async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('user_spin_attempts')
        .select('*')
        .eq('user_id', user.id)
        .eq('spin_date', today)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTodayAttempts(data || []);
    } catch (error) {
      console.error('Error fetching today attempts:', error);
    }
  }, [user]);

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      await Promise.all([
        fetchRewards(),
        checkCanSpin(),
        fetchTodayAttempts()
      ]);
      setLoading(false);
    };

    if (user) {
      initializeData();
    } else {
      setLoading(false);
    }
  }, [user, fetchRewards, checkCanSpin, fetchTodayAttempts]);

  // Perform spin
  const performSpin = useCallback(async (): Promise<SpinWheelReward | null> => {
    if (!user || !canSpin || spinning) return null;

    setSpinning(true);

    try {
      // Select random reward based on probability
      const totalProbability = rewards.reduce((sum, reward) => sum + reward.probability, 0);
      const random = Math.random() * totalProbability;
      
      let currentSum = 0;
      let selectedReward: SpinWheelReward | null = null;
      
      for (const reward of rewards) {
        currentSum += reward.probability;
        if (random <= currentSum) {
          selectedReward = reward;
          break;
        }
      }

      if (!selectedReward) {
        selectedReward = rewards[0]; // Fallback to first reward
      }

      // Record the spin attempt
      const { error: insertError } = await supabase
        .from('user_spin_attempts')
        .insert({
          user_id: user.id,
          reward_id: selectedReward.id,
          coins_won: selectedReward.coin_amount
        });

      if (insertError) throw insertError;

      // Spend kitty key
      const keySpent = await spendKittyKey(1);
      if (!keySpent) {
        throw new Error('Failed to spend kitty key');
      }

      // Update user coins
      const { error: coinsError } = await supabase
        .from('user_coins')
        .upsert({
          user_id: user.id,
          balance: 0, // Will be updated by the database
          total_earned: 0 // Will be updated by the database
        })
        .select()
        .single();

      if (coinsError) {
        // If user doesn't have coins record, create one
        const { error: createError } = await supabase
          .from('user_coins')
          .insert({
            user_id: user.id,
            balance: selectedReward.coin_amount,
            total_earned: selectedReward.coin_amount
          });

        if (createError) throw createError;
      } else {
        // Update existing record manually
        const { data: currentCoins } = await supabase
          .from('user_coins')
          .select('balance, total_earned')
          .eq('user_id', user.id)
          .single();

        if (currentCoins) {
          await supabase
            .from('user_coins')
            .update({
              balance: currentCoins.balance + selectedReward.coin_amount,
              total_earned: currentCoins.total_earned + selectedReward.coin_amount
            })
            .eq('user_id', user.id);
        }
      }

      // Refresh data
      await Promise.all([
        checkCanSpin(),
        fetchTodayAttempts(),
        refreshCoins()
      ]);

      // Show success message with Hello Kitty theme
      toast.success(`🎀 ${selectedReward.name}! +${selectedReward.coin_amount} coins! 💕`, {
        duration: 4000,
      });

      return selectedReward;
    } catch (error) {
      console.error('Error performing spin:', error);
      toast.error('Failed to spin the wheel. Please try again! 😿');
      return null;
    } finally {
      setSpinning(false);
    }
  }, [user, canSpin, spinning, rewards, checkCanSpin, fetchTodayAttempts, refreshCoins]);

  // Refresh all data
  const refreshData = useCallback(async () => {
    await Promise.all([
      fetchRewards(),
      checkCanSpin(),
      fetchTodayAttempts()
    ]);
  }, [fetchRewards, checkCanSpin, fetchTodayAttempts]);

  return {
    rewards,
    canSpin,
    loading,
    spinning,
    todayAttempts,
    performSpin,
    refreshData
  };
};