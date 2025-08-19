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
  const [useCustomThumbnail, setUseCustomThumbnail] = useState(false);
  
  // Generate smart placeholder with video info
  const generatePlaceholder = () => {
    const words = title.split(' ');
    const initials = words.slice(0, 2).map(word => word.charAt(0).toUpperCase()).join('');
    const colors = [
      'from-blue-500 to-purple-600',
      'from-green-500 to-teal-600', 
      'from-red-500 to-pink-600',
      'from-yellow-500 to-orange-600',
      'from-indigo-500 to-blue-600'
    ];
    const colorIndex = title.length % colors.length;
    
    return (
      <div className={`w-full h-full bg-gradient-to-br ${colors[colorIndex]} flex flex-col items-center justify-center text-white relative`}>
        <div className="text-2xl font-bold mb-2">{initials}</div>
        <div className="text-xs text-center px-2 opacity-90 line-clamp-2">{title}</div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 border-2 border-white/30 rounded-full flex items-center justify-center">
            <Play className="h-8 w-8 ml-1" fill="currentColor" />
          </div>
        </div>
      </div>
    );
  };
  return (
    <Link to={`/video/${id}`}>
      <div className="group relative bg-gradient-card rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-video cursor-pointer">
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden bg-muted">
          {thumbnail && !useCustomThumbnail ? (
            <img
              src={thumbnail}
              alt={title}
              className="w-full h-full object-cover transition-all duration-300 group-hover:scale-110"
              onError={() => {
                console.log(`Custom thumbnail failed, using generated placeholder for: ${title}`);
                setUseCustomThumbnail(true);
              }}
            />
          ) : (
            generatePlaceholder()
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