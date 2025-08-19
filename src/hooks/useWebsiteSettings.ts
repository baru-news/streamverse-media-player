import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface WebsiteSetting {
  setting_key: string;
  setting_value: string;
  setting_type: string;
}

export const useWebsiteSettings = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('website_settings')
        .select('setting_key, setting_value, setting_type');

      if (error) throw error;

      const settingsMap = data?.reduce((acc, setting) => {
        acc[setting.setting_key] = setting.setting_value || '';
        return acc;
      }, {} as Record<string, string>) || {};

      setSettings(settingsMap);

      // Update document title and favicon if available
      if (settingsMap.site_title) {
        document.title = settingsMap.site_title;
      }

      if (settingsMap.favicon_url) {
        let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.getElementsByTagName('head')[0].appendChild(link);
        }
        link.href = settingsMap.favicon_url;
      }

    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async (key: string, value: string) => {
    try {
      const { error } = await supabase
        .from('website_settings')
        .upsert({ setting_key: key, setting_value: value });

      if (error) throw error;

      // Update local state
      setSettings(prev => ({ ...prev, [key]: value }));

      // Update document title or favicon if these settings were changed
      if (key === 'site_title' && value) {
        document.title = value;
      }

      if (key === 'favicon_url' && value) {
        let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.getElementsByTagName('head')[0].appendChild(link);
        }
        link.href = value;
      }

    } catch (error) {
      console.error('Failed to update setting:', error);
      throw error;
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return {
    settings,
    isLoading,
    updateSetting,
    loadSettings,
  };
};