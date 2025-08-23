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
      <DialogContent className="w-[95vw] max-w-md mx-auto animate-fade-in">
        <DialogHeader className="text-center pb-2">
          <div className="mx-auto mb-6 relative">
            <div className="absolute inset-0 animate-ping opacity-75">
              <Sparkles className="w-10 h-10 text-primary mx-auto" />
            </div>
            <div className="relative z-10 p-3 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 backdrop-blur-sm">
              <Gift className="w-10 h-10 text-primary mx-auto animate-bounce" />
            </div>
          </div>
          <DialogTitle className="text-lg sm:text-xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent leading-tight">
            🎉 Selamat Datang di DINO18! 🎀
          </DialogTitle>
        </DialogHeader>
        
        <div className="text-center space-y-5 px-1">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Terima kasih sudah bergabung! Dapatkan bonus spesial sebagai member baru:
          </p>
          
          <div className="space-y-3">
            {/* Newbie Badge */}
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-card/80 to-card border border-border/50 backdrop-blur-sm hover:scale-[1.02] transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10" />
              <div className="relative flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/50 dark:to-green-800/50 rounded-full flex items-center justify-center shadow-sm">
                    <span className="text-xl animate-bounce">🆕</span>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-foreground text-sm">Newbie Badge</p>
                    <p className="text-xs text-muted-foreground">Badge khusus member baru</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300 dark:bg-green-900/50 dark:text-green-200 font-medium">
                  GRATIS
                </Badge>
              </div>
            </div>
            
            {/* Kitty Keys */}
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-card/80 to-card border border-border/50 backdrop-blur-sm hover:scale-[1.02] transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-amber-500/10" />
              <div className="relative flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/50 dark:to-yellow-800/50 rounded-full flex items-center justify-center shadow-sm">
                    <Key className="w-6 h-6 text-yellow-600 dark:text-yellow-400 animate-pulse" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-foreground text-sm">5 Kitty Keys</p>
                    <p className="text-xs text-muted-foreground">Untuk spin wheel beruntung</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/50 dark:text-yellow-200 font-medium">
                  x5
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="pt-2 space-y-4">
            <Button 
              onClick={onClaim}
              disabled={loading}
              size="lg"
              className="w-full h-12 bg-gradient-to-r from-primary via-secondary to-primary bg-size-200 bg-pos-0 hover:bg-pos-100 text-primary-foreground font-semibold relative overflow-hidden group shadow-lg hover:shadow-xl transition-all duration-300 animate-glow-pulse"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    <span className="text-sm">Mengklaim Bonus...</span>
                  </>
                ) : (
                  <>
                    <Gift className="w-5 h-5 animate-bounce" />
                    <span className="text-sm font-bold">Klaim Bonus Sekarang!</span>
                  </>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Button>
            
            <p className="text-xs text-muted-foreground/80 px-2 leading-relaxed">
              Bonus ini hanya bisa diklaim sekali sebagai member baru
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeBonusDialog;