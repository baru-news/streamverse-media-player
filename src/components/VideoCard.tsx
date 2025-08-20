import { Play, Clock, Eye, MoreHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import FavoriteButton from "@/components/FavoriteButton";

interface VideoCardProps {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  views: string;
  creator: string;
  category: string;
  fileCode?: string;
  videoId?: string; // Add actual database video ID
}

const VideoCard = ({ id, title, thumbnail, duration, views, creator, fileCode, videoId }: VideoCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showFullTitle, setShowFullTitle] = useState(false);
  const [currentImageSrc, setCurrentImageSrc] = useState(
    thumbnail || (fileCode ? `https://agsqdznjjxptiyorljtv.supabase.co/functions/v1/thumbnail-proxy?fileCode=${fileCode}` : '/placeholder.svg')
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
              
              // If we're currently using the database thumbnail and it fails, try proxy
              if (thumbnail && currentSrc === thumbnail && fileCode) {
                const proxyUrl = `https://agsqdznjjxptiyorljtv.supabase.co/functions/v1/thumbnail-proxy?fileCode=${fileCode}`;
                console.log(`Database thumbnail failed, trying proxy: ${proxyUrl}`);
                setCurrentImageSrc(proxyUrl);
                e.currentTarget.src = proxyUrl;
              } else if (currentSrc.includes('thumbnail-proxy') && fileCode) {
                // If proxy fails, try direct doodcdn.io URL
                const directUrl = `https://img.doodcdn.io/snaps/${fileCode}.jpg`;
                console.log(`Proxy failed, trying direct URL: ${directUrl}`);
                setCurrentImageSrc(directUrl);
                e.currentTarget.src = directUrl;
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
              <Play className="w-6 h-6 text-foreground ml-1" fill="currentColor" />
            </div>
          </div>

          {/* Duration */}
          <div className="absolute bottom-2 right-2 bg-primary/80 backdrop-blur-sm text-background text-xs px-2 py-1 rounded flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {duration}
          </div>

          {/* Favorite Button */}
          <div className="absolute top-2 right-2">
            <FavoriteButton 
              videoId={videoId || id} 
              variant="minimal"
              className="bg-black/60 backdrop-blur-sm hover:bg-black/80"
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-2 sm:p-3 flex-1 flex flex-col">
          <div className="mb-2 sm:mb-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className={`text-foreground font-medium text-xs sm:text-sm leading-tight group-hover:text-primary transition-colors duration-200 flex-1 ${
                showFullTitle ? '' : 'line-clamp-2 sm:line-clamp-3'
              }`}>
                {title}
              </h3>
              {title.length > 40 && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowFullTitle(!showFullTitle);
                  }}
                  className="text-primary hover:text-primary/80 transition-colors text-[10px] sm:text-xs flex items-center gap-0.5 bg-black/60 backdrop-blur-sm px-1 py-0.5 sm:px-1.5 sm:py-0.5 rounded flex-shrink-0 self-start"
                >
                  <MoreHorizontal className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  <span className="hidden sm:inline">{showFullTitle ? "Tutup" : "Baca"}</span>
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