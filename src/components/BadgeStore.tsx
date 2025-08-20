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

  // BadgeIcon component to support custom images
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
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/20 hover:from-yellow-500/20 hover:to-orange-500/20"
        >
          <ShoppingBag className="w-4 h-4" />
          Badge Store
          {coins && (
            <Badge variant="secondary" className="ml-1 bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
              {coins.balance} coins
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <ShoppingBag className="w-6 h-6 text-yellow-500" />
            <span>Badge Store</span>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Crown className="w-4 h-4 text-yellow-500" />
                {activeBadge ? `${activeBadge.name}` : 'No badge equipped'}
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
                        {badge.description && (
                          <p className="text-sm text-muted-foreground">{badge.description}</p>
                        )}
                      </CardHeader>

                      <CardContent className="pt-0">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-1">
                            <span className="text-lg font-bold text-yellow-500">{badge.price_coins}</span>
                            <span className="text-sm text-muted-foreground">coins</span>
                          </div>
                          <Badge variant="outline" className={cn("text-xs", getRarityColor(badge.rarity))}>
                            {badge.rarity}
                          </Badge>
                        </div>

                        {badge.owned ? (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full"
                            disabled
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Owned
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            className="w-full"
                            onClick={() => handlePurchase(badge.badge_key)}
                            disabled={!canAfford(badge.price_coins) || purchasing === badge.badge_key}
                          >
                            {purchasing === badge.badge_key ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            ) : null}
                            {canAfford(badge.price_coins) ? 'Purchase' : 'Not enough coins'}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="inventory" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {badges.filter(badge => badge.owned).map((badge) => (
                <Card key={badge.id} className={cn(
                  "relative overflow-hidden transition-all duration-200 hover:scale-105",
                  badge.user_badge?.is_active && "ring-2 ring-yellow-500 bg-yellow-50 dark:bg-yellow-950/20"
                )}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <BadgeIcon badge={badge} className="w-8 h-8" />
                      {badge.user_badge?.is_active && (
                        <Crown className="w-5 h-5 text-yellow-500" />
                      )}
                    </div>
                    <CardTitle className="text-base">{badge.name}</CardTitle>
                    {badge.description && (
                      <p className="text-sm text-muted-foreground">{badge.description}</p>
                    )}
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="outline" className={cn("text-xs", getRarityColor(badge.rarity))}>
                        {badge.rarity}
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        Purchased: {new Date(badge.user_badge?.purchased_at || '').toLocaleDateString()}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {badge.user_badge?.is_active ? (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => handleSetActive(null)}
                        >
                          Unequip
                        </Button>
                      ) : (
                        <Button 
                          size="sm" 
                          className="w-full"
                          onClick={() => handleSetActive(badge.badge_key)}
                        >
                          Equip
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {badges.filter(badge => badge.owned).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingBag className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No badges owned yet</p>
                <p className="text-sm">Purchase some badges from the store!</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};