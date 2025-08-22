import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useSpinWheel } from '@/hooks/useSpinWheel';
import { useAuth } from '@/hooks/useAuth';
import { useKittyKeys } from '@/hooks/useKittyKeys';
import SpinWheelDialog from './SpinWheelDialog';
import { cn } from '@/lib/utils';

const SpinWheelButton: React.FC = () => {
  const { user } = useAuth();
  const { canSpin, loading } = useSpinWheel();
  const { kittyKeys } = useKittyKeys();
  const [dialogOpen, setDialogOpen] = useState(false);

  // Don't show button if user is not logged in
  if (!user) return null;

  const hasKeys = kittyKeys && kittyKeys.balance > 0;
  const isEligible = canSpin && hasKeys;

  return (
    <>
      <Button
        onClick={() => setDialogOpen(true)}
        disabled={loading}
        className={cn(
          "relative px-4 py-2.5 text-sm font-bold transition-all duration-300 shadow-lg",
          "bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700",
          "text-white border-0 rounded-full min-w-[120px]",
          "transform hover:scale-105 active:scale-95",
          isEligible && "animate-pulse shadow-pink-400/50 shadow-xl",
          !isEligible && "opacity-75 hover:opacity-90"
        )}
      >
        <div className="flex items-center justify-center gap-2">
          <span className="text-lg animate-spin-slow">🎀</span>
          <span className="font-extrabold tracking-wide">
            Kitty Wheel
          </span>
        </div>
        
        {/* Sparkle effects */}
        <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
          <div className="absolute top-1 left-3 w-1 h-1 bg-white rounded-full animate-ping delay-100"></div>
          <div className="absolute top-3 right-4 w-1 h-1 bg-white rounded-full animate-ping delay-300"></div>
          <div className="absolute bottom-2 left-6 w-1 h-1 bg-white rounded-full animate-ping delay-500"></div>
        </div>
        
        {/* Notification badge */}
        {isEligible && (
          <div className="absolute -top-2 -right-2 flex items-center justify-center">
            <div className="w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-bounce shadow-lg">
              <div className="w-full h-full bg-gradient-to-r from-yellow-300 to-orange-400 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-white">!</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Glow effect when eligible */}
        {isEligible && (
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 opacity-75 blur-md -z-10 animate-pulse"></div>
        )}
      </Button>

      <SpinWheelDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
};

export default SpinWheelButton;