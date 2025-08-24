import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge'; 
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBadges } from '@/hooks/useBadges';
import { BadgeSlotManager } from '@/components/BadgeSlotManager';
import { useCoins } from '@/hooks/useCoins';
import { ShoppingBag, Crown, Star, Gem, Award, Check, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export const BadgeStore = () => {
  const { badges, slotBadges, loading, purchaseBadge, getRarityColor } = useBadges();
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
    // This functionality is now handled in BadgeSlotManager
    toast.info('Use Badge Manager to equip/unequip badges');
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

  // Define rarity order for proper sorting
  const rarityOrder = ['common', 'rare', 'epic', 'legendary'];
  
  const getRarityWeight = (rarity: string) => {
    const index = rarityOrder.indexOf(rarity);
    return index === -1 ? 999 : index;
  };

  const groupedBadges = badges.reduce((acc, badge) => {
    if (!acc[badge.rarity]) {
      acc[badge.rarity] = [];
    }
    acc[badge.rarity].push(badge);
    return acc;
  }, {} as Record<string, typeof badges>);

  // Sort rarity groups in proper order and sort badges within each group
  const sortedRarityEntries = Object.entries(groupedBadges)
    .sort(([a], [b]) => getRarityWeight(a) - getRarityWeight(b))
    .map(([rarity, badgeList]) => [
      rarity, 
      badgeList.sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
    ] as [string, typeof badges]);

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
          className="gap-2 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20 hover:from-primary/20 hover:to-accent/20 hover-scale transition-all duration-300 shadow-lg hover:shadow-primary/25"
        >
          <ShoppingBag className="w-4 h-4" />
          Badge Store
          {coins && (
            <Badge variant="secondary" className="ml-1 bg-primary/20 text-foreground border-primary/30 animate-pulse">
              {coins.balance} coins
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-[95vw] sm:max-w-5xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-background via-background to-muted/20 border border-border/50 shadow-2xl mx-2 sm:mx-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 shadow-lg">
                <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Badge Store</span>
                <p className="text-xs sm:text-sm text-muted-foreground">Koleksi badge eksklusif untuk profil Anda</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 text-sm w-full sm:w-auto">
              <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-primary/10 to-accent/10 rounded-full border border-primary/20 w-full sm:w-auto">
                <Crown className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="font-medium truncate">
                  Badge Manager Available
                </span>
              </div>
              {coins && (
                <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-full border border-yellow-500/20 w-full sm:w-auto">
                  <Gem className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                  <span className="font-bold text-yellow-600 dark:text-yellow-400">{coins.balance} coins</span>
                </div>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="store" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 rounded-xl backdrop-blur-sm border border-border/50 mb-4 sm:mb-6 touch-manipulation">
            <TabsTrigger 
              value="store" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-primary-foreground transition-all duration-300 font-medium rounded-lg py-2 sm:py-3"
            >
              <ShoppingBag className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Store</span>
              <span className="sm:hidden">Store</span>
            </TabsTrigger>
            <TabsTrigger 
              value="inventory"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-primary-foreground transition-all duration-300 font-medium rounded-lg py-2 sm:py-3"
            >
              <Crown className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">My Badges</span>
              <span className="sm:hidden">Badges</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="store" className="space-y-8 animate-fade-in">
            {sortedRarityEntries.map(([rarity, badgeList], index) => (
              <div key={rarity} className="space-y-4" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="flex items-center gap-3 p-3 sm:p-4 bg-gradient-to-r from-muted/30 to-transparent rounded-xl border border-border/30 backdrop-blur-sm">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 shadow-md">
                    {getRarityIcon(rarity)}
                  </div>
                  <div>
                    <h3 className={cn("text-lg sm:text-xl font-bold capitalize bg-gradient-to-r bg-clip-text text-transparent", getRarityColor(rarity))}>
                      {rarity} Collection
                    </h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs border-primary/30 bg-primary/10">
                        {badgeList.length} badge{badgeList.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                  {badgeList.map((badge, badgeIndex) => (
                    <Card 
                      key={badge.id} 
                      className={cn(
                        "group relative overflow-hidden transition-all duration-300 hover-scale cursor-pointer",
                        "bg-gradient-to-br from-card via-card to-muted/20 border border-border/50",
                        "hover:shadow-xl hover:shadow-primary/10 hover:border-primary/30",
                        badge.owned && "ring-2 ring-primary/30 bg-gradient-to-br from-primary/5 via-card to-accent/5 shadow-lg shadow-primary/20"
                      )}
                      style={{ animationDelay: `${badgeIndex * 50}ms` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      <CardHeader className="pb-3 relative z-10">
                        <div className="flex items-center justify-between mb-2">
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <BadgeIcon badge={badge} className="w-10 h-10 relative z-10" />
                          </div>
                          {badge.owned && (
                            <div className="p-1 rounded-full bg-gradient-to-br from-primary to-accent shadow-lg">
                              <Check className="w-4 h-4 text-primary-foreground" />
                            </div>
                          )}
                        </div>
                        <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors duration-300">
                          {badge.name}
                        </CardTitle>
                        {badge.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{badge.description}</p>
                        )}
                      </CardHeader>

                      <CardContent className="pt-0 relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-full border border-yellow-500/20">
                            <Gem className="w-4 h-4 text-yellow-500" />
                            <span className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{badge.price_coins}</span>
                            <span className="text-sm text-muted-foreground">coins</span>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-xs font-medium border-2 px-2 py-1",
                              badge.rarity === 'common' && "border-gray-400/50 bg-gray-100/50 text-gray-600 dark:bg-gray-800/50 dark:text-gray-300",
                              badge.rarity === 'rare' && "border-blue-400/50 bg-blue-100/50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300",
                              badge.rarity === 'epic' && "border-purple-400/50 bg-purple-100/50 text-purple-600 dark:bg-purple-900/50 dark:text-purple-300",
                              badge.rarity === 'legendary' && "border-yellow-400/50 bg-yellow-100/50 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-300"
                            )}
                          >
                            {badge.rarity}
                          </Badge>
                        </div>

                        {badge.owned ? (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30 text-primary hover:from-primary/20 hover:to-accent/20 min-h-[44px] touch-manipulation"
                            disabled
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Owned
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            className={cn(
                              "w-full transition-all duration-300 font-medium min-h-[44px] touch-manipulation",
                              canAfford(badge.price_coins) 
                                ? "bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg hover:shadow-primary/25" 
                                : "opacity-60 cursor-not-allowed"
                            )}
                            onClick={() => handlePurchase(badge.badge_key)}
                            disabled={!canAfford(badge.price_coins) || purchasing === badge.badge_key}
                          >
                            {purchasing === badge.badge_key ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
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

          <TabsContent value="inventory" className="space-y-6 animate-fade-in">
            <div className="mb-4">
              <BadgeSlotManager />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
              {badges
                .filter(badge => badge.owned && badge.price_coins > 0) // Only show purchasable badges in inventory
                .sort((a, b) => getRarityWeight(a.rarity) - getRarityWeight(b.rarity) || a.sort_order - b.sort_order)
                .map((badge, index) => (
                <Card 
                  key={badge.id} 
                  className={cn(
                    "group relative overflow-hidden transition-all duration-300 hover-scale cursor-pointer",
                    "bg-gradient-to-br from-card via-card to-muted/20 border border-border/50",
                    "hover:shadow-xl hover:shadow-primary/10 hover:border-primary/30",
                    "ring-1 ring-primary/20 bg-gradient-to-br from-primary/5 via-card to-accent/5 shadow-lg shadow-primary/10"
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <CardHeader className="pb-3 relative z-10">
                    <div className="flex items-center justify-between mb-2">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <BadgeIcon badge={badge} className="w-10 h-10 relative z-10" />
                      </div>
                      <div className="p-1 rounded-full bg-gradient-to-br from-primary to-accent shadow-lg">
                        <Check className="w-4 h-4 text-primary-foreground" />
                      </div>
                    </div>
                    <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors duration-300">
                      {badge.name}
                    </CardTitle>
                    {badge.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{badge.description}</p>
                    )}
                  </CardHeader>

                  <CardContent className="pt-0 relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs font-medium border-2 px-2 py-1",
                          badge.rarity === 'common' && "border-gray-400/50 bg-gray-100/50 text-gray-600 dark:bg-gray-800/50 dark:text-gray-300",
                          badge.rarity === 'rare' && "border-blue-400/50 bg-blue-100/50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300",
                          badge.rarity === 'epic' && "border-purple-400/50 bg-purple-100/50 text-purple-600 dark:bg-purple-900/50 dark:text-purple-300",
                          badge.rarity === 'legendary' && "border-yellow-400/50 bg-yellow-100/50 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-300"
                        )}
                      >
                        {badge.rarity}
                      </Badge>
                      <div className="text-xs text-muted-foreground text-right">
                        <div>Owned Badge</div>
                        <div className="font-medium text-primary">Available for Slot 3</div>
                      </div>
                    </div>

                    <div className="text-center text-sm text-muted-foreground">
                      Use Badge Manager to equip this badge
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {badges
              .filter(badge => badge.owned && badge.price_coins > 0)
              .length === 0 && (
              <div className="text-center py-16">
                <div className="relative mx-auto w-24 h-24 mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-xl opacity-50 animate-pulse" />
                  <div className="relative bg-gradient-to-br from-muted via-card to-muted/50 rounded-full p-6 border border-border/50 shadow-lg">
                    <ShoppingBag className="w-12 h-12 text-muted-foreground/70 mx-auto" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-muted-foreground">No badges owned yet</h3>
                <p className="text-muted-foreground/70 mb-4">Start building your collection!</p>
                <Button 
                  variant="outline" 
                  className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30 hover:from-primary/20 hover:to-accent/20"
                  onClick={() => {
                    const storeTab = document.querySelector('[value="store"]') as HTMLButtonElement;
                    storeTab?.click();
                  }}
                >
                  Browse Store
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};