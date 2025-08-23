import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Lock, Check, X } from 'lucide-react';
import { toast } from 'sonner';

export const ChangePasswordForm = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePassword(newPassword)) {
      toast.error('Password baru minimal 6 karakter');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Konfirmasi password tidak cocok');
      return;
    }

    if (currentPassword === newPassword) {
      toast.error('Password baru harus berbeda dengan password lama');
      return;
    }

    setLoading(true);

    try {
      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      toast.success('Password berhasil diubah!');
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast.error(error.message || 'Gagal mengubah password');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 6) strength += 25;
    if (password.match(/[a-z]/)) strength += 25;
    if (password.match(/[A-Z]/)) strength += 25;
    if (password.match(/[0-9]/)) strength += 25;
    return strength;
  };

  const getStrengthColor = (strength: number) => {
    if (strength < 25) return 'bg-destructive';
    if (strength < 50) return 'bg-yellow-500';
    if (strength < 75) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStrengthText = (strength: number) => {
    if (strength < 25) return 'Lemah';
    if (strength < 50) return 'Cukup';
    if (strength < 75) return 'Baik';
    return 'Kuat';
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Ganti Password
        </h3>
        <p className="text-muted-foreground text-sm">
          Pastikan password baru Anda kuat dan mudah diingat.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Current Password */}
        <div className="space-y-2">
          <Label htmlFor="current-password" className="text-foreground">
            Password Saat Ini
          </Label>
          <div className="relative">
            <Input
              id="current-password"
              type={showCurrentPassword ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="pr-10"
              placeholder="Masukkan password saat ini"
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            >
              {showCurrentPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
        </div>

        {/* New Password */}
        <div className="space-y-2">
          <Label htmlFor="new-password" className="text-foreground">
            Password Baru
          </Label>
          <div className="relative">
            <Input
              id="new-password"
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="pr-10"
              placeholder="Masukkan password baru"
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowNewPassword(!showNewPassword)}
            >
              {showNewPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
          
          {/* Password Strength Indicator */}
          {newPassword && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Kekuatan Password:</span>
                <span className={`font-medium ${
                  passwordStrength(newPassword) >= 75 ? 'text-green-600' : 
                  passwordStrength(newPassword) >= 50 ? 'text-blue-600' :
                  passwordStrength(newPassword) >= 25 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {getStrengthText(passwordStrength(newPassword))}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${getStrengthColor(passwordStrength(newPassword))}`}
                  style={{ width: `${passwordStrength(newPassword)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <Label htmlFor="confirm-password" className="text-foreground">
            Konfirmasi Password Baru
          </Label>
          <div className="relative">
            <Input
              id="confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pr-10"
              placeholder="Ulangi password baru"
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
          
          {/* Password Match Indicator */}
          {confirmPassword && (
            <div className="flex items-center gap-2 text-sm">
              {newPassword === confirmPassword ? (
                <>
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-green-600">Password cocok</span>
                </>
              ) : (
                <>
                  <X className="w-4 h-4 text-red-600" />
                  <span className="text-red-600">Password tidak cocok</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Password Requirements */}
        <div className="bg-muted/30 rounded-lg p-3 sm:p-4">
          <h4 className="font-medium text-foreground mb-2 flex items-center gap-2 text-sm sm:text-base">
            <Lock className="w-4 h-4" />
            Persyaratan Password:
          </h4>
          <ul className="text-xs sm:text-sm text-muted-foreground space-y-1">
            <li className={`flex items-center gap-2 ${newPassword.length >= 6 ? 'text-green-600' : ''}`}>
              {newPassword.length >= 6 ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
              Minimal 6 karakter
            </li>
            <li className={`flex items-center gap-2 ${newPassword.match(/[a-z]/) ? 'text-green-600' : ''}`}>
              {newPassword.match(/[a-z]/) ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
              Mengandung huruf kecil
            </li>
            <li className={`flex items-center gap-2 ${newPassword.match(/[A-Z]/) ? 'text-green-600' : ''}`}>
              {newPassword.match(/[A-Z]/) ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
              Mengandung huruf besar
            </li>
            <li className={`flex items-center gap-2 ${newPassword.match(/[0-9]/) ? 'text-green-600' : ''}`}>
              {newPassword.match(/[0-9]/) ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
              Mengandung angka
            </li>
          </ul>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full gap-2 shadow-glow"
          disabled={loading || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent" />
              Mengubah Password...
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              Ubah Password
            </>
          )}
        </Button>
      </form>
    </div>
  );
};