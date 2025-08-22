import { useState, useEffect } from "react";
import { 
  Edit, Save, X, RefreshCw, Upload, RotateCcw, Search, 
  Filter, Download, Copy, Eye, Trash2, ChevronDown,
  AlertCircle, CheckCircle2, Clock, EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SecureDoodstreamAPI } from "@/lib/supabase-doodstream";
import { VideoProviderManager } from "@/lib/video-provider-manager";
import VideoHashtagSelector from "@/components/VideoHashtagSelector";
import VideoCategorySelector from "@/components/VideoCategorySelector";
import { generateSEOTitle, generateSlug, generateMetaDescription } from "@/lib/seo-utils";
import { exportVideosData, importVideosData } from "@/lib/video-export";
import HideVideoButton from "@/components/admin/HideVideoButton";
import { useVideoStatus } from "@/hooks/useVideoStatus";

interface VideoData {
  id: string;
  file_code: string;
  title: string;
  description?: string;
  duration?: number;
  views?: number;
  upload_date?: string;
  file_size?: number;
  status?: string;
  provider?: 'doodstream';
  thumbnail_url?: string;
  title_edited?: boolean;
  description_edited?: boolean;
  original_title?: string;
  slug?: string;
}

interface EditForm {
  title: string;
  description: string;
  generateSEO: boolean;
}

