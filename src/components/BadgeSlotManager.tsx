import { useState } from 'react';
import { useBadges } from '@/hooks/useBadges';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Settings } from 'lucide-react';
import { toast } from 'sonner';

export const BadgeSlotManager = () => {
  const { slotBadges, availableSlot3Badges, setSlot3Badge, getRarityColor, loading } = useBadges();
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleEquipBadge = async (badgeKey: string | null) => {
    setIsUpdating(true);
    try {
      const success = await setSlot3Badge(badgeKey);
      if (success) {
        toast.success(badgeKey ? 'Badge equipped successfully!' : 'Badge removed successfully!');
        setIsOpen(false);
      } else {
        toast.error('Failed to update badge');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setIsUpdating(false);
    }
  };

  const formatExpiry = (expiresAt: string | null) => {
    if (!expiresAt) return 'Permanent';
    const date = new Date(expiresAt);
    const now = new Date();
    const days = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (days <= 0) return 'Expired';
    if (days <= 7) return `${days} day${days === 1 ? '' : 's'} left`;
    return date.toLocaleDateString();
  };

  const renderBadgeSlot = (slotNumber: 1 | 2 | 3, label: string, badge?: any) => {
    const isSlot3 = slotNumber === 3;
    
    return (
      <div className="p-4 border rounded-lg bg-card">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-sm">Slot {slotNumber}: {label}</h4>
          {badge && (
            <Badge variant="secondary" className={getRarityColor(badge.rarity)}>
              {badge.rarity}
            </Badge>
          )}
        </div>
        
        {badge ? (
          <div className="flex items-center gap-3">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: badge.color }}
            >
              {badge.image_url ? (
                <img 
                  src={badge.image_url} 
                  alt={badge.name}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <span>{badge.icon}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{badge.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatExpiry(badge.user_badge?.expires_at)}
              </p>
            </div>
            {isSlot3 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleEquipBadge(null)}
                disabled={isUpdating}
              >
                Remove
              </Button>
            )}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            {isSlot3 ? 'No badge equipped' : 'No premium subscription'}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <div className="animate-pulse w-8 h-8 bg-muted rounded" />;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="w-4 h-4" />
          Manage Badges
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Badge Management</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid gap-4">
            {renderBadgeSlot(1, 'Telegram Premium', slotBadges.slot1)}
            {renderBadgeSlot(2, 'Streaming Premium', slotBadges.slot2)}
            {renderBadgeSlot(3, 'Badge Store', slotBadges.slot3)}
          </div>
          
          {availableSlot3Badges.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Available Badges for Slot 3</h4>
              <div className="grid grid-cols-2 gap-2">
                {availableSlot3Badges.map((badge) => (
                  <Button
                    key={badge.badge_key}
                    variant="outline"
                    className="justify-start gap-3 p-3 h-auto"
                    onClick={() => handleEquipBadge(badge.badge_key)}
                    disabled={isUpdating}
                  >
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
                      style={{ backgroundColor: badge.color }}
                    >
                      {badge.image_url ? (
                        <img 
                          src={badge.image_url} 
                          alt={badge.name}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                      ) : (
                        <span>{badge.icon}</span>
                      )}
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-sm">{badge.name}</div>
                      <div className={`text-xs ${getRarityColor(badge.rarity)}`}>
                        {badge.rarity}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}
          
          <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
            <p><strong>Slot 1:</strong> Telegram Premium badge (permanent, auto-assigned)</p>
            <p><strong>Slot 2:</strong> Streaming Premium badge (temporary, auto-assigned)</p>  
            <p><strong>Slot 3:</strong> Badge Store badges (your choice, can be changed)</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};