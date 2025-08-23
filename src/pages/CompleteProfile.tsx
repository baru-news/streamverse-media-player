import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, CheckCircle, User } from 'lucide-react';
import SEO from '@/components/SEO';

const CompleteProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  // Generate suggested username from email
  const suggestedUsername = user?.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';

  const validateUsername = (username: string) => {
    if (!username.trim()) {
      return 'Username harus diisi';
    }
    if (username.length < 3) {
      return 'Username minimal 3 karakter';
    }
    if (username.length > 20) {
      return 'Username maksimal 20 karakter';
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return 'Username hanya boleh mengandung huruf, angka, dan underscore';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const validationError = validateUsername(username);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setLoading(true);
    
    try {
      // Check if username already exists
      const { data: usernameExists, error: checkError } = await supabase
        .rpc('check_username_exists', { username_input: username.trim().toLowerCase() });
        
      if (checkError) {
        console.error('Error checking username:', checkError);
        toast.error('Terjadi kesalahan saat memeriksa username');
        return;
      }
        
      if (usernameExists) {
        toast.error('Username sudah digunakan. Silakan pilih username lain.');
        return;
      }

      // Update profile with username and mark as complete
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          username: username.trim().toLowerCase(),
          profile_complete: true 
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        toast.error('Gagal memperbarui profil. Silakan coba lagi.');
        return;
      }

      toast.success('Profil berhasil dilengkapi! Selamat datang!');
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Complete profile error:', error);
      toast.error('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      // Generate a random username based on email
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const autoUsername = `${suggestedUsername}_${randomSuffix}`;
      
      // Update profile with auto-generated username
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          username: autoUsername,
          profile_complete: true 
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error auto-generating username:', updateError);
        toast.error('Gagal membuat username otomatis. Silakan coba lagi.');
        return;
      }

      toast.success('Username otomatis dibuat! Anda dapat mengubahnya nanti di profil.');
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Skip profile error:', error);
      toast.error('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const fillSuggested = () => {
    setUsername(suggestedUsername);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <SEO 
        title="Lengkapi Profil"
        description="Lengkapi profil Anda dengan memilih username"
      />
      
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <User className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Tinggal Satu Langkah Lagi!</CardTitle>
          <CardDescription>
            Pilih username untuk melengkapi profil Anda
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-muted/30 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Akun Google berhasil terhubung</span>
            </div>
            <p className="text-sm mt-1 font-medium">{user?.email}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="space-y-2">
                <Input
                  id="username"
                  type="text"
                  placeholder="Pilih username unik Anda"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  disabled={loading}
                  className="w-full"
                />
                {suggestedUsername && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={fillSuggested}
                    disabled={loading}
                    className="text-xs"
                  >
                    Gunakan "{suggestedUsername}"
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Username hanya boleh mengandung huruf, angka, dan underscore (_)
              </p>
            </div>

            <div className="space-y-3">
              <Button
                type="submit"
                className="w-full"
                disabled={loading || !username.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Lanjutkan dengan Username Ini'
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={handleSkip}
                disabled={loading}
                className="w-full text-sm"
              >
                Lewati (Buatkan Username Otomatis)
              </Button>
            </div>
          </form>

          <div className="text-xs text-center text-muted-foreground">
            Anda dapat mengubah username ini kapan saja di halaman profil
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompleteProfile;