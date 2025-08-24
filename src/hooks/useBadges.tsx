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
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
}

interface UserBadge {
  id: string;
  user_id: string;
  badge_key: string;
  badge_slot: number | null;
  expires_at: string | null;
  is_active: boolean;
  purchased_at: string;
}

interface BadgeWithOwnership extends Badge {
  owned: boolean;
  user_badge?: UserBadge;
}

interface SlotBadges {
  slot1?: BadgeWithOwnership; // Telegram Premium (permanent)
  slot2?: BadgeWithOwnership; // Streaming Premium (temporary)
  slot3?: BadgeWithOwnership; // Badge Store (user choice)
}

export const useBadges = () => {
  const { user } = useAuth();
  const { spendCoins } = useCoins();
  const [badges, setBadges] = useState<BadgeWithOwnership[]>([]);
  const [slotBadges, setSlotBadges] = useState<SlotBadges>({});
  const [availableSlot3Badges, setAvailableSlot3Badges] = useState<BadgeWithOwnership[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchBadges();
    }
  }, [user]);

  const fetchBadges = async () => {
    if (!user) return;

    try {
      // Clean up expired badges first
      await supabase.rpc('cleanup_expired_streaming_badges');

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

      // Organize badges by slots
      const slots: SlotBadges = {};
      
      // Find slot badges (1=telegram, 2=streaming, 3=badge_store)
      userBadges?.forEach(userBadge => {
        const badge = badgesWithOwnership.find(b => b.badge_key === userBadge.badge_key);
        if (badge && userBadge.badge_slot) {
          if (userBadge.badge_slot === 1) slots.slot1 = badge;
          if (userBadge.badge_slot === 2) slots.slot2 = badge;
          if (userBadge.badge_slot === 3) slots.slot3 = badge;
        }
      });

      setSlotBadges(slots);

      // Find available slot 3 badges (purchased but not equipped)
      const availableForSlot3 = badgesWithOwnership.filter(badge => 
        badge.owned && 
        badge.price_coins > 0 && // Not premium badges
        !userBadges?.find(ub => ub.badge_key === badge.badge_key && ub.badge_slot === 3)
      );
      
      setAvailableSlot3Badges(availableForSlot3);
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

  const setSlot3Badge = async (badgeKey: string | null) => {
    if (!user) return false;

    try {
      // Remove current slot 3 badge
      await supabase
        .from('user_badges')
        .delete()
        .eq('user_id', user.id)
        .eq('badge_slot', 3);

      // Set new slot 3 badge (if any)
      if (badgeKey) {
        const { error } = await supabase
          .from('user_badges')
          .insert({
            user_id: user.id,
            badge_key: badgeKey,
            badge_slot: 3,
            is_active: true
          });

        if (error) throw error;
      }

      await fetchBadges();
      return true;
    } catch (error) {
      console.error('Error setting slot 3 badge:', error);
      return false;
    }
  };

  const getUserSlotBadges = async (userId: string): Promise<SlotBadges> => {
    try {
      // Clean up expired badges first
      await supabase.rpc('cleanup_expired_streaming_badges');

      const { data: userBadges, error: userBadgesError } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', userId);

      if (userBadgesError || !userBadges) return {};

      const slots: SlotBadges = {};

      // Fetch badge details for each slot
      for (const userBadge of userBadges) {
        if (!userBadge.badge_slot) continue;

        const { data: badge, error: badgeError } = await supabase
          .from('badge_store')
          .select('*')
          .eq('badge_key', userBadge.badge_key)
          .single();

        if (!badgeError && badge) {
          const badgeWithOwnership: BadgeWithOwnership = {
            ...badge,
            owned: true,
            user_badge: userBadge
          };

          if (userBadge.badge_slot === 1) slots.slot1 = badgeWithOwnership;
          if (userBadge.badge_slot === 2) slots.slot2 = badgeWithOwnership;
          if (userBadge.badge_slot === 3) slots.slot3 = badgeWithOwnership;
        }
      }

      return slots;
    } catch (error) {
      console.error('Error fetching user slot badges:', error);
      return {};
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
    slotBadges,
    availableSlot3Badges,
    loading,
    purchaseBadge,
    setSlot3Badge,
    getUserSlotBadges,
    getRarityColor,
    refreshBadges: fetchBadges
  };
};