import { useState } from "react";
import { Upload, Video, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { VideoProviderManager, type VideoProvider } from "@/lib/video-provider-manager";
import { supabase } from "@/integrations/supabase/client";

interface UploadResponse {
  success: boolean;
  file_code?: string;
  doodstream_file_code?: string;
  lulustream_file_code?: string;
  message?: string;
  error?: string;
}

interface VideoUploadProps {
  onUploadComplete?: (fileCode: string, videoData: any, provider: VideoProvider) => void;
}

const VideoUpload = ({ onUploadComplete }: VideoUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<VideoProvider>('doodstream');
  const { toast } = useToast();
  
  const providers = VideoProviderManager.getAllProviders();
  const currentProviderConfig = VideoProviderManager.getProviderConfig(selectedProvider);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("File input triggered", event);
    const selectedFile = event.target.files?.[0];
    console.log("Selected file:", selectedFile);
    if (selectedFile) {
      // Validasi file
      const maxSize = 2 * 1024 * 1024 * 1024; // 2GB
      const allowedTypes = ['video/mp4', 'video/avi', 'video/mkv', 'video/mov'];
      
      if (!allowedTypes.includes(selectedFile.type)) {
        toast({
          title: "Format file tidak didukung",
          description: "Hanya mendukung MP4, AVI, MKV, dan MOV",
          variant: "destructive"
        });
        return;
      }
      
      if (selectedFile.size > maxSize) {
        toast({
          title: "File terlalu besar",
          description: "Maksimal ukuran file adalah 2GB",
          variant: "destructive"
        });
        return;
      }
      
      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadResult(null);

    try {
      // Progress simulation
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 5; // Slower progress for dual upload
        });
      }, 800);

      // Upload to BOTH providers simultaneously
      const [doodResult, luluResult] = await Promise.allSettled([
        VideoProviderManager.uploadVideo('doodstream', file, title),
        VideoProviderManager.uploadVideo('lulustream', file, title).catch(error => {
          console.error("LuluStream upload failed:", error);
          throw error;
        })
      ]);

      console.log("Doodstream result:", doodResult);
      console.log("LuluStream result:", luluResult);

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Process results
      let doodFileCode = null;
      let luluFileCode = null;
      let errors = [];

      if (doodResult.status === 'fulfilled' && doodResult.value?.success) {
        doodFileCode = doodResult.value.file_code;
        console.log("Doodstream success:", doodFileCode);
      } else {
        console.error("Doodstream failed:", doodResult.status === 'rejected' ? doodResult.reason : 'Unknown error');
        errors.push('Doodstream: ' + (doodResult.status === 'rejected' ? doodResult.reason?.message : 'Upload failed'));
      }

      if (luluResult.status === 'fulfilled' && luluResult.value?.success) {
        luluFileCode = luluResult.value.file_code;
        console.log("LuluStream success:", luluFileCode);
      } else {
        console.error("LuluStream failed:", luluResult.status === 'rejected' ? luluResult.reason : 'Unknown error');
        errors.push('LuluStream: ' + (luluResult.status === 'rejected' ? luluResult.reason?.message : 'Upload failed'));
      }

      if (doodFileCode || luluFileCode) {
        // Prioritize LuluStream thumbnail if available
        const thumbnailUrl = luluFileCode 
          ? `https://lulustream.com/thumbs/${luluFileCode}.jpg`
          : doodFileCode 
          ? `https://img.doodcdn.io/thumbnails/${doodFileCode}.jpg`
          : null;

        // Create single video record with both file codes
        const { error } = await supabase
          .from('videos')
          .insert({
            title: title,
            description: '',
            doodstream_file_code: doodFileCode,
            lulustream_file_code: luluFileCode,
            primary_provider: luluFileCode ? 'lulustream' : 'doodstream', // Prioritize LuluStream
            file_code: luluFileCode || doodFileCode, // Prioritize LuluStream
            provider: luluFileCode ? 'lulustream' : 'doodstream', // Prioritize LuluStream
            thumbnail_url: thumbnailUrl,
            status: 'processing',
            views: 0
          });

        if (error) {
          console.error('Error saving to database:', error);
        }

        const successCount = (doodFileCode ? 1 : 0) + (luluFileCode ? 1 : 0);
        const result = {
          success: true,
          file_code: doodFileCode || luluFileCode,
          doodstream_file_code: doodFileCode,
          lulustream_file_code: luluFileCode,
          message: `Upload berhasil ke ${successCount}/2 provider${errors.length > 0 ? ` (${errors.length} error)` : ''}`
        };

        setUploadResult(result);
        
        toast({
          title: "Upload Berhasil!",
          description: `Video berhasil diupload ke ${successCount} dari 2 provider`,
        });
        
        onUploadComplete?.(doodFileCode || luluFileCode, result, doodFileCode ? 'doodstream' : 'lulustream');
      } else {
        throw new Error('Upload gagal ke semua provider: ' + errors.join(', '));
      }

    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload gagal",
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat upload",
        variant: "destructive"
      });
      setUploadResult({
        success: false,
        error: error instanceof Error ? error.message : "Upload gagal"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setTitle("");
    setUploadProgress(0);
    setUploadResult(null);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Video className="w-5 h-5" />
          Upload Video ke Dual Provider
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Provider Selection - Remove since we upload to both */}
        <div className="bg-gradient-to-r from-blue-900/20 to-green-900/20 border border-blue-500/30 p-4 rounded-lg mb-6">
          <h4 className="font-medium text-blue-300 mb-2">🚀 Dual Provider Upload</h4>
          <p className="text-blue-200 text-sm">
            Video akan diupload otomatis ke KEDUA provider sekaligus untuk redundansi maksimal.
          </p>
          <div className="flex gap-4 mt-3 text-xs">
            <div className="flex items-center gap-1 text-blue-400">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span>Doodstream</span>
            </div>
            <div className="flex items-center gap-1 text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>LuluStream</span>
            </div>
          </div>
        </div>

        {!file ? (
          // File Selection
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground mb-2">
              Pilih video untuk diunggah
            </p>
            <p className="text-muted-foreground mb-4">
              Mendukung MP4, AVI, MKV, MOV (maksimal 2GB)
            </p>
            <input
              ref={(input) => {
                if (input) {
                  console.log("File input ref assigned:", input);
                }
              }}
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="hidden"
              id="video-upload-input"
            />
            <Button 
              variant="hero" 
              type="button"
              className="cursor-pointer w-full"
              onClick={() => {
                console.log("Button clicked, triggering file input");
                const input = document.getElementById('video-upload-input') as HTMLInputElement;
                console.log("Input element found:", input);
                input?.click();
              }}
            >
              Pilih File
            </Button>
          </div>
        ) : (
          // Upload Form
          <div className="space-y-4">
            {/* File Info */}
            <div className="bg-muted/30 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <Video className="w-8 h-8 text-primary" />
                <div className="flex-1">
                  <p className="font-medium text-foreground">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / (1024 * 1024)).toFixed(1)} MB
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={resetUpload}
                  disabled={isUploading}
                >
                  Ganti
                </Button>
              </div>
            </div>

            {/* Title Input */}
            <div className="space-y-2">
              <Label htmlFor="video-title" className="text-foreground">
                Judul Video
              </Label>
              <Input
                id="video-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Masukkan judul video"
                className="bg-muted/30 border-muted"
                disabled={isUploading}
              />
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-foreground">Mengupload ke Kedua Provider...</span>
                  <span className="text-muted-foreground">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            {/* Upload Result */}
            {uploadResult && (
              <div className={`p-4 rounded-lg border ${
                uploadResult.success 
                  ? 'bg-green-900/20 border-green-500/50 text-green-300' 
                  : 'bg-red-900/20 border-red-500/50 text-red-300'
              }`}>
                <div className="flex items-center gap-2">
                  {uploadResult.success ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <AlertCircle className="w-5 h-5" />
                  )}
                  <span className="font-medium">
                    {uploadResult.success ? 'Upload Berhasil!' : 'Upload Gagal'}
                  </span>
                </div>
                {uploadResult.success && (
                  <>
                    {uploadResult.doodstream_file_code && (
                      <p className="text-sm mt-2 text-muted-foreground">
                        Doodstream: {uploadResult.doodstream_file_code}
                      </p>
                    )}
                    {uploadResult.lulustream_file_code && (
                      <p className="text-sm mt-2 text-muted-foreground">
                        LuluStream: {uploadResult.lulustream_file_code}
                      </p>
                    )}
                  </>
                )}
                {uploadResult.error && (
                  <p className="text-sm mt-2">
                    Error: {uploadResult.error}
                  </p>
                )}
              </div>
            )}

            {/* Upload Button */}
            <Button 
              onClick={handleUpload}
              disabled={!title.trim() || isUploading}
              variant="hero"
              className="w-full"
              size="lg"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Mengupload ke Kedua Provider...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload ke Dual Provider
                </>
              )}
            </Button>
          </div>
        )}

        {/* Info */}
        <div className="bg-muted/20 p-4 rounded-lg">
          <h4 className="font-medium text-foreground mb-2">Informasi Upload</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Video akan diupload ke KEDUA provider sekaligus</li>
            <li>• Doodstream & LuluStream untuk redundansi maksimal</li>
            <li>• User nanti bisa pilih Stream 1 atau Stream 2</li>
            <li>• Proses upload dapat memakan waktu tergantung ukuran file</li>
            <li>• Pastikan koneksi internet stabil selama upload</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoUpload;