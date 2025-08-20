import { useState, useEffect } from 'react';
import { useBadges } from '@/hooks/useBadges';
import { cn } from '@/lib/utils';

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
}

export const UserBadgeDisplay = ({ userId, className, showTooltip = true }: UserBadgeDisplayProps) => {
  const { getUserActiveBadge, getRarityColor } = useBadges();
  const [badge, setBadge] = useState<BadgeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBadge = async () => {
      try {
        const activeBadge = await getUserActiveBadge(userId);
        setBadge(activeBadge ? {
          icon: activeBadge.icon,
          name: activeBadge.name,
          rarity: activeBadge.rarity,
          color: activeBadge.color,
          image_url: activeBadge.image_url
        } : null);
      } catch (error) {
        console.error('Error fetching user badge:', error);
        setBadge(null);
      } finally {
        setLoading(false);
      }
    };

    fetchBadge();
  }, [userId, getUserActiveBadge]);

  if (loading) {
    return (
      <div className={cn("w-5 h-5 animate-pulse bg-muted rounded-full", className)} />
    );
  }

  if (!badge) return null;

  const badgeElement = (
    <div className={cn(
      "inline-flex items-center justify-center w-5 h-5 text-sm rounded-full border-2 transition-transform hover:scale-110 overflow-hidden",
      getRarityColor(badge.rarity),
      className
    )}
    style={{ borderColor: badge.color }}
    >
      {badge.image_url ? (
        <img 
          src={badge.image_url} 
          alt={badge.name}
          className="w-full h-full object-cover"
        />
      ) : (
        badge.icon
      )}
    </div>
  );

  if (!showTooltip) return badgeElement;

  return (
    <div className="group relative">
      {badgeElement}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
        {badge.name}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black"></div>
      </div>
    </div>
  );
};