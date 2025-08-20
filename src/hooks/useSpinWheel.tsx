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

  // Check if user can spin (has kitty keys)
  const checkCanSpin = useCallback(async () => {
    if (!user) {
      console.log('No user found');
      setCanSpin(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_kitty_keys')
        .select('balance')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      const balance = data?.balance || 0;
      console.log('Kitty keys balance:', balance);
      console.log('Can spin:', balance > 0);
      
      setCanSpin(balance > 0);
    } catch (error) {
      console.error('Error checking kitty keys balance:', error);
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
    if (!user || !canSpin || spinning) {
      console.log('Cannot spin:', { user: !!user, canSpin, spinning });
      return null;
    }

    console.log('Starting spin...');
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

      // Update user coins with safer approach
      const { data: existingCoins } = await supabase
        .from('user_coins')
        .select('balance, total_earned')
        .eq('user_id', user.id)
        .single();

      if (existingCoins) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('user_coins')
          .update({
            balance: existingCoins.balance + selectedReward.coin_amount,
            total_earned: existingCoins.total_earned + selectedReward.coin_amount,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        if (updateError) throw updateError;
      } else {
        // Create new record for new user
        const { error: insertError } = await supabase
          .from('user_coins')
          .insert({
            user_id: user.id,
            balance: selectedReward.coin_amount,
            total_earned: selectedReward.coin_amount
          });

        if (insertError) throw insertError;
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