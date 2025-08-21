import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Database, Upload, BarChart } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { VideoProviderManager } from "@/lib/video-provider-manager";
import { supabase } from "@/integrations/supabase/client";

export default function QuickActions() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [stats, setStats] = useState({
    totalVideos: 0,
    doodstreamVideos: 0,
    accountInfo: null as any
  });

  // Sync videos from DoodStream
  const handleSyncAllProviders = async () => {
    setIsSyncing(true);
    try {
      const doodResult = await VideoProviderManager.syncVideos('doodstream');
      
      toast({
        title: "Berhasil", 
        description: "Video berhasil disinkronisasi dari DoodStream",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal sinkronisasi DoodStream",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const loadStats = async () => {
    setIsLoadingStats(true);
    try {
      const [videoCount, doodAccountInfo] = await Promise.allSettled([
        supabase.from('videos').select('id, provider', { count: 'exact' }),
        VideoProviderManager.getAccountInfo('doodstream')
      ]);

      let totalVideos = 0;
      let doodVideos = 0; 
      let accountData: any = {};

      if (videoCount.status === 'fulfilled') {
        totalVideos = videoCount.value.count || 0;
        const videos = videoCount.value.data || [];
        doodVideos = videos.filter(v => v.provider === 'doodstream').length;
      }

      if (doodAccountInfo.status === 'fulfilled') {
        accountData.doodstream = doodAccountInfo.value;
      }

      setStats({
        totalVideos,
        doodstreamVideos: doodVideos,
        accountInfo: accountData
      });

    } catch (error) {
      console.error("Error loading stats:", error);
      toast({
        title: "Error",
        description: "Gagal memuat statistik",
        variant: "destructive",
      });
    } finally {
      setIsLoadingStats(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Sinkronisasi Video
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button 
              onClick={handleSyncAllProviders}
              disabled={isSyncing}
              className="flex items-center gap-2"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sinkronisasi...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  Sync DoodStream
                </>
              )}
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Sinkronkan video dari DoodStream ke database lokal. 
            Proses ini akan memperbarui daftar video terbaru.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="w-5 h-5" />
            Statistik
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={loadStats}
            disabled={isLoadingStats}
            variant="outline"
            className="flex items-center gap-2"
          >
            {isLoadingStats ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <BarChart className="w-4 h-4" />
                Load Stats
              </>
            )}
          </Button>

          {stats.totalVideos > 0 && (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted/30 rounded-lg text-center">
                <div className="text-2xl font-bold text-primary">{stats.totalVideos}</div>
                <div className="text-sm text-muted-foreground">Total Video</div>
              </div>
              
              <div className="p-3 bg-muted/30 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-500">{stats.doodstreamVideos}</div>
                <div className="text-sm text-muted-foreground">DoodStream</div>
              </div>
            </div>
          )}

          {stats.accountInfo?.doodstream && (
            <div className="p-3 bg-muted/30 rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Badge variant="secondary">DoodStream</Badge>
                Account Info
              </h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>Email: {stats.accountInfo.doodstream.result?.email || 'N/A'}</div>
                <div>Storage Used: {stats.accountInfo.doodstream.result?.storage_used || 'N/A'}</div>
                <div>Files: {stats.accountInfo.doodstream.result?.files || 'N/A'}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}