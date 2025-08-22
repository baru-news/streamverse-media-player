import { UniversalVideoPlayer } from "./UniversalVideoPlayer";
import type { VideoProvider } from "@/lib/video-provider-manager";

interface DualStreamPlayerProps {
  doodstreamFileCode?: string | null;
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
  primaryProvider = 'doodstream',
  title = "Video",
  videoId,
  width = 800,
  height = 450,
  autoplay = false,
  className = ""
}: DualStreamPlayerProps) {
  // If no DoodStream file code available
  if (!doodstreamFileCode) {
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
      {/* Video Player */}
      <UniversalVideoPlayer
        fileCode={doodstreamFileCode}
        provider="doodstream"
        title={title}
        videoId={videoId}
        width={width}
        height={height}
        autoplay={autoplay}
      />

      {/* Stream Info */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>🎥 DoodStream</span>
        </div>
      </div>
    </div>
  );
}