import React from 'react';
import { useKittyKeys } from '@/hooks/useKittyKeys';
import { Skeleton } from '@/components/ui/skeleton';

const KittyKeyDisplay: React.FC = () => {
  const { kittyKeys, loading } = useKittyKeys();

  if (loading) {
    return (
      <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-100 to-yellow-200 px-3 py-2 rounded-full border border-yellow-300">
        <div className="text-lg">🗝️</div>
        <Skeleton className="h-4 w-8" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-100 to-yellow-200 px-3 py-2 rounded-full border border-yellow-300 shadow-sm">
      <div className="text-lg animate-pulse">🗝️</div>
      <span className="font-bold text-yellow-800 text-sm">
        {kittyKeys?.balance || 0}
      </span>
    </div>
  );
};

export default KittyKeyDisplay;