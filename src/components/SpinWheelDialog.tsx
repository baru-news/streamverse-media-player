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
            <span className="ml-2 text-pink-600">Memuat roda ajaib... ✨</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-pink-600 text-xl">
            🎀 Roda Beruntung Hello Kitty 🎀
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {rewards.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-pink-400 text-4xl mb-4">😿</div>
                <p className="text-pink-600">Tidak ada hadiah tersedia saat ini.</p>
              </div>
          ) : (
            <>
              <HelloKittySpinWheel
                rewards={rewards}
                onSpin={performSpin}
                spinning={spinning}
                disabled={!canSpin}
              />

              {/* Status Information */}
              <div className="mt-6 space-y-4">
                {!canSpin && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="font-bold text-yellow-800 mb-3 flex items-center gap-2 text-lg">
                      🗝️ Kitty Key Diperlukan
                    </h3>
                    <p className="text-yellow-700 font-medium text-base leading-relaxed">
                      Kamu memerlukan Kitty Key untuk memutar roda beruntung! 
                      Dapatkan Kitty Key dengan menyelesaikan tugas harian. ✨
                    </p>
                  </div>
                )}

                {/* Rewards Preview */}
                <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-lg p-4">
                  <h3 className="font-bold text-pink-800 mb-3 flex items-center gap-2 text-lg">
                    🏆 Hadiah Tersedia
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {rewards.map((reward) => (
                      <div
                        key={reward.id}
                        className="bg-white border border-pink-200 rounded-lg p-2 text-center"
                      >
                        <div className="text-sm font-bold text-pink-900 truncate">
                          {reward.name}
                        </div>
                        <div className="text-lg font-bold text-pink-700">
                          {reward.coin_amount} 🪙
                        </div>
                        <div className="text-sm font-medium text-pink-600">
                          {reward.rarity === 'legendary' && '👑 Legendaris'}
                          {reward.rarity === 'epic' && '⭐ Epik'}
                          {reward.rarity === 'rare' && '💎 Langka'}
                          {reward.rarity === 'common' && '🌸 Biasa'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rules */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-bold text-blue-800 mb-3 flex items-center gap-2 text-lg">
                    📜 Aturan Permainan
                  </h3>
                  <ul className="text-blue-700 font-medium space-y-2 text-base">
                    <li>• Selesaikan tugas harian untuk mendapatkan Kitty Key 🗝️</li>
                    <li>• Klaim Kitty Key di bagian tugas setelah selesai 🎁</li>
                    <li>• Gunakan 1 Kitty Key untuk memutar roda beruntung 🎪</li>
                    <li>• Putar berulang kali selama Kitty Key masih ada 💰</li>
                    <li>• Reset tugas setiap hari pada pukul 00:00 WIB ⏰</li>
                    <li>• Hadiah langka lebih sulit didapat tapi lebih berharga! 💎</li>
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