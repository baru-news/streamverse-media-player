import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import HelloKittySpinWheel from './HelloKittySpinWheel';
import { useSpinWheel } from '@/hooks/useSpinWheel';
import { Loader2 } from 'lucide-react';

interface SpinWheelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SpinWheelDialog: React.FC<SpinWheelDialogProps> = ({
  open,
  onOpenChange
}) => {
  const {
    rewards,
    canSpin,
    loading,
    spinning,
    todayAttempts,
    performSpin,
    refreshData
  } = useSpinWheel();

  // Refresh data when dialog opens
  React.useEffect(() => {
    if (open) {
      refreshData();
    }
  }, [open, refreshData]);

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
            <span className="ml-2 text-pink-600">Loading magical wheel... ✨</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const hasSpunToday = todayAttempts.length > 0;
  const todayReward = hasSpunToday ? todayAttempts[0] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-pink-600 text-xl">
            🎀 Hello Kitty Lucky Wheel 🎀
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {rewards.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-pink-400 text-4xl mb-4">😿</div>
              <p className="text-pink-600">No rewards available at the moment.</p>
            </div>
          ) : (
            <>
              <HelloKittySpinWheel
                rewards={rewards}
                onSpin={performSpin}
                spinning={spinning}
                disabled={!canSpin || hasSpunToday}
              />

              {/* Status Information */}
              <div className="mt-6 space-y-4">
                {hasSpunToday && todayReward && (
                  <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                    <h3 className="font-semibold text-pink-700 mb-2 flex items-center gap-2">
                      🎁 Today's Reward
                    </h3>
                    <p className="text-pink-600">
                      You already spun the wheel today and won{' '}
                      <span className="font-bold">{todayReward.coins_won} coins</span>! 
                      Come back tomorrow for another spin! 🌸
                    </p>
                  </div>
                )}

                {!canSpin && !hasSpunToday && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="font-semibold text-yellow-700 mb-2 flex items-center gap-2">
                      📋 Tasks Required
                    </h3>
                    <p className="text-yellow-600">
                      Complete all your daily tasks to unlock the lucky wheel! 
                      Check your progress in the daily tasks section. ✨
                    </p>
                  </div>
                )}

                {/* Rewards Preview */}
                <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-lg p-4">
                  <h3 className="font-semibold text-pink-700 mb-3 flex items-center gap-2">
                    🏆 Available Rewards
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {rewards.map((reward) => (
                      <div
                        key={reward.id}
                        className="bg-white border border-pink-200 rounded-lg p-2 text-center"
                      >
                        <div className="text-xs font-medium text-pink-800 truncate">
                          {reward.name}
                        </div>
                        <div className="text-sm font-bold text-pink-600">
                          {reward.coin_amount} 🪙
                        </div>
                        <div className="text-xs text-pink-500">
                          {reward.rarity === 'legendary' && '👑 Legendary'}
                          {reward.rarity === 'epic' && '⭐ Epic'}
                          {reward.rarity === 'rare' && '💎 Rare'}
                          {reward.rarity === 'common' && '🌸 Common'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rules */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-700 mb-2 flex items-center gap-2">
                    📜 Rules
                  </h3>
                  <ul className="text-blue-600 text-sm space-y-1">
                    <li>• Complete all daily tasks to unlock the wheel 🎯</li>
                    <li>• One spin per day when qualified 🎪</li>
                    <li>• Resets every day at midnight WIB ⏰</li>
                    <li>• Higher rarity rewards are rarer but worth more! 💎</li>
                  </ul>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SpinWheelDialog;