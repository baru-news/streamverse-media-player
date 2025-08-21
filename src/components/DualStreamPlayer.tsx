import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UniversalVideoPlayer } from "./UniversalVideoPlayer";
import type { VideoProvider } from "@/lib/video-provider-manager";

interface DualStreamPlayerProps {
  doodstreamFileCode?: string | null;
  luluStreamFileCode?: string | null;
  primaryProvider?: VideoProvider;
  title?: string;
  videoId?: string;
  width?: number;
  height?: number;
  autoplay?: boolean;
  className?: string;
}

export function DualStreamPlayer({
  doodstreamFileCode,
  luluStreamFileCode,
  primaryProvider = 'doodstream',
  title = "Video",
  videoId,
  width = 800,
  height = 450,
  autoplay = false,
  className = ""
}: DualStreamPlayerProps) {
  // Determine available streams and set default active provider
  const hasStream1 = !!doodstreamFileCode;
  const hasStream2 = !!luluStreamFileCode;
  
  // If both streams are available, start with primary provider
  // If only one stream is available, use that one
  const getDefaultProvider = (): VideoProvider => {
    if (hasStream1 && hasStream2) {
      return primaryProvider;
    }
    if (hasStream1) return 'doodstream';
    if (hasStream2) return 'lulustream';
    return 'doodstream'; // fallback
  };

  const [activeProvider, setActiveProvider] = useState<VideoProvider>(getDefaultProvider());
  
  // Get current file code based on active provider
  const getCurrentFileCode = (): string => {
    if (activeProvider === 'doodstream' && doodstreamFileCode) {
      return doodstreamFileCode;
    }
    if (activeProvider === 'lulustream' && luluStreamFileCode) {
      return luluStreamFileCode;
    }
    // Fallback to any available file code
    return doodstreamFileCode || luluStreamFileCode || '';
  };

  const currentFileCode = getCurrentFileCode();

  // If no file codes available at all
  if (!hasStream1 && !hasStream2) {
    return (
      <div className={`bg-muted rounded-lg ${className}`} style={{ width, height }}>
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">No video streams available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Stream Selector - Only show if both streams are available */}
      {hasStream1 && hasStream2 && (
        <div className="flex items-center justify-center gap-3 p-3 bg-card/30 rounded-lg border border-border/50">
          <span className="text-sm text-muted-foreground">Pilih Stream:</span>
          
          <div className="flex gap-2">
            <Button
              variant={activeProvider === 'doodstream' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveProvider('doodstream')}
              className="gap-2"
            >
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              Stream 1
              <Badge variant="secondary" className="text-xs">Dood</Badge>
            </Button>
            
            <Button
              variant={activeProvider === 'lulustream' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveProvider('lulustream')}
              className="gap-2"
            >
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              Stream 2
              <Badge variant="secondary" className="text-xs">Lulu</Badge>
            </Button>
          </div>
        </div>
      )}

      {/* Single stream indicator if only one is available */}
      {(hasStream1 && !hasStream2) && (
        <div className="flex items-center justify-center gap-2 p-2 bg-blue-900/20 rounded-lg border border-blue-500/30">
          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
          <span className="text-sm text-blue-300">Stream 1 Available (Doodstream)</span>
        </div>
      )}

      {(!hasStream1 && hasStream2) && (
        <div className="flex items-center justify-center gap-2 p-2 bg-green-900/20 rounded-lg border border-green-500/30">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span className="text-sm text-green-300">Stream 2 Available (LuluStream)</span>
        </div>
      )}

      {/* Video Player */}
      <UniversalVideoPlayer
        fileCode={currentFileCode}
        provider={activeProvider}
        title={title}
        videoId={videoId}
        width={width}
        height={height}
        autoplay={autoplay}
      />

      {/* Stream Info */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>Currently playing:</span>
          <Badge 
            variant="outline" 
            className={activeProvider === 'doodstream' ? 'text-blue-400 border-blue-400' : 'text-green-400 border-green-400'}
          >
            {activeProvider === 'doodstream' ? 'Stream 1 (Doodstream)' : 'Stream 2 (LuluStream)'}
          </Badge>
        </div>
        
        {hasStream1 && hasStream2 && (
          <span className="text-muted-foreground">
            Backup stream tersedia
          </span>
        )}
      </div>
    </div>
  );
}