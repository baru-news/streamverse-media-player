import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AgeVerificationModalProps {
  open: boolean;
  onVerified: () => void;
}

const AgeVerificationModal = ({ open, onVerified }: AgeVerificationModalProps) => {
  const [isChecked, setIsChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!isChecked) {
      toast.error('Anda harus menyetujui bahwa Anda berusia 18+ untuk melanjutkan');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ age_verified: true })
        .eq('id', (await supabase.auth.getUser()).data.user?.id);

      if (error) throw error;

      onVerified();
      toast.success('Verifikasi usia berhasil');
    } catch (error) {
      toast.error('Gagal memverifikasi usia');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-center">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
            Verifikasi Usia
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-center">
          <p className="text-muted-foreground">
            Konten di platform ini mungkin mengandung materi dewasa. 
            Anda harus berusia minimal 18 tahun untuk mengakses konten ini.
          </p>

          <div className="flex items-center space-x-2 justify-center">
            <Checkbox
              id="age-verify"
              checked={isChecked}
              onCheckedChange={(checked) => setIsChecked(checked === true)}
            />
            <Label 
              htmlFor="age-verify" 
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Saya berusia 18 tahun atau lebih
            </Label>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => window.history.back()}
            >
              Batal
            </Button>
            <Button 
              variant="hero" 
              className="flex-1"
              onClick={handleVerify}
              disabled={!isChecked || loading}
            >
              {loading ? 'Memverifikasi...' : 'Verifikasi'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AgeVerificationModal;