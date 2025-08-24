import React from 'react';
import { useKittyKeys } from '@/hooks/useKittyKeys';
import { usePremium } from '@/hooks/usePremium';
import { Skeleton } from '@/components/ui/skeleton';
import { Crown } from 'lucide-react';

const KittyKeyDisplay: React.FC = () => {
  const { kittyKeys, loading } = useKittyKeys();
  const { isPremium } = usePremium();

  if (loading) {
    return (
      <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-100 to-yellow-200 px-3 py-2 rounded-full border border-yellow-300">
        <div className="text-lg">🗝️</div>
        <Skeleton className="h-4 w-8" />
        {isPremium && <Skeleton className="h-3 w-3" />}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-100 to-yellow-200 px-3 py-2 rounded-full border border-yellow-300 shadow-sm">
      <div className="text-lg animate-pulse">🗝️</div>
      <span className="font-bold text-yellow-800 text-sm">
        {kittyKeys?.balance || 0}
      </span>
      {isPremium && (
        <Crown className="w-3 h-3 text-yellow-600" />
      )}
    </div>
  );
};

export default KittyKeyDisplay;