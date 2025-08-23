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

  // Calculate aspect ratio for responsive design
  const aspectRatio = (height / width) * 100;

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
    <Card className={`w-full max-w-full overflow-hidden bg-black ${className}`}>
      <CardContent className="p-0">
        {/* Responsive container with proper aspect ratio */}
        <div 
          className="relative w-full" 
          style={{ 
            paddingBottom: `${Math.max(aspectRatio, 56.25)}%`, // Ensure minimum 16:9 aspect ratio
            maxWidth: '100%'
          }}
        >
          {!showPlayer ? (
            // Thumbnail/Preview - Mobile optimized
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black flex items-center justify-center px-4">
              <div className="text-center max-w-sm">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary/20 rounded-full flex items-center justify-center mb-3 sm:mb-4 mx-auto">
                  <Play className="w-6 h-6 sm:w-8 sm:h-8 text-primary ml-1" />
                </div>
                <h3 className="text-foreground font-medium mb-3 sm:mb-4 text-sm sm:text-base px-2">
                  {title || 'Video Player'}
                </h3>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 sm:space-x-2 items-center justify-center">
                  <Button 
                    onClick={handleLoadPlayer}
                    variant="hero"
                    size="sm"
                    className="gap-2 min-h-[44px] touch-manipulation w-full sm:w-auto"
                  >
                    <Play className="w-4 h-4" />
                    Tonton Video
                  </Button>
                  <Button 
                    onClick={openInNewTab}
                    variant="outline"
                    size="sm"
                    className="gap-2 min-h-[44px] touch-manipulation w-full sm:w-auto"
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
                    <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 text-primary animate-spin mx-auto mb-2" />
                    <p className="text-foreground text-xs sm:text-sm">Memuat video...</p>
                  </div>
                </div>
              )}

              {/* Error State */}
              {hasError && (
                <div className="absolute inset-0 bg-black flex items-center justify-center z-10 px-4">
                  <div className="text-center max-w-sm">
                    <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-500 mx-auto mb-2" />
                    <p className="text-foreground text-xs sm:text-sm mb-4">Gagal memuat video</p>
                    <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2 items-center justify-center">
                      <Button 
                        onClick={handleLoadPlayer}
                        variant="outline"
                        size="sm"
                        className="min-h-[44px] touch-manipulation w-full sm:w-auto"
                      >
                        Coba Lagi
                      </Button>
                      <Button 
                        onClick={openInNewTab}
                        variant="hero"
                        size="sm"
                        className="gap-2 min-h-[44px] touch-manipulation w-full sm:w-auto"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Buka Langsung
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Doodstream Iframe - Mobile optimized */}
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
                  outline: 'none',
                  minHeight: '250px' // Ensure minimum height on mobile
                }}
              />
            </>
          )}
        </div>

        {/* Video Info - Mobile responsive */}
        {showPlayer && (
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 backdrop-blur-sm p-3 sm:p-4 border-t border-primary/20">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0" />
                <span className="text-foreground text-xs sm:text-sm font-medium">
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
                  className="gap-2 text-muted-foreground hover:text-primary min-h-[44px] touch-manipulation"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span className="hidden sm:inline">Buka di Tab Baru</span>
                  <span className="sm:hidden">Tab Baru</span>
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