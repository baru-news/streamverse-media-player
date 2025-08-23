import { useState } from 'react';
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
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Ukuran file maksimal 5MB');
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        throw new Error('File harus berupa gambar');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}_avatar.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      let { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
      toast.success('Foto profil berhasil diupload!');
      
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const removeAvatar = async () => {
    try {
      setUploading(true);
      
      if (!user?.id) return;
      
      const filePath = `avatars/${user.id}_avatar`;
      
      const { error } = await supabase.storage
        .from('avatars')
        .remove([filePath]);

      if (error) throw error;

      setAvatarUrl('');
      toast.success('Foto profil berhasil dihapus');
      
    } catch (error: any) {
      toast.error(error.message);
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
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
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
              className="gap-2 shadow-glow"
              disabled={uploading}
            >
              <label htmlFor="avatar-upload" className="cursor-pointer">
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload Foto
                  </>
                )}
              </label>
            </Button>
          </div>
          
          <Button
            variant="outline" 
            className="gap-2"
            onClick={() => document.getElementById('avatar-upload')?.click()}
            disabled={uploading}
          >
            <Camera className="w-4 h-4" />
            Pilih Gambar
          </Button>
        </div>

        {/* Upload Tips */}
        <div className="bg-muted/30 rounded-lg p-4 w-full max-w-md">
          <h4 className="font-medium text-foreground mb-2">Tips foto profil:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Gunakan foto dengan wajah yang jelas</li>
            <li>• Format JPG, PNG atau WebP</li>
            <li>• Maksimal ukuran 5MB</li>
            <li>• Resolusi minimal 200x200px</li>
          </ul>
        </div>
      </div>
    </div>
  );
};