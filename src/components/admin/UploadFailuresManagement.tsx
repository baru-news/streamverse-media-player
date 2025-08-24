import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Copy, 
  ExternalLink,
  Clock,
  AlertTriangle,
  FileX
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface UploadFailure {
  id: string;
  video_id: string;
  upload_type: string;
  attempt_count: number;
  error_details: any;
  requires_manual_upload: boolean;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  video?: {
    title: string;
    regular_file_code: string;
    premium_file_code: string;
  };
}

export const UploadFailuresManagement = () => {
  const { user } = useAuth();
  const [failures, setFailures] = useState<UploadFailure[]>([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchFailures();
    }
  }, [user]);

  const fetchFailures = async () => {
    try {
      const { data, error } = await supabase
        .from('upload_failures')
        .select(`
          *,
          video:videos(title, regular_file_code, premium_file_code)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFailures(data || []);
    } catch (error) {
      console.error('Error fetching upload failures:', error);
      toast.error('Gagal memuat data upload failures');
    } finally {
      setLoading(false);
    }
  };

  const retryUpload = async (failureId: string) => {
    setRetrying(failureId);
    try {
      // Implement retry logic here
      // This would call the doodstream-premium function to retry the failed upload
      
      toast.success('Upload retry berhasil dimulai');
      await fetchFailures();
    } catch (error) {
      console.error('Error retrying upload:', error);
      toast.error('Gagal retry upload');
    } finally {
      setRetrying(null);
    }
  };

  const markAsManuallyResolved = async (failureId: string, fileCode: string) => {
    try {
      const failure = failures.find(f => f.id === failureId);
      if (!failure) return;

      // Update the video record with the manually uploaded file code
      const updateField = failure.upload_type === 'regular' ? 'regular_file_code' : 'premium_file_code';
      
      const { error: videoError } = await supabase
        .from('videos')
        .update({ [updateField]: fileCode })
        .eq('id', failure.video_id);

      if (videoError) throw videoError;

      // Mark failure as resolved
      const { error } = await supabase
        .from('upload_failures')
        .update({ resolved_at: new Date().toISOString() })
        .eq('id', failureId);

      if (error) throw error;

      toast.success('Upload failure berhasil diresolve');
      await fetchFailures();
    } catch (error) {
      console.error('Error resolving upload failure:', error);
      toast.error('Gagal resolve upload failure');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const unresolvedFailures = failures.filter(f => !f.resolved_at);
  const resolvedFailures = failures.filter(f => f.resolved_at);

  const getFailureStatusColor = (failure: UploadFailure) => {
    if (failure.resolved_at) return 'success';
    if (failure.requires_manual_upload) return 'destructive';
    if (failure.attempt_count >= 3) return 'warning';
    return 'secondary';
  };

  const getFailureStatusText = (failure: UploadFailure) => {
    if (failure.resolved_at) return 'Resolved';
    if (failure.requires_manual_upload) return 'Manual Required';
    if (failure.attempt_count >= 3) return 'Max Retries';
    return `${failure.attempt_count} Attempts`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileX className="h-5 w-5" />
            Upload Failures Management
          </CardTitle>
          <CardDescription>
            Kelola upload yang gagal dan retry manual uploads
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-destructive">{unresolvedFailures.length}</div>
                <div className="text-sm text-muted-foreground">Unresolved</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success">{resolvedFailures.length}</div>
                <div className="text-sm text-muted-foreground">Resolved</div>
              </div>
            </div>
            <Button onClick={fetchFailures} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          <Tabs defaultValue="unresolved" className="space-y-4">
            <TabsList>
              <TabsTrigger value="unresolved" className="relative">
                Unresolved
                {unresolvedFailures.length > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                    {unresolvedFailures.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="resolved">Resolved</TabsTrigger>
            </TabsList>

            <TabsContent value="unresolved" className="space-y-4">
              {unresolvedFailures.length === 0 ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Tidak ada upload failures yang belum resolved! 🎉
                  </AlertDescription>
                </Alert>
              ) : (
                unresolvedFailures.map((failure) => (
                  <Card key={failure.id} className="border-l-4 border-l-destructive">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="space-y-2">
                           <div className="flex items-center gap-2">
                             <h4 className="font-semibold">{failure.video?.title || 'Unknown Video'}</h4>
                             <Badge variant="outline">
                               {getFailureStatusText(failure)}
                             </Badge>
                             <Badge variant="outline">
                               {failure.upload_type}
                             </Badge>
                           </div>
                          <p className="text-sm text-muted-foreground">
                            Video ID: {failure.video_id}
                          </p>
                          <div className="text-sm">
                            <span className="font-medium text-destructive">Error: </span>
                            {failure.error_details?.error || 'Unknown error'}
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          {failure.attempt_count < 3 && !failure.requires_manual_upload && (
                            <Button 
                              size="sm" 
                              onClick={() => retryUpload(failure.id)}
                              disabled={retrying === failure.id}
                            >
                              {retrying === failure.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <RefreshCw className="h-4 w-4 mr-2" />
                              )}
                              Retry
                            </Button>
                          )}
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(failure.video_id)}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy ID
                          </Button>
                        </div>
                      </div>

                      {failure.requires_manual_upload && (
                        <Alert className="mt-4">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription className="space-y-2">
                            <p>Upload gagal setelah 3 percobaan. Silakan upload manual:</p>
                            <div className="font-mono text-sm bg-muted p-2 rounded">
                              <p><strong>File:</strong> {failure.video?.title}</p>
                              {failure.upload_type === 'regular' ? (
                                <p><strong>Regular Code:</strong> {failure.video?.regular_file_code || 'Not available'}</p>
                              ) : (
                                <p><strong>Premium Code needed</strong></p>
                              )}
                            </div>
                            <div className="flex gap-2 mt-2">
                              <Button 
                                size="sm" 
                                onClick={() => {
                                  const fileCode = prompt('Masukkan file code yang berhasil diupload manual:');
                                  if (fileCode) {
                                    markAsManuallyResolved(failure.id, fileCode);
                                  }
                                }}
                              >
                                Mark as Resolved
                              </Button>
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      <div className="flex justify-between items-center mt-4 text-xs text-muted-foreground">
                        <span>Created: {new Date(failure.created_at).toLocaleString()}</span>
                        <span>Updated: {new Date(failure.updated_at).toLocaleString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="resolved" className="space-y-4">
              {resolvedFailures.map((failure) => (
                <Card key={failure.id} className="border-l-4 border-l-success">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                         <div className="flex items-center gap-2">
                           <h4 className="font-semibold">{failure.video?.title || 'Unknown Video'}</h4>
                           <Badge variant="outline">Resolved</Badge>
                           <Badge variant="outline">{failure.upload_type}</Badge>
                         </div>
                        <p className="text-sm text-muted-foreground">
                          Resolved: {failure.resolved_at ? new Date(failure.resolved_at).toLocaleString() : 'Unknown'}
                        </p>
                      </div>
                      <CheckCircle className="h-5 w-5 text-success" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};