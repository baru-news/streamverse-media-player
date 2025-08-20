import React, { useState, useEffect, useCallback } from 'react';
import VideoCard from './VideoCard';
import { SecureDoodstreamAPI } from '@/lib/supabase-doodstream';
import { AdContainer } from './ads/AdContainer';
import { AdCard } from './ads/AdCard';
import { useAds } from '@/hooks/useAds';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
interface VideoGridProps {
  title: string;
  selectedHashtagId?: string | null;
  selectedCategoryId?: string | null;
  searchQuery?: string;
}
const VideoGrid: React.FC<VideoGridProps> = ({
  title,
  selectedHashtagId,
  selectedCategoryId,
  searchQuery
}) => {
  const [videos, setVideos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVideos, setTotalVideos] = useState(0);
  const videosPerPage = 12;
  const { getActiveAds } = useAds();
  const loadVideos = useCallback(async (page: number = currentPage) => {
    setIsLoading(true);
    setError(null);
    try {
      let fetchedVideos: any[];
      let totalCount: number;
      if (searchQuery?.trim()) {
        fetchedVideos = await SecureDoodstreamAPI.getVideosFromDatabaseBySearch(searchQuery, selectedHashtagId || undefined, selectedCategoryId || undefined, page, videosPerPage);
        totalCount = await SecureDoodstreamAPI.getTotalVideosCount(searchQuery, selectedHashtagId || undefined, selectedCategoryId || undefined);
      } else if (selectedCategoryId) {
        fetchedVideos = await SecureDoodstreamAPI.getVideosFromDatabaseByCategory(selectedCategoryId, page, videosPerPage);
        totalCount = await SecureDoodstreamAPI.getTotalVideosCount(undefined, undefined, selectedCategoryId);
      } else if (selectedHashtagId) {
        fetchedVideos = await SecureDoodstreamAPI.getVideosFromDatabaseByHashtag(selectedHashtagId, page, videosPerPage);
        totalCount = await SecureDoodstreamAPI.getTotalVideosCount(undefined, selectedHashtagId);
      } else {
        fetchedVideos = await SecureDoodstreamAPI.getVideosFromDatabase(page, videosPerPage);
        totalCount = await SecureDoodstreamAPI.getTotalVideosCount();
      }
      setTotalVideos(totalCount);
      setTotalPages(Math.ceil(totalCount / videosPerPage));
      if (fetchedVideos && fetchedVideos.length > 0) {
        // Transform database videos to match VideoCard props
        const transformedVideos = fetchedVideos.map(video => ({
          id: video.file_code || video.id,
          // Use file_code as id for proper routing
          title: video.title,
          thumbnail: `https://img.doodcdn.io/snaps/${video.file_code}.jpg`,
          duration: formatDuration(video.duration || 0),
          views: formatViews(video.views || 0),
          creator: 'DINO18',
          category: 'Video',
          fileCode: video.file_code,
          videoId: video.id // Pass database ID for favorites
        }));
        setVideos(transformedVideos);
      } else {
        // If no videos in database, show message
        setVideos([]);
        if (totalCount === 0) {
          setError('Belum ada video yang tersedia. Admin perlu menambahkan video ke akun Doodstream terlebih dahulu.');
        }
      }
    } catch (error) {
      console.error('Error loading videos:', error);
      setError('Gagal memuat video. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedHashtagId, selectedCategoryId, currentPage, videosPerPage]);
  useEffect(() => {
    setCurrentPage(1); // Reset to first page when search/hashtag/category changes
  }, [searchQuery, selectedHashtagId, selectedCategoryId]);
  useEffect(() => {
    loadVideos(currentPage);
  }, [currentPage, searchQuery, selectedHashtagId, selectedCategoryId]);
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  const formatDuration = (seconds: number): string => {
    if (!seconds) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  const formatViews = (views: number): string => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };
  if (isLoading) {
    return <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8 flex items-center gap-3">
            <div className="w-1 h-8 bg-gradient-primary rounded-full" />
            {title}
          </h2>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading videos...</p>
          </div>
        </div>
      </section>;
  }
  if (error) {
    return <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8 flex items-center gap-3">
            <div className="w-1 h-8 bg-gradient-primary rounded-full" />
            {title}
          </h2>
          <div className="text-center py-8">
            <p className="text-destructive mb-4">{error}</p>
            <button onClick={() => loadVideos(currentPage)} className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
              Try Again
            </button>
          </div>
        </div>
      </section>;
  }
  return <section className="py-2">
      <div className="container mx-auto px-4 py-0">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
            <div className="w-1 h-8 bg-gradient-primary rounded-full" />
            {title}
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {totalVideos > 0 && `${totalVideos} video${totalVideos > 1 ? 's' : ''}`}
            </span>
            <button onClick={() => loadVideos(currentPage)} className="px-4 py-2 bg-secondary/20 text-foreground rounded-md hover:bg-secondary/30 transition-colors text-sm">
              Refresh
            </button>
          </div>
        </div>
        
        {videos.length === 0 ? <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              Belum ada video yang tersedia.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Video akan muncul setelah admin menambahkan konten.
            </p>
          </div> : <>
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 sm:gap-3">
              {videos.map((video, index) => {
                const videoGridAds = getActiveAds('video-grid');
                return (
                  <React.Fragment key={video.id}>
                    <VideoCard {...video} />
                    {/* Ad Cards every 10 videos */}
                    {(index + 1) % 10 === 0 && (
                      <div className="col-span-1 xs:col-span-2 sm:col-span-2 md:col-span-3 lg:col-span-4 xl:col-span-6">
                        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 sm:gap-3 mb-4">
                          {Array.from({ length: 6 }).map((_, adIndex) => {
                            const ad = videoGridAds[adIndex];
                            const responsiveClass = `${adIndex >= 2 ? 'hidden sm:block' : ''} ${adIndex >= 3 ? 'hidden lg:block' : ''} ${adIndex >= 4 ? 'hidden xl:block' : ''}`;
                            
                            return (
                              <AdCard 
                                key={ad?.id || adIndex} 
                                size="small" 
                                ad={ad}
                                className={responsiveClass}
                                placeholder={!ad}
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
            
            {totalPages > 1 && <div className="flex justify-center mt-8">
                <Pagination>
                  <PaginationContent>
                    {currentPage > 1 && <PaginationItem>
                        <PaginationPrevious onClick={() => handlePageChange(currentPage - 1)} className="cursor-pointer" />
                      </PaginationItem>}
                    
                    {/* Show first page */}
                    {currentPage > 3 && <>
                        <PaginationItem>
                          <PaginationLink onClick={() => handlePageChange(1)} className="cursor-pointer">
                            1
                          </PaginationLink>
                        </PaginationItem>
                        {currentPage > 4 && <PaginationItem>
                            <PaginationEllipsis />
                          </PaginationItem>}
                      </>}
                    
                    {/* Show current page and surrounding pages */}
                    {Array.from({
                length: Math.min(5, totalPages)
              }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                if (pageNum > totalPages) return null;
                return <PaginationItem key={pageNum}>
                          <PaginationLink onClick={() => handlePageChange(pageNum)} isActive={currentPage === pageNum} className="cursor-pointer">
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>;
              })}
                    
                    {/* Show last page */}
                    {currentPage < totalPages - 2 && <>
                        {currentPage < totalPages - 3 && <PaginationItem>
                            <PaginationEllipsis />
                          </PaginationItem>}
                        <PaginationItem>
                          <PaginationLink onClick={() => handlePageChange(totalPages)} className="cursor-pointer">
                            {totalPages}
                          </PaginationLink>
                        </PaginationItem>
                      </>}
                    
                    {currentPage < totalPages && <PaginationItem>
                        <PaginationNext onClick={() => handlePageChange(currentPage + 1)} className="cursor-pointer" />
                      </PaginationItem>}
                  </PaginationContent>
                </Pagination>
              </div>}
          </>}
      </div>
    </section>;
};
export default VideoGrid;