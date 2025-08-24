import { useState, useEffect } from 'react';
import { useBadges } from '@/hooks/useBadges';

interface UserBadgeDisplayProps {
  userId: string;
  className?: string;
  showTooltip?: boolean;
}

export const UserBadgeDisplay = ({ userId, className = "", showTooltip = true }: UserBadgeDisplayProps) => {
  const [slotBadges, setSlotBadges] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const { getUserSlotBadges, getRarityColor } = useBadges();

  useEffect(() => {
    const fetchUserBadges = async () => {
      try {
        const badges = await getUserSlotBadges(userId);
        setSlotBadges(badges);
      } catch (error) {
        console.error('Error in fetchUserBadges:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserBadges();
    }
  }, [userId, getUserSlotBadges]);

  const createBadgeElement = (badge: any, slotNumber: number) => {
    const isExpiring = badge.user_badge?.expires_at && 
      new Date(badge.user_badge.expires_at) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    return (
      <div
        key={`slot-${slotNumber}`}
        className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold shadow-sm ${
          isExpiring ? 'opacity-75 ring-2 ring-yellow-400' : ''
        } ${className}`}
        style={{ backgroundColor: badge.color, color: 'white' }}
        title={showTooltip ? `${badge.name}${isExpiring ? ' (Expires Soon)' : ''}` : undefined}
      >
        {badge.image_url ? (
          <img 
            src={badge.image_url} 
            alt={badge.name}
            className="w-4 h-4 rounded-full object-cover"
          />
        ) : (
          <span className="text-white">
            {badge.icon}
          </span>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 animate-pulse ${className}`} />
    );
  }

  // Get active badges in order: slot1 (telegram), slot2 (streaming), slot3 (badge store)
  const activeBadges = [];
  if (slotBadges.slot1) activeBadges.push({ badge: slotBadges.slot1, slot: 1 });
  if (slotBadges.slot2) activeBadges.push({ badge: slotBadges.slot2, slot: 2 });
  if (slotBadges.slot3) activeBadges.push({ badge: slotBadges.slot3, slot: 3 });

  if (activeBadges.length === 0) {
    return null;
  }

  if (activeBadges.length === 1) {
    return createBadgeElement(activeBadges[0].badge, activeBadges[0].slot);
  }

  // Multiple badges - show them side by side with slight overlap
  return (
    <div className={`inline-flex items-center -space-x-1 ${className}`}>
      {activeBadges.map(({ badge, slot }, index) => (
        <div key={`slot-${slot}`} style={{ zIndex: activeBadges.length - index }}>
          {createBadgeElement(badge, slot)}
        </div>
      ))}
      {showTooltip && (
        <div className="sr-only">
          {activeBadges.map(({ badge }) => badge.name).join(', ')}
        </div>
      )}
    </div>
  );
};