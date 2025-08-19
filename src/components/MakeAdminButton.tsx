import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const MakeAdminButton = () => {
  const [loading, setLoading] = useState(false);
  const { user, isAdmin } = useAuth();

  const handleMakeAdmin = async () => {
    if (!user) {
      toast.error('Anda harus login terlebih dahulu');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('assign-admin', {
        body: {
          userId: user.id,
          action: 'assign'
        }
      });

      if (error) {
        console.error('Error making admin:', error);
        toast.error('Gagal menjadi admin');
        return;
      }

      if (data?.isFirstAdmin) {
        toast.success('Selamat! Anda adalah admin pertama sistem ini');
      } else {
        toast.success('Berhasil menjadi admin');
      }

      // Refresh the page to update the UI
      window.location.reload();

    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('Terjadi kesalahan tidak terduga');
    } finally {
      setLoading(false);
    }
  };

  // Don't show button if user is already admin
  if (isAdmin) {
    return null;
  }

  return (
    <Button
      onClick={handleMakeAdmin}
      disabled={loading}
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
    >
      <Shield className="w-4 h-4" />
      {loading ? 'Memproses...' : 'Jadikan Admin'}
    </Button>
  );
};

export default MakeAdminButton;