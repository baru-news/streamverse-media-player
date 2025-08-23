import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gift, Sparkles, Key } from 'lucide-react';

interface WelcomeBonusDialogProps {
  open: boolean;
  onClose: () => void;
  onClaim: () => void;
  loading?: boolean;
}

const WelcomeBonusDialog: React.FC<WelcomeBonusDialogProps> = ({
  open,
  onClose,
  onClaim,
  loading = false
}) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 relative">
            <div className="absolute inset-0 animate-ping">
              <Sparkles className="w-8 h-8 text-primary mx-auto" />
            </div>
            <Gift className="w-8 h-8 text-primary mx-auto relative z-10" />
          </div>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            🎉 Selamat Datang di DINO18! 🎀
          </DialogTitle>
        </DialogHeader>
        
        <div className="text-center space-y-6">
          <p className="text-muted-foreground">
            Terima kasih sudah bergabung! Dapatkan bonus spesial sebagai member baru:
          </p>
          
          <div className="space-y-4">
            {/* Newbie Badge */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                  <span className="text-lg">🆕</span>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-green-800 dark:text-green-200">Newbie Badge</p>
                  <p className="text-sm text-green-600 dark:text-green-400">Badge khusus member baru</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
                GRATIS
              </Badge>
            </div>
            
            {/* Kitty Keys */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-950/30 dark:to-yellow-900/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/50 rounded-full flex items-center justify-center">
                  <Key className="w-5 h-5 text-yellow-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-yellow-800 dark:text-yellow-200">5 Kitty Keys</p>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">Untuk spin wheel beruntung</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                x5
              </Badge>
            </div>
          </div>
          
          <div className="pt-4 space-y-3">
            <Button 
              onClick={onClaim}
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold py-3 relative overflow-hidden group"
            >
              <span className="relative z-10 flex items-center gap-2">
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Mengklaim Bonus...
                  </>
                ) : (
                  <>
                    <Gift className="w-4 h-4" />
                    Klaim Bonus Sekarang!
                  </>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>
            
            <p className="text-xs text-muted-foreground">
              Bonus ini hanya bisa diklaim sekali sebagai member baru
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeBonusDialog;