import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { usePremiumSubscription } from '@/hooks/usePremiumSubscription';

interface UserBadgeDisplayProps {
  userId: string;
  className?: string;
  showTooltip?: boolean;
}

interface BadgeData {
  icon: string;
  name: string;
  rarity: string;
  color: string;
  image_url: string | null;
  badge_key?: string;
}

export const UserBadgeDisplay = ({ userId, className, showTooltip = true }: UserBadgeDisplayProps) => {
  const [badge, setBadge] = useState<BadgeData | null>(null);
  const [premiumBadge, setPremiumBadge] = useState<BadgeData | null>(null);
  const [loading, setLoading] = useState(true);
  const { checkPremiumStatus } = usePremiumSubscription();

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        // Fetch all active badges for the user
        const { data: userBadges, error: userBadgeError } = await supabase
          .from('user_badges')
          .select('badge_key')
          .eq('user_id', userId)
          .eq('is_active', true);

        if (userBadgeError) {
          console.error('Error fetching user badges:', userBadgeError);
          return;
        }

        if (!userBadges || userBadges.length === 0) {
          setBadge(null);
          setPremiumBadge(null);
          return;
        }

        // Separate premium and regular badges
        const premiumBadgeKey = userBadges.find(b => b.badge_key === 'premium_subscriber');
        const regularBadgeKey = userBadges.find(b => b.badge_key !== 'premium_subscriber');

        // Fetch badge details from badge_store
        const badgeKeys = userBadges.map(b => b.badge_key);
        const { data: badgeStore, error: badgeError } = await supabase
          .from('badge_store')
          .select('*')
          .in('badge_key', badgeKeys)
          .eq('is_active', true);

        if (badgeError || !badgeStore) {
          setBadge(null);
          setPremiumBadge(null);
          return;
        }

        // Set premium badge if exists
        if (premiumBadgeKey) {
          const premiumBadgeData = badgeStore.find(b => b.badge_key === 'premium_subscriber');
          if (premiumBadgeData) {
            setPremiumBadge({
              icon: premiumBadgeData.icon,
              name: premiumBadgeData.name,
              rarity: premiumBadgeData.rarity,
              color: premiumBadgeData.color,
              image_url: premiumBadgeData.image_url,
              badge_key: premiumBadgeData.badge_key
            });
          }
        }

        // Set regular badge if exists
        if (regularBadgeKey) {
          const regularBadgeData = badgeStore.find(b => b.badge_key === regularBadgeKey.badge_key);
          if (regularBadgeData) {
            setBadge({
              icon: regularBadgeData.icon,
              name: regularBadgeData.name,
              rarity: regularBadgeData.rarity,
              color: regularBadgeData.color,
              image_url: regularBadgeData.image_url,
              badge_key: regularBadgeData.badge_key
            });
          }
        }
      } catch (error) {
        console.error('Error fetching user badges:', error);
        setBadge(null);
        setPremiumBadge(null);
      } finally {
        setLoading(false);
      }
    };

    fetchBadges();
  }, [userId]);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-green-500';
      case 'rare': return 'text-blue-500';
      case 'epic': return 'text-purple-500';
      case 'legendary': return 'text-yellow-500';
      case 'premium': return 'text-yellow-400';
      default: return 'text-gray-500';
    }
  };

  const createBadgeElement = (badgeData: BadgeData, isPremium = false) => (
    <div className={cn(
      "inline-flex items-center justify-center w-5 h-5 text-sm rounded-full border-2 transition-transform hover:scale-110 overflow-hidden",
      getRarityColor(badgeData.rarity),
      isPremium && "ring-2 ring-yellow-400 ring-opacity-50",
      className
    )}
    style={{ borderColor: badgeData.color }}
    >
      {badgeData.image_url ? (
        <img 
          src={badgeData.image_url} 
          alt={badgeData.name}
          className="w-full h-full object-cover"
        />
      ) : (
        badgeData.icon
      )}
    </div>
  );

  if (loading) {
    return (
      <div className={cn("w-5 h-5 animate-pulse bg-muted rounded-full", className)} />
    );
  }

  // If no badges, return null
  if (!badge && !premiumBadge) return null;

  // If we have both badges, show them side by side
  if (badge && premiumBadge) {
    const dualBadgeElement = (
      <div className="flex items-center gap-1">
        {createBadgeElement(badge)}
        {createBadgeElement(premiumBadge, true)}
      </div>
    );

    if (!showTooltip) return dualBadgeElement;

    return (
      <div className="group relative">
        {dualBadgeElement}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-card text-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
          {badge.name} + {premiumBadge.name}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-card"></div>
        </div>
      </div>
    );
  }

  // Show single badge (either regular or premium)
  const singleBadge = badge || premiumBadge!;
  const badgeElement = createBadgeElement(singleBadge, singleBadge.badge_key === 'premium_subscriber');

  if (!showTooltip) return badgeElement;

  return (
    <div className="group relative">
      {badgeElement}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-card text-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
        {singleBadge.name}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-card"></div>
      </div>
    </div>
  );
};