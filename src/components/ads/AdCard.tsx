import React from 'react';
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

interface AdCardProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
  placeholder?: boolean;
  ad?: Ad;
}

const adCardSizes = {
  small: { width: 180, height: 150 },
  medium: { width: 300, height: 250 },
  large: { width: 350, height: 280 }
};

export const AdCard: React.FC<AdCardProps> = ({ 
  size = 'medium', 
  className,
  placeholder = true,
  ad
}) => {
  const { width, height } = adCardSizes[size];

  // Show real ad if available
  if (ad) {
    return (
      <div 
        className={cn(
          "bg-card border rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow",
          className
        )}
        style={{ width, height }}
        onClick={() => ad.link_url && window.open(ad.link_url, '_blank')}
      >
        <img 
          src={ad.image_url} 
          alt={ad.title}
          className="w-full h-3/4 object-cover"
        />
        <div className="p-3 h-1/4 flex items-center">
          <h3 className="font-medium text-sm line-clamp-2">{ad.title}</h3>
        </div>
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
      className={cn("overflow-hidden rounded-lg bg-card border", className)}
      style={{ width, height }}
    >
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width, height }}
        data-ad-client="ca-pub-xxxxxxxxxxxxxxxxxx"
        data-ad-slot="xxxxxxxxxx"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
};