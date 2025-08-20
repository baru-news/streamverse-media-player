import React from 'react';
import { cn } from '@/lib/utils';

interface AdCardProps {
  size: 'small' | 'medium' | 'large';
  className?: string;
  placeholder?: boolean;
}

const adCardSizes = {
  small: { width: 180, height: 150 },
  medium: { width: 300, height: 250 },
  large: { width: 350, height: 280 }
};

export const AdCard: React.FC<AdCardProps> = ({ 
  size, 
  className,
  placeholder = true 
}) => {
  const { width, height } = adCardSizes[size];

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