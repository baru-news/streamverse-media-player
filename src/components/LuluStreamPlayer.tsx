import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, ExternalLink, Loader2 } from "lucide-react";
import { getLuluStreamEmbedUrl } from "@/lib/supabase-lulustream";
import { useWatchTime } from "@/hooks/useWatchTime";

interface LuluStreamPlayerProps {
  fileCode: string;
  title?: string;
  videoId?: string;
  width?: number;
  height?: number;
  autoplay?: boolean;
  className?: string;
}

export function LuluStreamPlayer({
  fileCode,
  title = "Video",
  videoId,
  width = 800,
  height = 450,
  autoplay = false,
  className = ""
}: LuluStreamPlayerProps) {
  const [showPlayer, setShowPlayer] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  const { watchTime, formatWatchTime, isTracking } = useWatchTime(videoId);
  
  const embedUrl = getLuluStreamEmbedUrl(fileCode, autoplay);
  const directUrl = `https://lulustream.com/${fileCode}.html`;

  useEffect(() => {
    setShowPlayer(false);
    setHasError(false);
    setIsLoading(false);
  }, [fileCode]);

  const handleLoadPlayer = () => {
    setIsLoading(true);
    setShowPlayer(true);
    setHasError(false);
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const openInNewTab = () => {
    window.open(directUrl, '_blank', 'noopener,noreferrer');
  };

  if (hasError) {
    return (
      <div className={`bg-muted rounded-lg ${className}`} style={{ width, height }}>
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <p className="text-muted-foreground mb-4">
            Unable to load video player
          </p>
          <div className="flex gap-2">
            <Button onClick={handleLoadPlayer} variant="outline">
              Try Again
            </Button>
            <Button onClick={openInNewTab} variant="outline">
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Video
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!showPlayer) {
    return (
      <div className={`bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg border ${className}`} style={{ width, height }}>
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <div className="bg-primary/20 p-4 rounded-full mb-4">
            <Play className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2 text-foreground">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Click to load LuluStream player
          </p>
          <div className="flex gap-2">
            <Button onClick={handleLoadPlayer}>
              <Play className="w-4 h-4 mr-2" />
              Play Video
            </Button>
            <Button onClick={openInNewTab} variant="outline">
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in New Tab
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div 
          className="absolute inset-0 bg-muted rounded-lg flex items-center justify-center z-10"
          style={{ width, height }}
        >
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-sm text-muted-foreground">Loading player...</p>
          </div>
        </div>
      )}
      
      <iframe
        src={embedUrl}
        width={width}
        height={height}
        frameBorder="0"
        allowFullScreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        className="rounded-lg border bg-background"
        title={title}
      />
      
      <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>🎥 LuluStream</span>
          {isTracking && (
            <span>⏱️ Watch time: {formatWatchTime(watchTime)}</span>
          )}
        </div>
        <Button 
          onClick={openInNewTab} 
          variant="ghost" 
          size="sm"
          className="h-auto p-1 text-xs"
        >
          <ExternalLink className="w-3 h-3 mr-1" />
          Open in New Tab
        </Button>
      </div>
    </div>
  );
}