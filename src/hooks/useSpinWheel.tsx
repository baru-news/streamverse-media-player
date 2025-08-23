import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCoins } from '@/hooks/useCoins';
import { useKittyKeys } from '@/hooks/useKittyKeys';
import { toast } from 'sonner';
import { selectRewardByProbability, calculateSpinTarget } from '@/lib/spin-wheel-utils';

interface SpinWheelReward {
  id: string;
  name: string;
  coin_amount: number;
  rarity: string;
  probability: number;
  color: string;
  sort_order: number;
}

export const useSpinWheel = () => {
  const { user } = useAuth();
  const { refreshCoins } = useCoins();
  const { spendKittyKey, kittyKeys, refreshKittyKeys } = useKittyKeys();
  const [rewards, setRewards] = useState<SpinWheelReward[]>([]);
  const [canSpin, setCanSpin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);

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

  // Check if user can spin (has kitty keys) - now using local state for consistency
  const checkCanSpin = useCallback(async () => {
    if (!user) {
      console.log('No user found');
      setCanSpin(false);
      return;
    }

    // Ensure we have fresh kitty keys data
    await refreshKittyKeys();
    
    // Use local state for consistency with spendKittyKey function
    const balance = kittyKeys?.balance || 0;
    console.log('Kitty keys balance from local state:', balance);
    console.log('Can spin:', balance > 0);
    
    setCanSpin(balance > 0);
  }, [user, kittyKeys, refreshKittyKeys]);

  // Initialize data and sync with kitty keys changes
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      await fetchRewards();
      if (user) {
        await checkCanSpin();
      }
      setLoading(false);
    };

    if (user) {
      initializeData();
    } else {
      setLoading(false);
    }
  }, [user]); // Remove fetchRewards and checkCanSpin dependencies to avoid circular deps
  
  // Update canSpin when kittyKeys changes
  useEffect(() => {
    if (kittyKeys !== null) {
      const balance = kittyKeys.balance || 0;
      console.log('Kitty keys state updated, new balance:', balance);
      setCanSpin(balance > 0);
    }
  }, [kittyKeys]);

  // SIMPLE DETERMINISTIC reward selection
  const selectReward = useCallback((): { finalAngle: number; rewardData: { reward: SpinWheelReward; targetIndex: number } } | null => {
    if (!rewards.length) return null;
    return calculateSpinTarget(rewards, 0); // Start from 0 for simplicity
  }, [rewards]);

  // SIMPLE DETERMINISTIC spin system
  const performSpin = useCallback(async (preSelectedData?: { finalAngle: number; rewardData: { reward: SpinWheelReward; targetIndex: number } }): Promise<SpinWheelReward | null> => {
    if (!user || !canSpin || spinning) {
      console.log('Cannot spin:', { user: !!user, canSpin, spinning });
      return null;
    }

    // Use pre-calculated spin data or generate new one
    const spinData = preSelectedData || selectReward();
    if (!spinData) {
      throw new Error('No spin data generated');
    }

    const { finalAngle, rewardData } = spinData;
    const selectedReward = rewardData.reward;

    // Double-check kitty keys before spinning
    if (!kittyKeys || kittyKeys.balance < 1) {
      console.log('Insufficient kitty keys at spin time:', kittyKeys?.balance);
      toast.error('Kitty Key tidak cukup! 🗝️');
      await checkCanSpin();
      return null;
    }

    console.log('🎯 STARTING DETERMINISTIC SPIN:', {
      selectedReward: selectedReward.name,
      finalAngle,
      targetIndex: rewardData.targetIndex,
      kittyBalance: kittyKeys.balance
    });
    setSpinning(true);

    try {
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
      console.log('Spending kitty key. Current balance:', kittyKeys.balance);
      const keySpent = await spendKittyKey(1);
      if (!keySpent) {
        console.log('Failed to spend kitty key');
        throw new Error('Failed to spend kitty key');
      }

      // Update user coins
      const { data: existingCoins } = await supabase
        .from('user_coins')
        .select('balance, total_earned')
        .eq('user_id', user.id)
        .single();

      if (existingCoins) {
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
      await refreshKittyKeys();
      await refreshCoins();
      await checkCanSpin();

      // Success message
      toast.success(`🎀 ${selectedReward.name}! +${selectedReward.coin_amount} coins! 💕`, {
        duration: 4000,
      });

      return selectedReward;
    } catch (error) {
      console.error('Error performing spin:', error);
      
      if (error.message === 'Failed to spend kitty key') {
        toast.error('Kitty Key tidak cukup atau gagal digunakan! 🗝️');
      } else {
        toast.error('Spin tidak berhasil. Silakan coba lagi! 😿');
      }
      
      await refreshKittyKeys();
      await checkCanSpin();
      
      return null;
    } finally {
      setSpinning(false);
    }
  }, [user, canSpin, spinning, rewards, kittyKeys, selectReward, spendKittyKey, refreshCoins, refreshKittyKeys]);

  // Refresh all data
  const refreshData = useCallback(async () => {
    await fetchRewards();
    if (user) {
      await checkCanSpin();
    }
  }, [user]); // Simplified dependencies

  return {
    rewards,
    canSpin,
    loading,
    spinning,
    performSpin,
    selectReward,
    refreshData
  };
};