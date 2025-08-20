import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCoins } from '@/hooks/useCoins';
import { toast } from 'sonner';

interface Badge {
  id: string;
  badge_key: string;
  name: string;
  description: string | null;
  price_coins: number;
  icon: string;
  rarity: string;
  color: string;
  is_active: boolean;
  sort_order: number;
}

interface UserBadge {
  id: string;
  user_id: string;
  badge_key: string;
  is_active: boolean;
  purchased_at: string;
}

interface BadgeWithOwnership extends Badge {
  owned: boolean;
  user_badge?: UserBadge;
}

export const useBadges = () => {
  const { user } = useAuth();
  const { spendCoins } = useCoins();
  const [badges, setBadges] = useState<BadgeWithOwnership[]>([]);
  const [activeBadge, setActiveBadge] = useState<BadgeWithOwnership | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchBadges();
    }
  }, [user]);

  const fetchBadges = async () => {
    if (!user) return;

    try {
      // Fetch all available badges
      const { data: allBadges, error: badgesError } = await supabase
        .from('badge_store')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (badgesError) throw badgesError;

      // Fetch user's owned badges
      const { data: userBadges, error: userBadgesError } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', user.id);

      if (userBadgesError) throw userBadgesError;

      // Combine badges with ownership info
      const badgesWithOwnership: BadgeWithOwnership[] = allBadges.map(badge => {
        const userBadge = userBadges?.find(ub => ub.badge_key === badge.badge_key);
        return {
          ...badge,
          owned: !!userBadge,
          user_badge: userBadge
        };
      });

      setBadges(badgesWithOwnership);

      // Set active badge
      const active = badgesWithOwnership.find(b => b.user_badge?.is_active);
      setActiveBadge(active || null);
    } catch (error) {
      console.error('Error fetching badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const purchaseBadge = async (badgeKey: string) => {
    if (!user) return false;

    const badge = badges.find(b => b.badge_key === badgeKey);
    if (!badge || badge.owned) return false;

    // Check if user can afford the badge
    const success = await spendCoins(badge.price_coins);
    if (!success) return false;

    try {
      const { error } = await supabase
        .from('user_badges')
        .insert({
          user_id: user.id,
          badge_key: badgeKey,
          is_active: false
        });

      if (error) throw error;

      toast.success(`Badge "${badge.name}" purchased!`);
      await fetchBadges();
      return true;
    } catch (error) {
      console.error('Error purchasing badge:', error);
      toast.error('Failed to purchase badge');
      return false;
    }
  };

  const setActiveBadgeKey = async (badgeKey: string | null) => {
    if (!user) return false;

    try {
      // First, deactivate all badges
      await supabase
        .from('user_badges')
        .update({ is_active: false })
        .eq('user_id', user.id);

      // Then activate the selected badge (if any)
      if (badgeKey) {
        const { error } = await supabase
          .from('user_badges')
          .update({ is_active: true })
          .eq('user_id', user.id)
          .eq('badge_key', badgeKey);

        if (error) throw error;
      }

      await fetchBadges();
      return true;
    } catch (error) {
      console.error('Error setting active badge:', error);
      return false;
    }
  };

  const getUserActiveBadge = async (userId: string): Promise<BadgeWithOwnership | null> => {
    try {
      const { data: userBadge, error: userBadgeError } = await supabase
        .from('user_badges')
        .select('badge_key')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (userBadgeError || !userBadge) return null;

      const { data: badge, error: badgeError } = await supabase
        .from('badge_store')
        .select('*')
        .eq('badge_key', userBadge.badge_key)
        .single();

      if (badgeError || !badge) return null;

      return {
        ...badge,
        owned: true
      };
    } catch (error) {
      console.error('Error fetching user active badge:', error);
      return null;
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-green-500';
      case 'rare': return 'text-blue-500';
      case 'epic': return 'text-purple-500';
      case 'legendary': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  return {
    badges,
    activeBadge,
    loading,
    purchaseBadge,
    setActiveBadgeKey,
    getUserActiveBadge,
    getRarityColor,
    refreshBadges: fetchBadges
  };
};