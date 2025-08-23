import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Upload, Camera, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export const ProfilePhotoUpload = () => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>('');

  useEffect(() => {
    const loadAvatar = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single();
      
      if (data?.avatar_url) {
        setAvatarUrl(data.avatar_url);
      }
    };

    loadAvatar();
  }, [user]);

  const getInitials = (email: string) => {
    return email.split('@')[0].substring(0, 2).toUpperCase();
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Pilih file untuk diupload.');
      }

      const file = event.target.files[0];
      
      // Basic client-side validation (server will do comprehensive validation)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Ukuran file maksimal 5MB');
      }

      if (!file.type.startsWith('image/')) {
        throw new Error('File harus berupa gambar');
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Format file tidak didukung. Gunakan JPG, PNG, atau WebP');
      }

      // Create FormData for secure upload
      const formData = new FormData();
      formData.append('file', file);

      // Upload via secure edge function
      const { data, error } = await supabase.functions.invoke('secure-avatar-upload', {
        body: formData,
      });

      if (error) {
        throw new Error(error.message || 'Upload gagal');
      }

      if (!data.success) {
        throw new Error(data.error || 'Upload gagal');
      }

      setAvatarUrl(data.avatar_url);
      toast.success('Foto profil berhasil diupload dan disanitasi!');
      
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      if (error.message.includes('Rate limit')) {
        toast.error('Terlalu banyak upload. Coba lagi dalam 1 jam.');
      } else if (error.message.includes('Invalid file format')) {
        toast.error('Format file tidak valid. Pastikan file adalah gambar yang sah.');
      } else {
        toast.error(error.message || 'Gagal mengupload foto');
      }
    } finally {
      setUploading(false);
    }
  };

  const removeAvatar = async () => {
    try {
      setUploading(true);
      
      if (!user?.id) return;
      
      // Get current avatar URL to extract the secure filename
      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single();
      
      if (profile?.avatar_url) {
        // Extract the file path from the URL
        const pathParts = profile.avatar_url.split('/avatars/');
        if (pathParts.length > 1) {
          const filePath = pathParts[1];
          
          const { error } = await supabase.storage
            .from('avatars')
            .remove([filePath]);

          if (error) {
            console.log('File removal failed (may not exist):', error);
          }
        }
      }

      // Update profiles table to remove avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setAvatarUrl('');
      toast.success('Foto profil berhasil dihapus');
      
    } catch (error: any) {
      console.error('Avatar removal error:', error);
      toast.error(error.message || 'Gagal menghapus foto profil');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Foto Profil
        </h3>
        <p className="text-muted-foreground text-sm">
          Upload foto profil Anda. Maksimal 5MB, format JPG atau PNG.
        </p>
      </div>

      <div className="flex flex-col items-center space-y-6">
        {/* Current Avatar */}
        <div className="relative">
          <Avatar className="w-32 h-32 border-4 border-primary/20 shadow-glow">
            <AvatarImage src={avatarUrl} alt="Profile" />
            <AvatarFallback className="bg-gradient-primary text-primary-foreground text-2xl font-bold">
              {getInitials(user?.email || '')}
            </AvatarFallback>
          </Avatar>
          
          {avatarUrl && (
            <Button
              size="sm"
              variant="destructive"
              className="absolute -top-2 -right-2 rounded-full w-8 h-8 p-0"
              onClick={removeAvatar}
              disabled={uploading}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Upload Controls */}
        <div className="flex flex-col xs:flex-row gap-3 sm:gap-4 w-full max-w-sm">
          <div className="relative flex-1">
            <input
              type="file"
              id="avatar-upload"
              accept="image/*"
              onChange={uploadAvatar}
              disabled={uploading}
              className="hidden"
            />
            <Button
              asChild
              className="gap-2 shadow-glow w-full"
              disabled={uploading}
            >
              <label htmlFor="avatar-upload" className="cursor-pointer">
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent" />
                    <span className="hidden xs:inline">Uploading...</span>
                    <span className="xs:hidden">Upload...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span className="hidden xs:inline">Upload Foto</span>
                    <span className="xs:hidden">Upload</span>
                  </>
                )}
              </label>
            </Button>
          </div>
          
          <Button
            variant="outline" 
            className="gap-2 flex-1 xs:flex-initial"
            onClick={() => document.getElementById('avatar-upload')?.click()}
            disabled={uploading}
          >
            <Camera className="w-4 h-4" />
            <span className="hidden xs:inline">Pilih Gambar</span>
            <span className="xs:hidden">Pilih</span>
          </Button>
        </div>

        {/* Upload Tips */}
        <div className="bg-muted/30 rounded-lg p-4 w-full max-w-md">
          <h4 className="font-medium text-foreground mb-2">Keamanan & Tips:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• ✅ File divalidasi & disanitasi otomatis</li>
            <li>• ✅ Metadata berbahaya dihapus</li>
            <li>• ✅ Format JPG, PNG, WebP saja</li>
            <li>• ✅ Maksimal 5MB, limit 5x per jam</li>
            <li>• ✅ Resolusi minimal 200x200px</li>
          </ul>
        </div>
      </div>
    </div>
  );
};