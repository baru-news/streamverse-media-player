import { useState, useEffect } from "react";
import { Play, Loader2, AlertCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useWatchTime } from "@/hooks/useWatchTime";

interface DoodstreamPlayerProps {
  fileCode: string;
  title?: string;
  videoId?: string;
  width?: number;
  height?: number;
  autoplay?: boolean;
  className?: string;
}

const DoodstreamPlayer = ({ 
  fileCode, 
  title,
  videoId,
  width = 800, 
  height = 450, 
  autoplay = false,
  className = ""
}: DoodstreamPlayerProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const { watchTime, formatWatchTime, isTracking } = useWatchTime(videoId);

  const embedUrl = `https://dood.re/e/${fileCode}${autoplay ? '?autoplay=1' : ''}`;
  const directUrl = `https://dood.re/d/${fileCode}`;

  useEffect(() => {
    // Reset states when fileCode changes
    setIsLoading(true);
    setHasError(false);
    setShowPlayer(false);
  }, [fileCode]);

  const handleLoadPlayer = () => {
    setShowPlayer(true);
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

  return (
    <Card className={`overflow-hidden bg-black ${className}`}>
      <CardContent className="p-0">
        <div className="relative" style={{ paddingBottom: `${(height / width) * 100}%` }}>
          {!showPlayer ? (
            // Thumbnail/Preview
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <Play className="w-8 h-8 text-primary ml-1" />
                </div>
                <h3 className="text-foreground font-medium mb-4">
                  {title || 'Video Player'}
                </h3>
                <div className="space-y-2">
                  <Button 
                    onClick={handleLoadPlayer}
                    variant="hero"
                    size="lg"
                    className="gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Tonton Video
                  </Button>
                  <Button 
                    onClick={openInNewTab}
                    variant="outline"
                    size="sm"
                    className="gap-2 ml-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Buka di Tab Baru
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Loading Spinner */}
              {isLoading && (
                <div className="absolute inset-0 bg-black flex items-center justify-center z-10">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
                    <p className="text-foreground text-sm">Memuat video...</p>
                  </div>
                </div>
              )}

              {/* Error State */}
              {hasError && (
                <div className="absolute inset-0 bg-black flex items-center justify-center z-10">
                  <div className="text-center">
                    <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                    <p className="text-foreground text-sm mb-4">Gagal memuat video</p>
                    <div className="space-x-2">
                      <Button 
                        onClick={handleLoadPlayer}
                        variant="outline"
                        size="sm"
                      >
                        Coba Lagi
                      </Button>
                      <Button 
                        onClick={openInNewTab}
                        variant="hero"
                        size="sm"
                        className="gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Buka Langsung
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Doodstream Iframe */}
              <iframe
                src={embedUrl}
                className="absolute inset-0 w-full h-full"
                frameBorder="0"
                scrolling="no"
                allowFullScreen
                onLoad={handleIframeLoad}
                onError={handleIframeError}
                title={title || 'Doodstream Video Player'}
                style={{
                  border: 'none',
                  outline: 'none'
                }}
              />
            </>
          )}
        </div>

        {/* Video Info */}
        {showPlayer && (
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 backdrop-blur-sm p-4 border-t border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-foreground text-sm font-medium">
                  Streaming dari Doodstream
                </span>
                {isTracking && (
                  <span className="text-xs text-yellow-400">
                    Watch time: {formatWatchTime(watchTime)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  onClick={openInNewTab}
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-muted-foreground hover:text-primary"
                >
                  <ExternalLink className="w-3 h-3" />
                  Buka di Tab Baru
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DoodstreamPlayer;