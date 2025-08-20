import React from 'react';
import { AdBanner } from './AdBanner';
import { AdCard } from './AdCard';
import { cn } from '@/lib/utils';
import { useAds } from '@/hooks/useAds';
import { useAuth } from '@/hooks/useAuth';

interface AdContainerProps {
  position: 'header' | 'content' | 'sidebar' | 'footer' | 'banner';
  size: 'banner' | 'rectangle' | 'leaderboard' | 'skyscraper';
  className?: string;
  placeholder?: boolean;
}

export const AdContainer: React.FC<AdContainerProps> = ({
  position,
  size,
  className,
  placeholder = true // Default to placeholder during development
}) => {
  const { getActiveAds, settings, isLoading } = useAds();
  const { user } = useAuth();

  const containerClasses = {
    header: "w-full flex justify-center py-4",
    content: "w-full flex justify-center",
    sidebar: "sticky top-4",
    footer: "w-full flex justify-center py-4",
    banner: "w-full flex justify-center py-2"
  };

  // Check if ads should be displayed
  if (isLoading) return null;
  
  if (!settings.ads_enabled) return null;
  
  if (!user && !settings.show_ads_to_guests) return null;
  
  if (user && !settings.show_ads_to_users) return null;

  const ads = getActiveAds(position, size);
  
  if (ads.length === 0 && !placeholder) return null;
  
  const renderAd = () => {
    // If there are real ads, show the first one
    if (ads.length > 0) {
      const ad = ads[0];
      return <AdBanner size={size} ad={ad} />;
    }
    
    // Show placeholder if requested and no real ads
    if (placeholder) {
      return <AdBanner size={size} placeholder={placeholder} />;
    }
    
    return null;
  };

  return (
    <div className={cn(containerClasses[position], className)}>
      {renderAd()}
    </div>
  );
};