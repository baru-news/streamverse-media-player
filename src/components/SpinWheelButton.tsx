import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useSpinWheel } from '@/hooks/useSpinWheel';
import { useAuth } from '@/hooks/useAuth';
import SpinWheelDialog from './SpinWheelDialog';
import { cn } from '@/lib/utils';

const SpinWheelButton: React.FC = () => {
  const { user } = useAuth();
  const { canSpin, loading, todayAttempts } = useSpinWheel();
  const [dialogOpen, setDialogOpen] = useState(false);

  // Don't show button if user is not logged in
  if (!user) return null;

  const hasSpunToday = todayAttempts.length > 0;
  const isEligible = canSpin && !hasSpunToday;

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setDialogOpen(true)}
        disabled={loading}
        className={cn(
          "relative px-3 py-2 text-sm font-medium transition-all duration-200",
          "hover:bg-pink-50 hover:text-pink-600",
          isEligible && "animate-pulse bg-gradient-to-r from-pink-100 to-pink-200 text-pink-700"
        )}
      >
        <span className="flex items-center gap-1">
          🎀
          <span className="hidden sm:inline">Lucky Wheel</span>
        </span>
        
        {/* Notification badge */}
        {isEligible && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-pink-500 rounded-full animate-ping">
            <div className="absolute inset-0 w-3 h-3 bg-pink-500 rounded-full"></div>
          </div>
        )}
      </Button>

      <SpinWheelDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
};

export default SpinWheelButton;