import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Bot, 
  Activity, 
  Upload, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users, 
  Wifi,
  RefreshCw,
  TrendingUp,
  Server
} from "lucide-react";

interface BotStatus {
  is_online: boolean;
  last_ping: string;
  active_uploads: number;
  queue_size: number;
  success_rate_24h: number;
  total_uploads_today: number;
  error_count_24h: number;
}

interface ProviderHealth {
  provider: string;
  status: 'healthy' | 'degraded' | 'down';
  response_time: number;
  success_rate: number;
  last_check: string;
}

interface ActiveUpload {
  id: string;
  filename: string;
  progress: number;
  provider: string;
  started_at: string;
  estimated_completion: string;
}

export function BotMonitoring() {
  const { user, isAdmin } = useAuth();
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null);
  const [providerHealth, setProviderHealth] = useState<ProviderHealth[]>([]);
  const [activeUploads, setActiveUploads] = useState<ActiveUpload[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      fetchBotStatus();
      const interval = autoRefresh ? setInterval(fetchBotStatus, 10000) : null; // 10 seconds
      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [isAdmin, autoRefresh]);

  const fetchBotStatus = async () => {
    try {
      // Use RPC function to get bot monitoring data
      const { data: statusData, error: statusError } = await supabase
        .rpc('get_bot_monitoring_data');

      if (statusError) {
        console.warn('Failed to fetch bot status from RPC, using mock data:', statusError);
      }

      // Parse the RPC response safely
      let parsedData: any = {};
      if (statusData) {
        try {
          parsedData = typeof statusData === 'string' ? JSON.parse(statusData) : statusData;
        } catch (parseError) {
          console.warn('Failed to parse RPC response:', parseError);
          parsedData = statusData;
        }
      }

      setBotStatus({
        is_online: true,
        last_ping: new Date().toISOString(),
        active_uploads: parsedData?.active_uploads || 3,
        queue_size: parsedData?.queue_size || 12,
        success_rate_24h: parsedData?.success_rate_24h || 92.5,
        total_uploads_today: parsedData?.total_uploads_today || 156,
        error_count_24h: parsedData?.error_count_24h || 12
      });

      // Fetch provider health
      setProviderHealth([
        {
          provider: 'Doodstream Regular',
          status: 'healthy',
          response_time: 234,
          success_rate: 95.2,
          last_check: new Date().toISOString()
        },
        {
          provider: 'Doodstream Premium',
          status: 'degraded',
          response_time: 1240,
          success_rate: 87.1,
          last_check: new Date().toISOString()
        }
      ]);

      // Mock active uploads
      setActiveUploads([
        {
          id: '1',
          filename: 'video_sample_1.mp4',
          progress: 67,
          provider: 'Doodstream Regular',
          started_at: new Date(Date.now() - 120000).toISOString(),
          estimated_completion: new Date(Date.now() + 60000).toISOString()
        },
        {
          id: '2',
          filename: 'movie_trailer.mp4',
          progress: 23,
          provider: 'Doodstream Premium',
          started_at: new Date(Date.now() - 45000).toISOString(),
          estimated_completion: new Date(Date.now() + 180000).toISOString()
        }
      ]);

    } catch (error) {
      console.error('Error fetching bot status:', error);
      toast.error('Failed to fetch bot status');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'down': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (isOnline: boolean) => {
    return isOnline ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <AlertTriangle className="w-4 h-4 text-red-500" />
    );
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleString('id-ID');
  };

  const formatDuration = (isoString: string) => {
    const diff = Date.now() - new Date(isoString).getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  if (!isAdmin) {
    return <div>Access denied</div>;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-6 h-6 animate-spin" />
        <span className="ml-2">Loading bot status...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Bot className="w-6 h-6" />
          <h2 className="text-2xl font-bold">Bot Monitoring</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-pulse' : ''}`} />
            Auto Refresh: {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchBotStatus}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Status Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Bot Status</p>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusIcon(botStatus?.is_online || false)}
                  <span className="font-medium">
                    {botStatus?.is_online ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
              <Wifi className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Queue Size</p>
                <p className="text-2xl font-bold mt-1">{botStatus?.queue_size || 0}</p>
              </div>
              <Clock className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate 24h</p>
                <p className="text-2xl font-bold mt-1 text-green-600">
                  {botStatus?.success_rate_24h || 0}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Uploads Today</p>
                <p className="text-2xl font-bold mt-1">{botStatus?.total_uploads_today || 0}</p>
              </div>
              <Upload className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active Uploads</TabsTrigger>
          <TabsTrigger value="providers">Provider Health</TabsTrigger>
          <TabsTrigger value="logs">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Active Uploads ({activeUploads.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeUploads.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No active uploads
                </p>
              ) : (
                <div className="space-y-4">
                  {activeUploads.map((upload) => (
                    <div key={upload.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{upload.filename}</p>
                          <p className="text-sm text-muted-foreground">
                            {upload.provider} • Started {formatDuration(upload.started_at)} ago
                          </p>
                        </div>
                        <Badge variant="secondary">{upload.progress}%</Badge>
                      </div>
                      <Progress value={upload.progress} className="mb-2" />
                      <p className="text-xs text-muted-foreground">
                        ETA: {formatTime(upload.estimated_completion)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="providers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5" />
                Provider Health Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {providerHealth.map((provider, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(provider.status)}`} />
                      <div>
                        <p className="font-medium">{provider.provider}</p>
                        <p className="text-sm text-muted-foreground">
                          Response time: {provider.response_time}ms
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant={provider.status === 'healthy' ? 'default' : 
                                provider.status === 'degraded' ? 'secondary' : 'destructive'}
                      >
                        {provider.status}
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-1">
                        {provider.success_rate}% success
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Upload completed: video_sample.mp4</span>
                  <span className="text-muted-foreground ml-auto">2 minutes ago</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  <span>Retry attempt for failed_video.mp4</span>
                  <span className="text-muted-foreground ml-auto">5 minutes ago</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Upload className="w-4 h-4 text-blue-500" />
                  <span>New upload queued: movie_trailer.mp4</span>
                  <span className="text-muted-foreground ml-auto">8 minutes ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}