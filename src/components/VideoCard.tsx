import { Play, Clock, Eye } from "lucide-react";
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
  const [currentImageSrc, setCurrentImageSrc] = useState(
    thumbnail || (fileCode ? `https://img.doodcdn.com/snaps/${fileCode}.jpg` : '/placeholder.svg')
  );
  return (
    <Link to={`/video/${id}`}>
      <div className="group relative bg-gradient-card rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-video cursor-pointer">
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden bg-muted">
          {!imageLoaded && !imageError && (
            <Skeleton className="w-full h-full absolute inset-0" />
          )}
          
          <img
            src={currentImageSrc}
            alt={title}
            className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-110 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
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
        <div className="p-4">
          <h3 className="text-white font-semibold text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors duration-200">
            {title}
          </h3>
          
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span className="hover:text-primary transition-colors cursor-pointer">
              {creator}
            </span>
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {views}
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