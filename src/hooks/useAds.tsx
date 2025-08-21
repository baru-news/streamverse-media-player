import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { preloadImage } from "@/lib/image-utils";

interface Ad {
  id: string;
  title: string;
  image_url: string;
  link_url?: string;
  position: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface AdsSettings {
  ads_enabled: boolean;
  show_ads_to_guests: boolean;
  show_ads_to_users: boolean;
}

export const useAds = () => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [settings, setSettings] = useState<AdsSettings>({
    ads_enabled: true,
    show_ads_to_guests: true,
    show_ads_to_users: true,
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadAds = async () => {
    try {
      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      
      const adsData = data || [];
      setAds(adsData);
      
      // Preload active ad images for better performance
      const activeAds = adsData.filter(ad => ad.is_active && ad.image_url);
      if (activeAds.length > 0) {
        // Preload in background without blocking UI
        Promise.all(
          activeAds.map(ad => preloadImage(ad.image_url))
        ).then(results => {
          const successCount = results.filter(Boolean).length;
          console.log(`Preloaded ${successCount}/${activeAds.length} ad images`);
        }).catch(error => {
          console.warn('Ad image preloading failed:', error);
        });
      }
    } catch (error) {
      console.error('Error loading ads:', error);
      toast.error('Gagal memuat iklan');
    }
  };

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('ads_settings')
        .select('*');

      if (error) throw error;

      const settingsMap = data?.reduce((acc, setting) => {
        acc[setting.setting_key] = setting.setting_value === 'true';
        return acc;
      }, {} as Record<string, boolean>) || {};

      setSettings({
        ads_enabled: settingsMap.ads_enabled ?? true,
        show_ads_to_guests: settingsMap.show_ads_to_guests ?? true,
        show_ads_to_users: settingsMap.show_ads_to_users ?? true,
      });
    } catch (error) {
      console.error('Error loading ads settings:', error);
      toast.error('Gagal memuat pengaturan iklan');
    }
  };

  const updateSetting = async (key: string, value: boolean) => {
    try {
      const { error } = await supabase
        .from('ads_settings')
        .upsert({
          setting_key: key,
          setting_value: value.toString(),
        }, {
          onConflict: 'setting_key'
        });

      if (error) throw error;

      setSettings(prev => ({
        ...prev,
        [key]: value,
      }));

      toast.success('Pengaturan berhasil diperbarui');
    } catch (error) {
      console.error('Error updating setting:', error);
      toast.error('Gagal memperbarui pengaturan');
    }
  };

  const createAd = async (adData: Omit<Ad, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('ads')
        .insert([adData])
        .select()
        .single();

      if (error) throw error;

      setAds(prev => [...prev, data]);
      toast.success('Iklan berhasil ditambahkan');
      return data;
    } catch (error) {
      console.error('Error creating ad:', error);
      toast.error('Gagal menambahkan iklan');
      throw error;
    }
  };

  const updateAd = async (id: string, updates: Partial<Ad>) => {
    try {
      const { data, error } = await supabase
        .from('ads')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setAds(prev => prev.map(ad => ad.id === id ? data : ad));
      toast.success('Iklan berhasil diperbarui');
      return data;
    } catch (error) {
      console.error('Error updating ad:', error);
      toast.error('Gagal memperbarui iklan');
      throw error;
    }
  };

  const deleteAd = async (id: string) => {
    try {
      const { error } = await supabase
        .from('ads')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setAds(prev => prev.filter(ad => ad.id !== id));
      toast.success('Iklan berhasil dihapus');
    } catch (error) {
      console.error('Error deleting ad:', error);
      toast.error('Gagal menghapus iklan');
      throw error;
    }
  };

  const uploadAdImage = async (file: File) => {
    try {
      // Validate file type and size
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Format file tidak didukung. Gunakan JPEG, PNG, GIF, atau WebP.');
      }
      
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        throw new Error('File terlalu besar. Maksimal 2MB.');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `banners/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('ads')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error('Gagal mengupload ke storage: ' + uploadError.message);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('ads')
        .getPublicUrl(filePath);

      // Verify the uploaded image can be loaded
      const canLoad = await preloadImage(publicUrl);
      if (!canLoad) {
        console.warn('Uploaded image failed verification, but returning URL anyway');
      }

      return publicUrl;
    } catch (error) {
      console.error('Error uploading ad image:', error);
      const message = error instanceof Error ? error.message : 'Gagal mengupload gambar';
      toast.error(message);
      throw error;
    }
  };

  const getActiveAds = (position?: string) => {
    return ads.filter(ad => {
      if (!ad.is_active) return false;
      if (position && ad.position !== position) return false;
      return true;
    });
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([loadAds(), loadSettings()]);
      setIsLoading(false);
    };

    loadData();
  }, []);

  return {
    ads,
    settings,
    isLoading,
    loadAds,
    loadSettings,
    updateSetting,
    createAd,
    updateAd,
    deleteAd,
    getActiveAds,
    uploadAdImage,
  };
};