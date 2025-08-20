import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface Ad {
  id: string;
  title: string;
  image_url: string;
  link_url?: string;
  position: string;
  size: string;
  is_active: boolean;
  sort_order: number;
}

interface AdBannerProps {
  size: 'banner' | 'rectangle' | 'leaderboard' | 'skyscraper';
  className?: string;
  placeholder?: boolean;
  ad?: Ad;
}

const adSizes = {
  banner: { width: 728, height: 70 },
  rectangle: { width: 300, height: 70 },
  leaderboard: { width: 728, height: 70 },
  skyscraper: { width: 160, height: 70 }
};

export const AdBanner: React.FC<AdBannerProps> = ({ 
  size, 
  className,
  placeholder = false,
  ad
}) => {
  const adRef = useRef<HTMLDivElement>(null);
  const { width, height } = adSizes[size];

  useEffect(() => {
    if (!placeholder && !ad && adRef.current) {
      // Initialize Google AdSense here
      try {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (err) {
        console.error('AdSense error:', err);
      }
    }
  }, [placeholder, ad]);

  // Show real ad if available
  if (ad) {
    const AdContent = () => (
      <img 
        src={ad.image_url} 
        alt={ad.title}
        className="w-full h-full object-cover"
      />
    );

    return (
      <div 
        className={cn("overflow-hidden rounded-lg cursor-pointer", className)}
        style={{ width, height }}
        onClick={() => ad.link_url && window.open(ad.link_url, '_blank')}
      >
        <AdContent />
      </div>
    );
  }

  if (placeholder) {
    return (
      <div 
        className={cn(
          "bg-muted border-2 border-dashed border-muted-foreground/20 rounded-lg flex items-center justify-center text-muted-foreground text-sm",
          className
        )}
        style={{ width, height }}
      >
        <div className="text-center">
          <div className="font-medium">Sponsored Content</div>
          <div className="text-xs opacity-60">{width} x {height}</div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={adRef}
      className={cn("overflow-hidden rounded-lg", className)}
      style={{ width, height }}
    >
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width, height }}
        data-ad-client="ca-pub-xxxxxxxxxxxxxxxxxx" // Replace with your AdSense client ID
        data-ad-slot="xxxxxxxxxx" // Replace with your ad slot ID
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
};