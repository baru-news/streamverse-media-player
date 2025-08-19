import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Video, Upload, List, Settings, Edit, Save, X, Globe, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import VideoUpload from "@/components/VideoUpload";
import WebsiteSettings from "@/components/admin/WebsiteSettings";
import HashtagManagement from "@/components/admin/HashtagManagement";
import VideoHashtagSelector from "@/components/VideoHashtagSelector";
import { SecureDoodstreamAPI } from "@/lib/supabase-doodstream";
import { supabase } from "@/integrations/supabase/client";

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
  thumbnail_url?: string;
}

const AdminUpload = () => {
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [accountInfo, setAccountInfo] = useState<any>(null);
  const [editingVideo, setEditingVideo] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ title: string; description: string }>({ title: "", description: "" });
  const { toast } = useToast();

  const handleUploadComplete = async (fileCode: string, videoData: any) => {
    console.log("Upload completed:", { fileCode, videoData });
    // Refresh video list after upload
    await loadVideos();
  };

  const loadVideos = async () => {
    setIsLoading(true);
    try {
      // Sync videos from Doodstream first to ensure database is up to date
      await SecureDoodstreamAPI.syncVideos();
      
      // Get videos from database
      const videoList = await SecureDoodstreamAPI.getVideosFromDatabase(50);
      const account = await SecureDoodstreamAPI.getAccountInfo();
      
      setVideos(videoList);
      setAccountInfo(account);
    } catch (error) {
      console.error("Failed to load videos:", error);
      toast({
        title: "Error",
        description: "Gagal memuat daftar video. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditVideo = (video: VideoData) => {
    setEditingVideo(video.id);
    setEditForm({
      title: video.title,
      description: video.description || ""
    });
  };

  const handleSaveEdit = async (videoId: string) => {
    try {
      const { error } = await supabase
        .from('videos')
        .update({
          title: editForm.title,
          description: editForm.description
        })
        .eq('id', videoId);

      if (error) throw error;

      // Update local state
      setVideos(videos.map(video => 
        video.id === videoId 
          ? { ...video, title: editForm.title, description: editForm.description }
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
        description: "Gagal memperbarui video. Silakan coba lagi.",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingVideo(null);
    setEditForm({ title: "", description: "" });
  };

  useEffect(() => {
    loadVideos();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link to="/">
              <Button variant="ghost" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Kembali
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          </div>

          <Tabs defaultValue="website" className="space-y-6">
            <TabsList className="bg-card/50 backdrop-blur-sm">
              <TabsTrigger value="website" className="gap-2">
                <Globe className="w-4 h-4" />
                Website
              </TabsTrigger>
              <TabsTrigger value="hashtags" className="gap-2">
                <Hash className="w-4 h-4" />
                Hashtag
              </TabsTrigger>
              <TabsTrigger value="upload" className="gap-2">
                <Upload className="w-4 h-4" />
                Upload Video
              </TabsTrigger>
              <TabsTrigger value="videos" className="gap-2">
                <List className="w-4 h-4" />
                Kelola Video
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2">
                <Settings className="w-4 h-4" />
                Pengaturan Doodstream
              </TabsTrigger>
            </TabsList>

            {/* Website Settings Tab */}
            <TabsContent value="website">
              <WebsiteSettings />
            </TabsContent>

            {/* Hashtag Management Tab */}
            <TabsContent value="hashtags">
              <HashtagManagement />
            </TabsContent>

            {/* Upload Tab */}
            <TabsContent value="upload">
              <div className="space-y-6">
                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <CardTitle className="text-white">Upload Video Baru</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <VideoUpload onUploadComplete={handleUploadComplete} />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Videos Tab */}
            <TabsContent value="videos">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white">Daftar Video</h2>
                  <Button onClick={loadVideos} variant="outline" disabled={isLoading}>
                    {isLoading ? "Loading..." : "Refresh"}
                  </Button>
                </div>

                {videos.length === 0 ? (
                  <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                    <CardContent className="py-12 text-center">
                      <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-white font-medium mb-2">Belum ada video</p>
                      <p className="text-muted-foreground">
                        Upload video pertama Anda untuk mulai streaming
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {videos.map((video) => (
                      <Card key={video.id} className="bg-card/50 backdrop-blur-sm border-border/50">
                        <CardContent className="p-4">
                          {video.thumbnail_url && (
                            <div className="aspect-video bg-muted/30 rounded-lg mb-4 overflow-hidden">
                              <img 
                                src={video.thumbnail_url} 
                                alt={video.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          
                          {editingVideo === video.id ? (
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor={`title-${video.id}`} className="text-white">
                                  Judul
                                </Label>
                                <Input
                                  id={`title-${video.id}`}
                                  value={editForm.title}
                                  onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                                  className="bg-background/50"
                                />
                              </div>
                              <div>
                                <Label htmlFor={`desc-${video.id}`} className="text-white">
                                  Deskripsi
                                </Label>
                                <Textarea
                                  id={`desc-${video.id}`}
                                  value={editForm.description}
                                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                                  className="bg-background/50"
                                  rows={3}
                                />
                              </div>
                              
                              {/* Hashtag Selector */}
                              <VideoHashtagSelector
                                videoId={video.id}
                                className="mt-4"
                              />
                              
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSaveEdit(video.id)}
                                  className="flex-1 gap-1"
                                >
                                  <Save className="w-3 h-3" />
                                  Simpan
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleCancelEdit}
                                  className="gap-1"
                                >
                                  <X className="w-3 h-3" />
                                  Batal
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-start justify-between mb-2">
                                <h3 className="font-medium text-white line-clamp-2 flex-1 mr-2">
                                  {video.title}
                                </h3>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditVideo(video)}
                                  className="p-1"
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                              </div>
                              
                              {video.description && (
                                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                  {video.description}
                                </p>
                              )}
                              
                              <div className="text-sm text-muted-foreground space-y-1">
                                <div className="flex justify-between">
                                  <span>Status:</span>
                                  <span className={`${
                                    video.status === 'active' ? 'text-green-400' : 'text-yellow-400'
                                  }`}>
                                    {video.status || 'processing'}
                                  </span>
                                </div>
                                {video.duration && (
                                  <div className="flex justify-between">
                                    <span>Durasi:</span>
                                    <span>{Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, '0')}</span>
                                  </div>
                                )}
                                <div className="flex justify-between">
                                  <span>Views:</span>
                                  <span>{video.views?.toLocaleString() || '0'}</span>
                                </div>
                                {video.file_size && (
                                  <div className="flex justify-between">
                                    <span>Size:</span>
                                    <span>{(video.file_size / (1024 * 1024)).toFixed(1)} MB</span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="mt-4 pt-4 border-t border-border/50">
                                <div className="flex gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="flex-1"
                                    onClick={() => {
                                      const embedUrl = `https://dood.re/e/${video.file_code}`;
                                      navigator.clipboard.writeText(embedUrl);
                                      toast({
                                        title: "Link disalin",
                                        description: "Link embed berhasil disalin ke clipboard.",
                                      });
                                    }}
                                  >
                                    Copy Link
                                  </Button>
                                  <Link to={`/video/${video.file_code}`}>
                                    <Button variant="default" size="sm">
                                      Lihat
                                    </Button>
                                  </Link>
                                </div>
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <div className="space-y-6">
                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <CardTitle className="text-white">Informasi Akun Doodstream</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {accountInfo ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-muted/20 p-4 rounded-lg">
                            <h4 className="font-medium text-white mb-2">Email</h4>
                            <p className="text-muted-foreground">{accountInfo.email}</p>
                          </div>
                          <div className="bg-muted/20 p-4 rounded-lg">
                            <h4 className="font-medium text-white mb-2">Balance</h4>
                            <p className="text-primary font-semibold">${accountInfo.balance}</p>
                          </div>
                          <div className="bg-muted/20 p-4 rounded-lg">
                            <h4 className="font-medium text-white mb-2">Storage Used</h4>
                            <p className="text-muted-foreground">{accountInfo.storage_used}</p>
                          </div>
                          <div className="bg-muted/20 p-4 rounded-lg">
                            <h4 className="font-medium text-white mb-2">Storage Left</h4>
                            <p className="text-green-400">{accountInfo.storage_left}</p>
                          </div>
                        </div>
                        <div className="bg-muted/20 p-4 rounded-lg">
                          <h4 className="font-medium text-white mb-2">Premium Expire</h4>
                          <p className="text-muted-foreground">{accountInfo.premium_expire}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">
                          Informasi akun tidak tersedia. Pastikan API key sudah dikonfigurasi.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <CardTitle className="text-white">Konfigurasi API</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-yellow-900/20 border border-yellow-500/50 p-4 rounded-lg">
                      <h4 className="font-medium text-yellow-300 mb-2">⚠️ Konfigurasi Diperlukan</h4>
                      <p className="text-yellow-200 text-sm mb-4">
                        Untuk menggunakan fitur upload dan streaming Doodstream, Anda perlu mengkonfigurasi API key di Supabase secrets.
                      </p>
                      <div className="space-y-2 text-sm text-yellow-200">
                        <p>1. Dapatkan API key dari dashboard Doodstream</p>
                        <p>2. Simpan API key di Supabase secrets dengan nama "DOODSTREAM_API_KEY"</p>
                        <p>3. Restart aplikasi untuk memuat konfigurasi baru</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default AdminUpload;