const EnhancedVideoManager = () => {
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingVideo, setEditingVideo] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ title: "", description: "", generateSEO: false });
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showOnlyEdited, setShowOnlyEdited] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();
  const { bulkHideVideos, bulkShowVideos } = useVideoStatus();

  const loadVideos = async () => {
    setIsLoading(true);
    try {
      // Load videos from all providers with proper ordering
      const { data: videoList, error } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200); // Increased limit to show more videos

      if (error) throw error;
      
      console.log(`Loaded ${videoList?.length || 0} videos from database`);
      console.log('Provider breakdown:', 
        videoList?.reduce((acc, v) => {
          acc[v.provider] = (acc[v.provider] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      );
      
      setVideos(videoList || []);
    } catch (error) {
      console.error("Failed to load videos:", error);
      toast({
        title: "Error",
        description: "Gagal memuat daftar video.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const syncVideos = async () => {
    setIsSyncing(true);
    try {
      console.log("Starting video sync process...");
      
      // Test API key availability first
      try {
        const accountInfo = await SecureDoodstreamAPI.getAccountInfo();
        console.log("API key test successful:", accountInfo);
      } catch (testError) {
        console.error("API key test failed:", testError);
        toast({
          title: "Error",
          description: "API key Doodstream tidak valid atau tidak tersedia. Periksa konfigurasi secret.",
          variant: "destructive",
        });
        return;
      }
      
      // Sync DoodStream only
      const doodResult = await VideoProviderManager.syncVideos('doodstream');
      
      let successCount = 0;
      let errors = [];
      
      if (doodResult) {
        successCount++;
        await loadVideos();
        toast({
          title: "Berhasil",
          description: "Video berhasil disinkronkan dari DoodStream",
        });
      } else {
        errors.push('Doodstream');
        toast({
          title: "Error",
          description: "Gagal sinkronisasi dari DoodStream",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to sync videos:", error);
      toast({
        title: "Error",
        description: `Gagal sinkronisasi video: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleEditVideo = (video: VideoData) => {
    setEditingVideo(video.id);
    setEditForm({
      title: video.title,
      description: video.description || "",
      generateSEO: false
    });
  };

  const handleSaveEdit = async (videoId: string) => {
    try {
      let finalTitle = editForm.title;
      let finalDescription = editForm.description;
      let slug = "";

      if (editForm.generateSEO) {
        finalTitle = generateSEOTitle(editForm.title);
        finalDescription = generateMetaDescription(editForm.description || editForm.title);
      }
      
      slug = generateSlug(finalTitle);

      const { error } = await supabase
        .from('videos')
        .update({
          title: finalTitle,
          description: finalDescription,
          slug,
          title_edited: true,
          description_edited: true
        })
        .eq('id', videoId);

      if (error) throw error;

      setVideos(videos.map(video => 
        video.id === videoId 
          ? { 
              ...video, 
              title: finalTitle, 
              description: finalDescription,
              slug,
              title_edited: true,
              description_edited: true
            }
          : video
      ));

      setEditingVideo(null);
      toast({
        title: "Berhasil",
        description: "Video berhasil diperbarui.",
      });
    } catch (error) {
      console.error("Failed to update video:", error);
      toast({
        title: "Error", 
        description: "Gagal memperbarui video.",
        variant: "destructive",
      });
    }
  };

  const resetToOriginal = async (videoId: string) => {
    try {
      const video = videos.find(v => v.id === videoId);
      if (!video) return;

      // Get original data from Doodstream
      const originalData = await SecureDoodstreamAPI.getVideoInfo(video.file_code);
      
      const { error } = await supabase
        .from('videos')
        .update({
          title: originalData.title,
          description: null,
          title_edited: false,
          description_edited: false
        })
        .eq('id', videoId);

      if (error) throw error;

      setVideos(videos.map(v => 
        v.id === videoId 
          ? { 
              ...v, 
              title: originalData.title, 
              description: null,
              title_edited: false,
              description_edited: false
            }
          : v
      ));

      toast({
        title: "Berhasil",
        description: "Video berhasil direset ke data asli.",
      });
    } catch (error) {
      console.error("Failed to reset video:", error);
      toast({
        title: "Error",
        description: "Gagal reset video.",
        variant: "destructive",
      });
    }
  };

  const handleBulkEdit = async () => {
    const selectedVideoList = videos.filter(v => selectedVideos.has(v.id));
    
    for (const video of selectedVideoList) {
      try {
        const seoTitle = generateSEOTitle(video.title);
        const seoDescription = generateMetaDescription(video.description || video.title);
        const slug = generateSlug(seoTitle);

        await supabase
          .from('videos')
          .update({
            title: seoTitle,
            description: seoDescription,
            slug,
            title_edited: true,
            description_edited: true
          })
          .eq('id', video.id);
      } catch (error) {
        console.error(`Failed to update video ${video.id}:`, error);
      }
    }

    setSelectedVideos(new Set());
    await loadVideos();
    toast({
      title: "Berhasil",
      description: `${selectedVideoList.length} video berhasil dioptimalkan untuk SEO.`,
    });
  };

  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (video.description || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || video.status === statusFilter;
    const matchesEdited = !showOnlyEdited || video.title_edited || video.description_edited;
    
    return matchesSearch && matchesStatus && matchesEdited;
  });

  const toggleSelectAll = () => {
    if (selectedVideos.size === filteredVideos.length) {
      setSelectedVideos(new Set());
    } else {
      setSelectedVideos(new Set(filteredVideos.map(v => v.id)));
    }
  };

  useEffect(() => {
    loadVideos();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-xl font-semibold text-foreground">Kelola Video</h2>
        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={syncVideos} 
            variant="outline" 
            disabled={isSyncing}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? "Syncing..." : "Sync Multi-Provider"}
          </Button>
          <Button
            onClick={() => exportVideosData(videos)}
            variant="outline"
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Export Data
          </Button>
          <input
            type="file"
            accept=".json"
            onChange={(e) => importVideosData(e, loadVideos)}
            className="hidden"
            id="import-file"
          />
          <Button
            onClick={() => document.getElementById('import-file')?.click()}
            variant="outline"
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            Import Data
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Cari Video</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Cari judul atau deskripsi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status-filter">Filter Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="hidden">Hidden</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-edited"
                  checked={showOnlyEdited}
                  onCheckedChange={(checked) => setShowOnlyEdited(checked === true)}
                />
                <Label htmlFor="show-edited" className="text-sm">
                  Hanya yang diedit
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedVideos.size > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{selectedVideos.size} video dipilih</span>
            <div className="flex gap-2">
              <Button onClick={handleBulkEdit} size="sm" variant="default">
                Optimasi SEO Massal
              </Button>
              <Button 
                onClick={async () => {
                  const selectedVideoIds = Array.from(selectedVideos);
                  await bulkHideVideos(selectedVideoIds);
                  setSelectedVideos(new Set());
                  loadVideos();
                }}
                size="sm" 
                variant="outline"
                className="gap-1"
              >
                <EyeOff className="w-3 h-3" />
                Sembunyikan
              </Button>
              <Button 
                onClick={async () => {
                  const selectedVideoIds = Array.from(selectedVideos);
                  await bulkShowVideos(selectedVideoIds);
                  setSelectedVideos(new Set());
                  loadVideos();
                }}
                size="sm" 
                variant="outline"
                className="gap-1"
              >
                <Eye className="w-3 h-3" />
                Tampilkan
              </Button>
              <Button 
                onClick={() => setSelectedVideos(new Set())} 
                size="sm" 
                variant="outline"
              >
                Batalkan Pilihan
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Videos Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">Memuat video...</p>
        </div>
      ) : filteredVideos.length === 0 ? (
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Tidak ada video yang sesuai filter.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Select All */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="select-all"
              checked={selectedVideos.size === filteredVideos.length && filteredVideos.length > 0}
              onCheckedChange={toggleSelectAll}
            />
            <Label htmlFor="select-all" className="text-sm">
              Pilih semua ({filteredVideos.length} video)
            </Label>
          </div>

          {/* Video Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredVideos.map((video) => (
              <Card key={video.id} className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardContent className="p-4">
                  {/* Selection Checkbox */}
                  <div className="flex items-start justify-between mb-4">
                    <Checkbox
                      checked={selectedVideos.has(video.id)}
                      onCheckedChange={(checked) => {
                        const newSelected = new Set(selectedVideos);
                        if (checked) {
                          newSelected.add(video.id);
                        } else {
                          newSelected.delete(video.id);
                        }
                        setSelectedVideos(newSelected);
                      }}
                    />
                    <div className="flex gap-1">
                      {video.title_edited && (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <Edit className="w-3 h-3" />
                          Judul
                        </Badge>
                      )}
                      {video.description_edited && (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <Edit className="w-3 h-3" />
                          Desc
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Thumbnail */}
                  {video.thumbnail_url && (
                    <div className="aspect-video bg-muted/30 rounded-lg mb-4 overflow-hidden">
                      <img 
                        src={video.thumbnail_url} 
                        alt={video.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const img = e.currentTarget;
                          const currentSrc = img.src;
                          
                          // Fallback to DoodStream thumbnail format
                          if (!currentSrc.includes('img.doodcdn.io/thumbnails/')) {
                            img.src = `https://img.doodcdn.io/thumbnails/${video.file_code}.jpg`;
                            return;
                          }
                          
                          // Final fallback: placeholder image
                          if (!currentSrc.includes('placeholder.svg')) {
                            img.src = '/placeholder.svg';
                          }
                        }}
                      />
                    </div>
                  )}
                  
                  {/* Editing Form */}
                  {editingVideo === video.id ? (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor={`title-${video.id}`}>Judul</Label>
                        <Input
                          id={`title-${video.id}`}
                          value={editForm.title}
                          onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`desc-${video.id}`}>Deskripsi</Label>
                        <Textarea
                          id={`desc-${video.id}`}
                          value={editForm.description}
                          onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                          rows={3}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`seo-${video.id}`}
                          checked={editForm.generateSEO}
                          onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, generateSEO: !!checked }))}
                        />
                        <Label htmlFor={`seo-${video.id}`} className="text-sm">
                          Optimasi SEO otomatis
                        </Label>
                      </div>
                      
                      <VideoCategorySelector videoId={video.id} />
                      <VideoHashtagSelector videoId={video.id} />
                      
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleSaveEdit(video.id)}
                          size="sm"
                          className="flex-1 gap-1"
                        >
                          <Save className="w-3 h-3" />
                          Simpan
                        </Button>
                        <Button
                          onClick={() => setEditingVideo(null)}
                          variant="outline"
                          size="sm"
                          className="gap-1"
                        >
                          <X className="w-3 h-3" />
                          Batal
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Video Info */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-start justify-between">
                          <h3 className="font-medium text-foreground line-clamp-2 flex-1 mr-2">
                            {video.title}
                          </h3>
                          <div className="flex items-center gap-1">
                            <HideVideoButton
                              videoId={video.id}
                              currentStatus={video.status || 'processing'}
                              onStatusChange={loadVideos}
                            />
                            <Button
                              onClick={() => handleEditVideo(video)}
                              variant="ghost"
                              size="sm"
                              className="p-1"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            {(video.title_edited || video.description_edited) && (
                              <Button
                                onClick={() => resetToOriginal(video.id)}
                                variant="ghost"
                                size="sm"
                                className="p-1"
                                title="Reset ke data asli"
                              >
                                <RotateCcw className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        {video.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {video.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <div className={`flex items-center gap-1 ${
                            video.status === 'active' ? 'text-green-400' : 
                            video.status === 'hidden' ? 'text-red-400' : 'text-yellow-400'
                          }`}>
                            {video.status === 'active' ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : video.status === 'hidden' ? (
                              <EyeOff className="w-3 h-3" />
                            ) : (
                              <Clock className="w-3 h-3" />
                            )}
                            {video.status || 'processing'}
                          </div>
                          {video.provider && (
                            <Badge 
                              variant="outline" 
                              className={`text-xs px-2 py-0 ${
                                video.provider === 'doodstream' ? 'text-blue-400 border-blue-400' : 'text-green-400 border-green-400'
                              }`}
                            >
                              Dood
                            </Badge>
                          )}
                          {video.views && (
                            <span>{video.views.toLocaleString()} views</span>
                          )}
                          {video.duration && (
                            <span>{Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, '0')}</span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 gap-1"
                          onClick={() => {
                            // Generate embed URL based on provider
                            const embedUrl = `https://dood.re/e/${video.file_code}`;
                            navigator.clipboard.writeText(embedUrl);
                            toast({
                              title: "Link disalin",
                              description: "Link embed berhasil disalin.",
                            });
                          }}
                        >
                          <Copy className="w-3 h-3" />
                          Copy Link
                        </Button>
                        <Button variant="default" size="sm" className="gap-1" asChild>
                          <a href={`/video/${video.file_code}`} target="_blank" rel="noopener noreferrer">
                            <Eye className="w-3 h-3" />
                            Lihat
                          </a>
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedVideoManager;