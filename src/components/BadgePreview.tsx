import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Users, Play, Star } from 'lucide-react';

interface BadgePreviewProps {
  subscriptionType: 'telegram' | 'streaming';
}

const BadgePreview = ({ subscriptionType }: BadgePreviewProps) => {
  const getBadgeInfo = () => {
    if (subscriptionType === 'telegram') {
      return {
        name: 'Telegram Subscriber',
        description: 'Badge permanen untuk member Telegram Premium',
        icon: Users,
        color: 'hsl(217 91% 60%)', // Blue
        slot: 1,
        rarity: 'legendary',
        duration: 'Selamanya'
      };
    } else {
      return {
        name: 'Streaming Subscriber',
        description: 'Badge premium untuk streaming tanpa iklan',
        icon: Play,
        color: 'hsl(271 91% 65%)', // Purple  
        slot: 2,
        rarity: 'epic',
        duration: 'Selama berlangganan'
      };
    }
  };

  const badge = getBadgeInfo();
  const Icon = badge.icon;

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'epic': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'rare': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <Card className="bg-gradient-to-br from-background to-muted/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Star className="w-5 h-5 text-primary" />
          Badge Preview
        </CardTitle>
        <CardDescription>
          Badge yang akan Anda dapatkan setelah berlangganan
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 p-4 bg-card rounded-lg border">
          <div 
            className="w-12 h-12 rounded-lg flex items-center justify-center border-2"
            style={{ 
              backgroundColor: `${badge.color}15`,
              borderColor: badge.color,
              color: badge.color
            }}
          >
            <Icon className="w-6 h-6" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold">{badge.name}</h4>
              <Badge className={`text-xs ${getRarityColor(badge.rarity)}`}>
                Slot {badge.slot}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{badge.description}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Crown className="w-3 h-3" />
                {badge.rarity.charAt(0).toUpperCase() + badge.rarity.slice(1)}
              </span>
              <span>{badge.duration}</span>
            </div>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <h5 className="text-sm font-medium mb-2">3-Slot Badge System:</h5>
          <div className="space-y-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span><strong>Slot 1:</strong> Telegram Premium (permanen)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span><strong>Slot 2:</strong> Streaming Premium (sementara)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span><strong>Slot 3:</strong> Badge koleksi (dapat diubah)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BadgePreview;