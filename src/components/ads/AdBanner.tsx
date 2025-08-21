import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { loadImageWithRetry, createFallbackImage } from '@/lib/image-utils';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error' | 'retry'>('loading');
  const [imageSrc, setImageSrc] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);
  
  // Responsive ad size
  const width = ad ? 'auto' : 300;
  const height = ad ? 'auto' : 70;

  useEffect(() => {
    if (ad?.image_url) {
      loadAdImage(ad.image_url);
    } else if (!placeholder && !ad && adRef.current) {
      // Initialize Google AdSense here
      try {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (err) {
        console.error('AdSense error:', err);
      }
    }
  }, [ad?.image_url, placeholder, ad]);

  const loadAdImage = async (url: string) => {
    setImageState('loading');
    try {
      const result = await loadImageWithRetry(url, 3, 1000);
      if (result.success) {
        setImageSrc(url);
        setImageState('loaded');
      } else {
        console.warn('Failed to load ad image:', url, result.error);
        setImageState('error');
        setImageSrc(createFallbackImage(300, 70, 'Konten Tidak Tersedia'));
      }
    } catch (error) {
      console.error('Error loading ad image:', error);
      setImageState('error');
      setImageSrc(createFallbackImage(300, 70, 'Error Loading Image'));
    }
  };

  const handleRetry = () => {
    if (ad?.image_url && retryCount < 2) {
      setRetryCount(prev => prev + 1);
      setImageState('retry');
      loadAdImage(ad.image_url);
    }
  };

  // Show real ad if available
  if (ad) {
    return (
      <div 
        className={cn("overflow-hidden rounded-lg max-w-sm mx-auto", className)}
      >
        {imageState === 'loading' && (
          <div 
            className="bg-muted border border-muted-foreground/20 rounded-lg flex items-center justify-center animate-pulse"
            style={{ width: 300, height: 70 }}
          >
            <div className="text-muted-foreground text-xs">Loading...</div>
          </div>
        )}
        
        {(imageState === 'loaded' || imageState === 'error') && (
          <div 
            className={cn(
              "cursor-pointer transition-opacity hover:opacity-90",
              imageState === 'error' && "relative"
            )}
            onClick={() => imageState === 'loaded' && ad.link_url && window.open(ad.link_url, '_blank')}
          >
            <img 
              src={imageSrc} 
              alt={ad.title}
              className="w-full h-auto object-contain max-h-[70px]"
              style={{ width: 300, height: 70 }}
            />
            {imageState === 'error' && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRetry();
                  }}
                  className="text-white hover:bg-white/20"
                  disabled={retryCount >= 2}
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  {retryCount >= 2 ? 'Failed' : 'Retry'}
                </Button>
              </div>
            )}
          </div>
        )}
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