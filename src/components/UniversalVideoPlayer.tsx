import DoodstreamPlayer from "./DoodstreamPlayer";
import type { VideoProvider } from "@/lib/video-provider-manager";

interface UniversalVideoPlayerProps {
  fileCode: string;
  provider: VideoProvider;
  title?: string;
  videoId?: string;
  width?: number;
  height?: number;
  autoplay?: boolean;
  className?: string;
}

export function UniversalVideoPlayer({
  fileCode,
  provider,
  title,
  videoId,
  width,
  height,
  autoplay,
  className
}: UniversalVideoPlayerProps) {
  switch (provider) {
    case 'doodstream':
      return (
        <DoodstreamPlayer
          fileCode={fileCode}
          title={title}
          videoId={videoId}
          width={width}
          height={height}
          autoplay={autoplay}
          className={className}
        />
      );
    default:
      return (
        <div className={`bg-muted rounded-lg flex items-center justify-center ${className}`} style={{ width, height }}>
          <p className="text-muted-foreground">Unsupported video provider: {provider}</p>
        </div>
      );
  }
}