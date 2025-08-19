import { useState } from "react";
import { Upload, Video, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { SecureDoodstreamAPI } from "@/lib/supabase-doodstream";

interface UploadResponse {
  success: boolean;
  file_code?: string;
  message?: string;
  error?: string;
}

interface VideoUploadProps {
  onUploadComplete?: (fileCode: string, videoData: any) => void;
}

const VideoUpload = ({ onUploadComplete }: VideoUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
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
      // Simulasi progress (karena upload berjalan di background)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 500);

      // Upload menggunakan SecureDoodstreamAPI (melalui edge function)
      const result = await SecureDoodstreamAPI.uploadVideo(file, title);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadResult(result);

      if (result.success && result.file_code) {
        toast({
          title: "Upload berhasil!",
          description: "Video telah berhasil diunggah ke Doodstream",
        });
        
        // Dapatkan info video yang baru diunggah
        try {
          const videoInfo = await SecureDoodstreamAPI.getVideoInfo(result.file_code, true);
          onUploadComplete?.(result.file_code, videoInfo);
        } catch (error) {
          console.error("Error getting video info:", error);
          onUploadComplete?.(result.file_code, null);
        }
      } else {
        throw new Error(result.error || "Upload gagal");
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
        <CardTitle className="flex items-center gap-2 text-white">
          <Video className="w-5 h-5" />
          Upload Video ke Doodstream
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {!file ? (
          // File Selection
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium text-white mb-2">
              Pilih video untuk diunggah
            </p>
            <p className="text-muted-foreground mb-4">
              Mendukung MP4, AVI, MKV, MOV (maksimal 2GB)
            </p>
            <input
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="hidden"
              id="video-upload"
            />
            <Label htmlFor="video-upload">
              <Button variant="hero" className="cursor-pointer">
                Pilih File
              </Button>
            </Label>
          </div>
        ) : (
          // Upload Form
          <div className="space-y-4">
            {/* File Info */}
            <div className="bg-muted/30 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <Video className="w-8 h-8 text-primary" />
                <div className="flex-1">
                  <p className="font-medium text-white">{file.name}</p>
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
              <Label htmlFor="video-title" className="text-white">
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
                  <span className="text-white">Mengupload...</span>
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
                {uploadResult.success && uploadResult.file_code && (
                  <p className="text-sm mt-2 text-muted-foreground">
                    File Code: {uploadResult.file_code}
                  </p>
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
                  Mengupload...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload ke Doodstream
                </>
              )}
            </Button>
          </div>
        )}

        {/* Info */}
        <div className="bg-muted/20 p-4 rounded-lg">
          <h4 className="font-medium text-white mb-2">Informasi Upload</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Video akan diproses otomatis setelah upload</li>
            <li>• Embed link akan tersedia setelah pemrosesan selesai</li>
            <li>• Proses upload dapat memakan waktu tergantung ukuran file</li>
            <li>• Pastikan koneksi internet stabil selama upload</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoUpload;