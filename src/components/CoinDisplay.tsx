import { Coins } from 'lucide-react';
import { useCoins } from '@/hooks/useCoins';
import { cn } from '@/lib/utils';

interface CoinDisplayProps {
  className?: string;
  showTotal?: boolean;
}

export const CoinDisplay = ({ className, showTotal = false }: CoinDisplayProps) => {
  const { coins, loading } = useCoins();

  if (loading) {
    return (
      <div className={cn("flex items-center gap-2 animate-pulse", className)}>
        <div className="w-4 h-4 bg-muted rounded-full" />
        <div className="w-12 h-4 bg-muted rounded" />
      </div>
    );
  }

  if (!coins) return null;

  return (
    <div className={cn("flex items-center gap-2 text-sm font-medium", className)}>
      <Coins className="w-4 h-4 text-yellow-500" />
      <span className="text-foreground">
        {coins.balance.toLocaleString()}
      </span>
      {showTotal && (
        <span className="text-muted-foreground text-xs">
          (Total: {coins.total_earned.toLocaleString()})
        </span>
      )}
    </div>
  );
};