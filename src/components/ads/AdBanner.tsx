import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface Ad {
  id: string;
  title: string;
  image_url: string;
  link_url?: string;
  position: string;
  is_active: boolean;
  sort_order: number;
}

interface AdBannerProps {
  className?: string;
  placeholder?: boolean;
  ad?: Ad;
}

const AdBanner: React.FC<AdBannerProps> = ({ 
  className,
  placeholder = false,
  ad
}) => {
  const adRef = useRef<HTMLDivElement>(null);
  // Responsive ad size
  const width = ad ? 'auto' : 300;
  const height = ad ? 'auto' : 70;

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
        className="w-full h-auto object-contain max-h-[70px]"
      />
    );

    return (
      <div 
        className={cn("overflow-hidden rounded-lg cursor-pointer max-w-sm mx-auto", className)}
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
          "bg-muted border-2 border-dashed border-muted-foreground/20 rounded-lg flex items-center justify-center text-muted-foreground text-sm max-w-sm mx-auto",
          className
        )}
        style={{ width: 300, height: 70 }}
      >
        <div className="text-center">
          <div className="font-medium">Sponsored Content</div>
          <div className="text-xs opacity-60">300 x 70</div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={adRef}
      className={cn("overflow-hidden rounded-lg max-w-sm mx-auto", className)}
      style={{ width: 300, height: 70 }}
    >
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: 300, height: 70 }}
        data-ad-client="ca-pub-xxxxxxxxxxxxxxxxxx" // Replace with your AdSense client ID
        data-ad-slot="xxxxxxxxxx" // Replace with your ad slot ID
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
};

export { AdBanner };