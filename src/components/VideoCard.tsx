import { Play, Clock, Eye, MoreHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface VideoCardProps {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  views: string;
  creator: string;
  category: string;
  fileCode?: string;
}

const VideoCard = ({ id, title, thumbnail, duration, views, creator, fileCode }: VideoCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showFullTitle, setShowFullTitle] = useState(false);
  const [currentImageSrc, setCurrentImageSrc] = useState(
    thumbnail || (fileCode ? `https://img.doodcdn.io/snaps/${fileCode}.jpg` : '/placeholder.svg')
  );
  return (
    <Link to={`/video/${id}`}>
      <div className="group relative bg-gradient-card rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-video cursor-pointer h-full flex flex-col">
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden bg-muted flex-shrink-0">
          {!imageLoaded && !imageError && (
            <Skeleton className="w-full h-full absolute inset-0" />
          )}
          
          <img
            src={currentImageSrc}
            alt={`${title} - Video streaming di DINO18 oleh ${creator}`}
            className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-110 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            loading="lazy"
            onLoad={() => {
              setImageLoaded(true);
              console.log(`Thumbnail loaded successfully: ${currentImageSrc}`);
            }}
            onError={(e) => {
              console.error(`Failed to load thumbnail: ${currentImageSrc}`);
              const currentSrc = e.currentTarget.src;
              
              if (currentSrc.includes('doodcdn.com') && fileCode) {
                // Try alternative Doodstream formats
                const newSrc = `https://img.doodcdn.co/splash/${fileCode}.jpg`;
                console.log(`Trying alternative format: ${newSrc}`);
                setCurrentImageSrc(newSrc);
                e.currentTarget.src = newSrc;
              } else if (!currentSrc.includes('placeholder.svg')) {
                // Final fallback to placeholder
                console.log('Using placeholder fallback');
                setCurrentImageSrc('/placeholder.svg');
                e.currentTarget.src = '/placeholder.svg';
                setImageError(true);
                setImageLoaded(true);
              }
            }}
          />
          
          {imageError && (
            <div className="absolute inset-0 bg-muted flex items-center justify-center">
              <div className="text-muted-foreground text-xs text-center p-4">
                <Play className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No Preview</p>
              </div>
            </div>
          )}
          
          {/* Play Overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="w-16 h-16 bg-primary/90 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Play className="w-6 h-6 text-white ml-1" fill="white" />
            </div>
          </div>

          {/* Duration */}
          <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm text-white text-xs px-2 py-1 rounded flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {duration}
          </div>
        </div>

        {/* Content */}
        <div className="p-3 flex-1 flex flex-col min-h-[100px]">
          <div className="flex-1 mb-3">
            <div className="relative">
              <h3 className="text-white font-medium text-sm leading-tight group-hover:text-primary transition-colors duration-200">
                {(() => {
                  const maxLength = 60;
                  if (title.length <= maxLength) return title;
                  
                  const truncatedTitle = title.substring(0, maxLength) + "...";
                  return showFullTitle ? title : truncatedTitle;
                })()}
              </h3>
              {title.length > 60 && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowFullTitle(!showFullTitle);
                  }}
                  className="text-primary hover:text-primary/80 transition-colors text-xs mt-1 flex items-center gap-1"
                >
                  <MoreHorizontal className="w-3 h-3" />
                  {showFullTitle ? "Lebih sedikit" : "Selengkapnya"}
                </button>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between text-muted-foreground text-xs mt-auto">
            <span className="hover:text-primary transition-colors cursor-pointer truncate max-w-[70%]">
              {creator}
            </span>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Eye className="w-3 h-3" />
              <span className="text-xs">{views}</span>
            </div>
          </div>
        </div>

        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-xl" />
      </div>
    </Link>
  );
};

export default VideoCard;