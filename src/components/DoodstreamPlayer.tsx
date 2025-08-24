import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Loader2, AlertCircle, Clock, RotateCcw, Wifi } from 'lucide-react';
import { useWatchTime } from '@/hooks/useWatchTime';
import { usePremiumStreaming } from '@/hooks/usePremiumStreaming';

interface DoodstreamPlayerProps {
  fileCode: string;
  premiumFileCode?: string;
  title: string;
  videoId?: string;
  width?: number;
  height?: number;
  autoplay?: boolean;
  className?: string;
}

const DoodstreamPlayer: React.FC<DoodstreamPlayerProps> = ({
  fileCode,
  premiumFileCode,
  title,
  videoId,
  width = 720,
  height = 405,
  autoplay = false,
  className = "",
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [premiumError, setPremiumError] = useState(false);
  const [showFallbackUI, setShowFallbackUI] = useState(false);
  const [currentFileCode, setCurrentFileCode] = useState<string>(fileCode);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { startWatchTime } = useWatchTime(videoId);
  const { isPremiumStreaming, isInGracePeriod, loading: streamingLoading } = usePremiumStreaming();

  useEffect(() => {
    if (isPlaying && videoId) {
      startWatchTime();
    }
  }, [isPlaying, videoId, startWatchTime]);

  // Determine which file code to use based on premium status
  useEffect(() => {
    if (streamingLoading) return;
    
    if (isPremiumStreaming && premiumFileCode && !premiumError) {
      setCurrentFileCode(premiumFileCode);
    } else {
      setCurrentFileCode(fileCode);
      if (isPremiumStreaming && premiumFileCode && premiumError) {
        setShowFallbackUI(true);
      }
    }
  }, [isPremiumStreaming, premiumFileCode, fileCode, premiumError, streamingLoading]);

  const handlePlay = () => {
    setIsLoading(true);
    setHasError(false);
    setIsPlaying(true);
    setShowFallbackUI(false);
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    // If this was a premium file code that failed, mark it as error and try regular
    if (currentFileCode === premiumFileCode && premiumFileCode) {
      setPremiumError(true);
      setCurrentFileCode(fileCode);
      setShowFallbackUI(true);
    } else {
      setHasError(true);
    }
  };

  const handleRetryPremium = () => {
    if (premiumFileCode) {
      setPremiumError(false);
      setShowFallbackUI(false);
      setCurrentFileCode(premiumFileCode);
      setIsPlaying(false);
    }
  };

  const handleUseRegular = () => {
    setShowFallbackUI(false);
    setCurrentFileCode(fileCode);
    setIsPlaying(false);
  };

  const embedUrl = `https://doodstream.com/e/${currentFileCode}${autoplay ? '?autoplay=1' : ''}`;

  // Show fallback UI for premium streaming issues
  if (showFallbackUI && isPremiumStreaming) {
    return (
      <Card className={`relative overflow-hidden ${className}`}>
        <div 
          className="flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted/50 border-2 border-dashed border-primary/20"
          style={{ width, height }}
        >
          <div className="text-center space-y-4 p-6 max-w-md">
            <div className="flex justify-center">
              <div className="p-3 bg-destructive/10 rounded-full">
                <Wifi className="h-8 w-8 text-destructive" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                🚨 Ups! Streaming Premium sedang bermasalah
              </h3>
              <p className="text-sm text-muted-foreground">
                Admin sedang berusaha memperbaikinya
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <p className="text-sm font-medium text-foreground">
                Gunakan Mode Reguler dulu?
              </p>
              <div className="flex gap-2 justify-center">
                <Button 
                  onClick={handleUseRegular}
                  className="gap-2"
                  size="sm"
                >
                  <Play className="h-4 w-4" />
                  Tonton Versi Reguler
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleRetryPremium}
                  size="sm"
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Coba Lagi
                </Button>
              </div>
            </div>

            {isInGracePeriod && (
              <div className="mt-4 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                <p className="text-xs text-warning-foreground">
                  ⚠️ Premium streaming Anda dalam masa tenggang
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`relative overflow-hidden ${className}`}>
      <div className="relative" style={{ width, height }}>
        {!isPlaying ? (
          <div 
            className="flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 cursor-pointer hover:from-primary/15 hover:to-secondary/15 transition-colors"
            onClick={handlePlay}
            style={{ width, height }}
          >
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                <Play className="w-8 h-8 text-primary ml-1" />
              </div>
              <p className="text-foreground font-medium max-w-xs px-4">
                {title}
              </p>
              <div className="space-y-2">
                <Button size="sm" className="gap-2">
                  <Play className="w-4 h-4" />
                  Tonton Video
                </Button>
                {isPremiumStreaming && premiumFileCode && (
                  <div className="text-xs text-primary font-medium">
                    ✨ Premium Quality Available
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            {isLoading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                <div className="text-center text-white">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                  <p className="text-sm">Loading video...</p>
                </div>
              </div>
            )}

            {hasError && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                <div className="text-center text-white space-y-4">
                  <AlertCircle className="w-8 h-8 mx-auto text-red-400" />
                  <p className="text-sm">Failed to load video</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setHasError(false);
                      setIsPlaying(false);
                    }}
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            )}

            <iframe
              ref={iframeRef}
              src={embedUrl}
              width={width}
              height={height}
              allowFullScreen
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              className="border-0"
              title={`Video player: ${title}`}
            />
            
            {/* Premium streaming indicator */}
            {isPremiumStreaming && currentFileCode === premiumFileCode && (
              <div className="absolute top-2 right-2 bg-primary/90 text-primary-foreground px-2 py-1 rounded text-xs font-medium">
                ✨ Premium
              </div>
            )}
            
            {isInGracePeriod && (
              <div className="absolute top-2 left-2 bg-warning/90 text-warning-foreground px-2 py-1 rounded text-xs font-medium">
                ⚠️ Grace Period
              </div>
            )}
          </>
        )}
      </div>

      {/* Watch time display */}
      {isPlaying && videoId && (
        <div className="px-4 py-2 bg-muted/50 border-t flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>Watch time tracked</span>
          </div>
          {isPremiumStreaming && (
            <span className="text-primary font-medium">Premium Streaming</span>
          )}
        </div>
      )}
    </Card>
  );
};

export default DoodstreamPlayer;