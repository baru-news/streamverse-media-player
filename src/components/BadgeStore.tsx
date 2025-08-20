import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge'; 
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBadges } from '@/hooks/useBadges';
import { useCoins } from '@/hooks/useCoins';
import { ShoppingBag, Crown, Star, Gem, Award, Check, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export const BadgeStore = () => {
  const { badges, activeBadge, loading, purchaseBadge, setActiveBadgeKey, getRarityColor } = useBadges();
  const { coins } = useCoins();
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const handlePurchase = async (badgeKey: string) => {
    setPurchasing(badgeKey);
    const success = await purchaseBadge(badgeKey);
    if (success) {
      toast.success('Badge purchased successfully!');
    }
    setPurchasing(null);
  };

  const handleSetActive = async (badgeKey: string | null) => {
    const success = await setActiveBadgeKey(badgeKey);
    if (success) {
      toast.success(badgeKey ? 'Badge equipped!' : 'Badge unequipped!');
    }
  };

  // Update the BadgeStore component to support custom images
  const BadgeIcon = ({ badge, className = "w-8 h-8" }: { badge: any, className?: string }) => {
    if (badge.image_url) {
      return (
        <img 
          src={badge.image_url} 
          alt={badge.name}
          className={`${className} object-cover rounded-full`}
        />
      );
    }
    
    // Fallback to icon
    const iconName = badge.icon || 'star';
    switch (iconName) {
      case 'crown': return <Crown className={`${className} text-yellow-400`} />;
      case 'gem': return <Gem className={`${className} text-purple-400`} />;
      case 'shield': return <Shield className={`${className} text-blue-400`} />;
      case 'star': return <Star className={`${className} text-yellow-400`} />;
      default: return <Star className={`${className} text-yellow-400`} />;
    }
  };

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'common': return <Star className="w-4 h-4" />;
      case 'rare': return <Gem className="w-4 h-4" />;
      case 'epic': return <Crown className="w-4 h-4" />;
      case 'legendary': return <Award className="w-4 h-4" />;
      default: return <Star className="w-4 h-4" />;
    }
  };

  const canAfford = (price: number) => {
    return coins ? coins.balance >= price : false;
  };

  const groupedBadges = badges.reduce((acc, badge) => {
    if (!acc[badge.rarity]) {
      acc[badge.rarity] = [];
    }
    acc[badge.rarity].push(badge);
    return acc;
  }, {} as Record<string, typeof badges>);

  if (loading) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <ShoppingBag className="w-4 h-4 mr-2" />
            Badge Store
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Badge Store</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">Loading badges...</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ShoppingBag className="w-4 h-4 mr-2" />
          Badge Store
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Badge Store</span>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Crown className="w-4 h-4 text-yellow-500" />
                {activeBadge ? `${activeBadge.icon} ${activeBadge.name}` : 'No badge equipped'}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="store" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="store">Store</TabsTrigger>
            <TabsTrigger value="inventory">My Badges</TabsTrigger>
          </TabsList>
          
          <TabsContent value="store" className="space-y-6">
            {Object.entries(groupedBadges).map(([rarity, badgeList]) => (
              <div key={rarity} className="space-y-3">
                <div className="flex items-center gap-2">
                  {getRarityIcon(rarity)}
                  <h3 className={cn("text-lg font-semibold capitalize", getRarityColor(rarity))}>
                    {rarity}
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {badgeList.map((badge) => (
                    <Card key={badge.id} className={cn(
                      "relative overflow-hidden transition-all duration-200 hover:scale-105",
                      badge.owned && "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                    )}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <BadgeIcon badge={badge} className="w-8 h-8" />
                          {badge.owned && (
                            <Check className="w-5 h-5 text-green-500" />
                          )}
                        </div>
                        <CardTitle className="text-base">{badge.name}</CardTitle>
                        <Badge variant="outline" className={cn("w-fit text-xs", getRarityColor(badge.rarity))}>
                          {badge.rarity}
                        </Badge>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {badge.description && (
                          <p className="text-sm text-muted-foreground">{badge.description}</p>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-sm font-medium text-yellow-600">
                            <ShoppingBag className="w-4 h-4" />
                            {badge.price_coins.toLocaleString()}
                          </div>
                          
                          {badge.owned ? (
                            <Button 
                              size="sm" 
                              variant={badge.user_badge?.is_active ? "default" : "outline"}
                              onClick={() => handleSetActive(
                                badge.user_badge?.is_active ? null : badge.badge_key
                              )}
                            >
                              {badge.user_badge?.is_active ? "Equipped" : "Equip"}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              disabled={!canAfford(badge.price_coins) || purchasing === badge.badge_key}
                              onClick={() => handlePurchase(badge.badge_key)}
                            >
                              {purchasing === badge.badge_key ? "Buying..." : "Buy"}
                            </Button>
                          )}
                        </div>
                        
                        {!badge.owned && !canAfford(badge.price_coins) && (
                          <p className="text-xs text-red-500">Insufficient coins</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>
          
          <TabsContent value="inventory" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {badges.filter(badge => badge.owned).map((badge) => (
                <Card key={badge.id} className={cn(
                  "relative overflow-hidden transition-all duration-200",
                  badge.user_badge?.is_active && "ring-2 ring-primary"
                )}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <BadgeIcon badge={badge} className="w-8 h-8" />
                      {badge.user_badge?.is_active && (
                        <Crown className="w-5 h-5 text-yellow-500" />
                      )}
                    </div>
                    <CardTitle className="text-base">{badge.name}</CardTitle>
                    <Badge variant="outline" className={cn("w-fit text-xs", getRarityColor(badge.rarity))}>
                      {badge.rarity}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {badge.description && (
                      <p className="text-sm text-muted-foreground">{badge.description}</p>
                    )}
                    
                    <Button 
                      size="sm" 
                      variant={badge.user_badge?.is_active ? "default" : "outline"}
                      onClick={() => handleSetActive(
                        badge.user_badge?.is_active ? null : badge.badge_key
                      )}
                      className="w-full"
                    >
                      {badge.user_badge?.is_active ? "Equipped" : "Equip"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {badges.filter(badge => badge.owned).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Award className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">You don't own any badges yet</p>
                <p className="text-xs">Purchase badges from the store to show them off!</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};