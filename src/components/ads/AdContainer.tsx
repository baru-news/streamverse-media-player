import React from 'react';
import { AdBanner } from './AdBanner';
import { cn } from '@/lib/utils';

interface AdContainerProps {
  position: 'header' | 'content' | 'sidebar' | 'footer';
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
  const containerClasses = {
    header: "w-full flex justify-center py-4",
    content: "w-full flex justify-center my-6",
    sidebar: "sticky top-4",
    footer: "w-full flex justify-center py-4"
  };

  return (
    <div className={cn(containerClasses[position], className)}>
      <AdBanner size={size} placeholder={placeholder} />
    </div>
  );
};