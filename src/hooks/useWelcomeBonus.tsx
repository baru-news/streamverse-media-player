import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useWelcomeBonus = () => {
  const { user } = useAuth();
  const [isEligible, setIsEligible] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // Check eligibility when user changes
  useEffect(() => {
    if (user) {
      checkEligibility();
    } else {
      setIsEligible(false);
      setShowDialog(false);
      setChecking(false);
    }
  }, [user]);

  const checkEligibility = async () => {
    if (!user) return;

    try {
      setChecking(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('profile_complete, welcome_bonus_claimed')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      const eligible = data.profile_complete && !data.welcome_bonus_claimed;
      setIsEligible(eligible);
      
      // Auto show dialog if eligible
      if (eligible) {
        setShowDialog(true);
      }
    } catch (error) {
      console.error('Error checking welcome bonus eligibility:', error);
      setIsEligible(false);
    } finally {
      setChecking(false);
    }
  };

  const claimBonus = async () => {
    if (!user || !isEligible) return false;

    try {
      setLoading(true);
      
      const { data, error } = await supabase.rpc('award_welcome_bonus', {
        user_id_param: user.id
      });

      if (error) throw error;

      // Parse the returned JSON data
      const result = data as { success: boolean; error?: string; message?: string };

      if (result?.success) {
        toast.success('🎉 Welcome bonus berhasil diklaim!', {
          description: 'Newbie Badge dan 5 Kitty Keys telah ditambahkan ke akun kamu!'
        });
        
        setIsEligible(false);
        setShowDialog(false);
        return true;
      } else {
        toast.error('Gagal mengklaim bonus', {
          description: result?.error || 'Terjadi kesalahan saat mengklaim bonus'
        });
        return false;
      }
    } catch (error) {
      console.error('Error claiming welcome bonus:', error);
      toast.error('Terjadi kesalahan saat mengklaim bonus');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const showWelcomeDialog = () => {
    if (isEligible) {
      setShowDialog(true);
    }
  };

  const hideDialog = () => {
    setShowDialog(false);
  };

  return {
    isEligible,
    showDialog,
    checking,
    loading,
    claimBonus,
    showWelcomeDialog,
    hideDialog,
    checkEligibility
  };
};