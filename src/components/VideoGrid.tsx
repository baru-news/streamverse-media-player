import VideoCard from "./VideoCard";

interface VideoGridProps {
  title: string;
  videos: Array<{
    id: string;
    title: string;
    thumbnail: string;
    duration: string;
    views: string;
    creator: string;
    category: string;
  }>;
}

const VideoGrid = ({ title, videos }: VideoGridProps) => {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 flex items-center gap-3">
          <div className="w-1 h-8 bg-gradient-primary rounded-full" />
          {title}
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {videos.map((video) => (
            <VideoCard key={video.id} {...video} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default VideoGrid;