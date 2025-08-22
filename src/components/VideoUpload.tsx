import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { VideoProviderManager } from "@/lib/video-provider-manager";
import { supabase } from "@/integrations/supabase/client";
import type { VideoProvider } from "@/lib/video-provider-manager";

interface UploadResponse {
  success: boolean;
  file_code?: string;
  doodstream_file_code?: string;
  message?: string;
  error?: string;
}

interface VideoUploadProps {
  onUploadComplete?: (fileCode: string, videoData: any, provider: VideoProvider) => void;
}

export default function VideoUpload({ onUploadComplete }: VideoUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoTitle, setVideoTitle] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResults, setUploadResults] = useState<{
    doodstream?: UploadResponse;
  } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['video/mp4', 'video/avi', 'video/mkv', 'video/mov', 'video/wmv'];
      if (!validTypes.includes(file.type)) {
        toast.error("Format file tidak didukung. Silakan pilih file video (MP4, AVI, MKV, MOV, WMV)");
        return;
      }

      // Validate file size (max 2GB)
      const maxSize = 2 * 1024 * 1024 * 1024; // 2GB in bytes
      if (file.size > maxSize) {
        toast.error("Ukuran file terlalu besar. Maksimal 2GB");
        return;
      }

      setSelectedFile(file);
      setVideoTitle(file.name.replace(/\.[^/.]+$/, "")); // Remove extension
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUpload = async () => {
    if (!selectedFile || !videoTitle) {
      toast.error("Silakan pilih file dan masukkan judul video");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    setUploadResults(null);

    try {
      // Progress simulation
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 5;
        });
      }, 800);

      // Upload to DoodStream only
      const doodResult = await VideoProviderManager.uploadVideo('doodstream', selectedFile, videoTitle);

      console.log("Doodstream result:", doodResult);

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Process results
      let doodFileCode = null;
      let errors = [];

      if (doodResult.success && doodResult.result?.file_code) {
        doodFileCode = doodResult.result.file_code;
      } else {
        errors.push(`DoodStream: ${doodResult.error || 'Upload gagal'}`);
      }

      if (errors.length > 0) {
        setUploadError(`Upload gagal: ${errors.join(', ')}`);
        toast.error("Upload gagal. Silakan coba lagi.");
        return;
      }

      // If DoodStream upload successful, save to database
      if (doodFileCode) {
        // Use DoodStream thumbnail format
        const thumbnailUrl = `https://img.doodcdn.io/thumbnails/${doodFileCode}.jpg`;

        // Create single video record
        const { error } = await supabase
          .from('videos')
          .insert({
            file_code: doodFileCode,
            title: videoTitle,
            doodstream_file_code: doodFileCode,
            provider: 'doodstream',
            primary_provider: 'doodstream',
            thumbnail_url: thumbnailUrl,
            status: 'processing',
            views: 0
          });

        if (error) {
          console.error("Database insert error:", error);
          toast.error("Video berhasil diupload tapi gagal menyimpan ke database");
        } else {
          console.log("Video successfully saved to database");
        }

        setUploadResults({
          doodstream: { success: true, file_code: doodFileCode }
        });

        toast.success("Video berhasil diupload ke DoodStream!");

        if (onUploadComplete) {
          onUploadComplete(doodFileCode, {
            title: videoTitle,
            file_code: doodFileCode,
            doodstream_file_code: doodFileCode,
            provider: 'doodstream'
          }, 'doodstream');
        }
      }

    } catch (error) {
      console.error("Upload error:", error);
      setUploadError(`Upload gagal: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast.error("Terjadi kesalahan saat upload");
    } finally {
      setIsUploading(false);
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setVideoTitle("");
    setUploadProgress(0);
    setUploadResults(null);
    setUploadError(null);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload Video ke DoodStream
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Info */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Upload video Anda ke platform DoodStream. Video akan otomatis tersimpan dalam database.
          </AlertDescription>
        </Alert>

        {!selectedFile ? (
          /* File Selection */
          <div className="space-y-4">
            <div>
              <Label htmlFor="video-file">Pilih File Video</Label>
              <Input
                id="video-file"
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="mt-1"
              />
            </div>
          </div>
        ) : (
          /* Upload Form */
          <div className="space-y-6">
            {/* File Info */}
            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(selectedFile.size)} • {selectedFile.type}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                >
                  Ganti
                </Button>
              </div>
            </div>

            {/* Title Input */}
            <div>
              <Label htmlFor="video-title">Judul Video</Label>
              <Input
                id="video-title"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                placeholder="Masukkan judul video..."
                className="mt-1"
              />
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Mengupload ke DoodStream...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            {/* Upload Results */}
            {uploadResults && (
              <div className="space-y-3">
                <h3 className="font-medium">Hasil Upload:</h3>
                {uploadResults.doodstream && (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      <div className="flex justify-between">
                        <span>DoodStream: Berhasil</span>
                        <span className="text-xs text-muted-foreground">
                          {uploadResults.doodstream.file_code}
                        </span>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Upload Error */}
            {uploadError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{uploadError}</AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleUpload}
                disabled={isUploading || !videoTitle}
                className="flex-1"
              >
                {isUploading ? "Mengupload..." : "Upload Video"}
              </Button>
              
              {(uploadResults || uploadError) && (
                <Button variant="outline" onClick={resetUpload}>
                  Reset
                </Button>
              )}
            </div>

            {/* Info */}
            <div className="text-sm text-muted-foreground bg-muted/20 p-3 rounded-lg">
              <p className="font-medium mb-1">Informasi Upload:</p>
              <ul className="space-y-1 text-xs">
                <li>• Video akan diupload ke DoodStream</li>
                <li>• Proses mungkin memakan waktu beberapa menit</li>
                <li>• Thumbnail akan otomatis dibuat</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}