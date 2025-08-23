import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, AlertTriangle, Info } from 'lucide-react';
import { toast } from 'sonner';

export const ChangeEmailForm = () => {
  const { user } = useAuth();
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(newEmail)) {
      toast.error('Format email tidak valid');
      return;
    }

    if (newEmail === user?.email) {
      toast.error('Email baru harus berbeda dengan email saat ini');
      return;
    }

    setLoading(true);

    try {
      // Update email
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      });

      if (error) throw error;

      toast.success('Permintaan ganti email berhasil dikirim! Periksa email Anda untuk konfirmasi.');
      setNewEmail('');
      
    } catch (error: any) {
      console.error('Error updating email:', error);
      
      if (error.message.includes('email_address_invalid')) {
        toast.error('Format email tidak valid');
      } else if (error.message.includes('email_change_interval_violation')) {
        toast.error('Anda hanya dapat mengubah email setiap 24 jam');
      } else if (error.message.includes('signup_disabled')) {
        toast.error('Pendaftaran email baru sementara dinonaktifkan');
      } else {
        toast.error(error.message || 'Gagal mengubah email');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Ganti Email
        </h3>
        <p className="text-muted-foreground text-sm">
          Ubah alamat email yang terkait dengan akun Anda.
        </p>
      </div>

      {/* Current Email */}
      <div className="bg-muted/30 rounded-lg p-4">
        <Label className="text-foreground font-medium">Email Saat Ini:</Label>
        <div className="flex items-center gap-3 mt-2">
          <Mail className="w-5 h-5 text-primary" />
          <span className="text-foreground">{user?.email}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* New Email Input */}
        <div className="space-y-2">
          <Label htmlFor="new-email" className="text-foreground">
            Email Baru
          </Label>
          <div className="relative">
            <Input
              id="new-email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="pl-10"
              placeholder="masukkan@email-baru.com"
              required
            />
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          </div>
          
          {/* Email validation feedback */}
          {newEmail && !validateEmail(newEmail) && (
            <p className="text-sm text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Format email tidak valid
            </p>
          )}
          
          {newEmail && newEmail === user?.email && (
            <p className="text-sm text-yellow-600 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Email baru harus berbeda dengan email saat ini
            </p>
          )}
        </div>

        {/* Important Notice */}
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                Penting untuk diketahui:
              </h4>
              <ul className="space-y-1 text-blue-800 dark:text-blue-200">
                <li>• Email konfirmasi akan dikirim ke alamat email baru</li>
                <li>• Anda harus mengkonfirmasi melalui link di email tersebut</li>
                <li>• Email lama masih aktif sampai konfirmasi selesai</li>
                <li>• Proses ini dapat memakan waktu beberapa menit</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full gap-2 shadow-glow"
          disabled={loading || !newEmail || !validateEmail(newEmail) || newEmail === user?.email}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent" />
              Mengirim Permintaan...
            </>
          ) : (
            <>
              <Mail className="w-4 h-4" />
              Kirim Permintaan Ganti Email
            </>
          )}
        </Button>
      </form>

      {/* Additional Info */}
      <div className="bg-muted/30 rounded-lg p-3 sm:p-4">
        <h4 className="font-medium text-foreground mb-2 text-sm sm:text-base">Tips keamanan:</h4>
        <ul className="text-xs sm:text-sm text-muted-foreground space-y-1">
          <li>• Pastikan email baru masih dapat Anda akses</li>
          <li>• Periksa folder spam jika tidak menerima email konfirmasi</li>
          <li>• Jangan bagikan link konfirmasi kepada orang lain</li>
          <li>• Hubungi support jika mengalami masalah</li>
        </ul>
      </div>
    </div>
  );
};