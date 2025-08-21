import React from "react";
import { useState } from "react";
import { 
  BarChart3, 
  Eye, 
  Users, 
  Video, 
  RefreshCw, 
  Settings,
  Download,
  Upload,
  Hash,
  Globe,
  TrendingUp,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { SecureDoodstreamAPI } from "@/lib/supabase-doodstream";
import { VideoProviderManager } from "@/lib/video-provider-manager";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

const QuickActions = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSyncingDood, setIsSyncingDood] = useState(false);
  const [isSyncingLulu, setIsSyncingLulu] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const { toast } = useToast();

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      // Sync both providers in parallel
      const [doodResult, luluResult] = await Promise.allSettled([
        VideoProviderManager.syncVideos('doodstream'),
        VideoProviderManager.syncVideos('lulustream')
      ]);
      
      let successCount = 0;
      let errors = [];
      
      if (doodResult.status === 'fulfilled') {
        successCount++;
        console.log('Doodstream sync result:', doodResult.value);
      } else {
        errors.push('Doodstream: ' + doodResult.reason?.message);
      }
      
      if (luluResult.status === 'fulfilled') {
        successCount++;
        console.log('LuluStream sync result:', luluResult.value);
      } else {
        errors.push('LuluStream: ' + luluResult.reason?.message);
      }

      if (successCount > 0) {
        toast({
          title: "Berhasil",
          description: `Video berhasil disinkronisasi dari ${successCount} provider${errors.length > 0 ? ` (${errors.length} error)` : ''}`,
        });
      } else {
        toast({
          title: "Error", 
          description: "Gagal melakukan sinkronisasi dari semua provider",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal melakukan sinkronisasi",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncDoodstream = async () => {
    setIsSyncingDood(true);
    try {
      await VideoProviderManager.syncVideos('doodstream');
      toast({
        title: "Berhasil",
        description: "Video berhasil disinkronisasi dari Doodstream",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal sinkronisasi Doodstream",
        variant: "destructive",
      });
    } finally {
      setIsSyncingDood(false);
    }
  };

  const handleSyncLuluStream = async () => {
    setIsSyncingLulu(true);
    try {
      await VideoProviderManager.syncVideos('lulustream');
      toast({
        title: "Berhasil", 
        description: "Video berhasil disinkronisasi dari LuluStream",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal sinkronisasi LuluStream",
        variant: "destructive",
      });
    } finally {
      setIsSyncingLulu(false);
    }
  };

  const loadStats = async () => {
    setIsLoadingStats(true);
    try {
      const [videoCount, doodAccountInfo, luluAccountInfo] = await Promise.allSettled([
        supabase.from('videos').select('id, provider', { count: 'exact' }),
        VideoProviderManager.getAccountInfo('doodstream'),
        VideoProviderManager.getAccountInfo('lulustream')
      ]);

      let totalVideos = 0;
      let doodVideos = 0; 
      let luluVideos = 0;
      let accountData: any = {};

      if (videoCount.status === 'fulfilled') {
        totalVideos = videoCount.value.count || 0;
        const videos = videoCount.value.data || [];
        doodVideos = videos.filter(v => v.provider === 'doodstream').length;
        luluVideos = videos.filter(v => v.provider === 'lulustream').length;
      }

      if (doodAccountInfo.status === 'fulfilled') {
        accountData.doodstream = {
          storageUsed: doodAccountInfo.value.result?.storage_used || '0',
          storageLeft: doodAccountInfo.value.result?.storage_left || '0', 
          balance: doodAccountInfo.value.result?.balance || '0'
        };
      }

      if (luluAccountInfo.status === 'fulfilled') {
        accountData.lulustream = {
          storageUsed: luluAccountInfo.value.result?.storage_used || '0',
          storageLeft: luluAccountInfo.value.result?.storage_left || '0',
          balance: luluAccountInfo.value.result?.balance || '0' 
        };
      }

      setStats({
        totalVideos,
        doodVideos,
        luluVideos,
        ...accountData
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const quickActions = [
    {
      title: "Sync Multi-Provider",
      description: "Sinkronkan semua provider sekaligus",
      icon: RefreshCw,
      action: handleSync,
      loading: isSyncing,
      variant: "default" as const,
      color: "text-blue-500"
    },
    {
      title: "Sync Doodstream",
      description: "Sinkronkan dari Doodstream saja", 
      icon: RefreshCw,
      action: handleSyncDoodstream,
      loading: isSyncingDood,
      variant: "outline" as const,
      color: "text-blue-400"
    },
    {
      title: "Sync LuluStream",
      description: "Sinkronkan dari LuluStream saja",
      icon: RefreshCw, 
      action: handleSyncLuluStream,
      loading: isSyncingLulu,
      variant: "outline" as const,
      color: "text-green-400"
    },
    {
      title: "Kelola Video", 
      description: "Edit dan atur video",
      icon: Video,
      href: "#videos",
      variant: "outline" as const,
      color: "text-green-500"
    },
    {
      title: "Upload Video",
      description: "Upload ke provider pilihan", 
      icon: Upload,
      href: "#upload",
      variant: "outline" as const,
      color: "text-purple-500"
    },
    {
      title: "Pengaturan Web",
      description: "Atur tampilan website",
      icon: Globe,
      href: "#website", 
      variant: "outline" as const,
      color: "text-purple-500"
    },
    {
      title: "Kelola Hashtag",
      description: "Organisir tag video",
      icon: Hash,
      href: "#hashtags",
      variant: "outline" as const,
      color: "text-yellow-500"
    },
    {
      title: "Lihat Statistik",
      description: "Muat data terkini",
      icon: BarChart3,
      action: loadStats,
      loading: isLoadingStats,
      variant: "outline" as const,
      color: "text-red-500"
    },
    {
      title: "Pengaturan Provider",
      description: "Konfigurasi Multi-Provider",
      icon: Settings,
      href: "#settings",
      variant: "outline" as const,
      color: "text-gray-500"
    }
  ];

  const handleActionClick = (action: any) => {
    if (action.href) {
      // Scroll to section
      const element = document.querySelector(action.href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (action.action) {
      action.action();
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-4 text-center">
              <Video className="w-6 h-6 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-foreground">{stats.totalVideos}</div>
              <div className="text-xs text-muted-foreground">Total Video</div>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-4 text-center">
              <div className="w-6 h-6 text-blue-400 mx-auto mb-2 font-bold">D</div>
              <div className="text-2xl font-bold text-foreground">{stats.doodVideos}</div>
              <div className="text-xs text-muted-foreground">Doodstream</div>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-4 text-center">
              <div className="w-6 h-6 text-green-400 mx-auto mb-2 font-bold">L</div>
              <div className="text-2xl font-bold text-foreground">{stats.luluVideos}</div>
              <div className="text-xs text-muted-foreground">LuluStream</div>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-4 text-center">
              <Activity className="w-6 h-6 text-purple-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-foreground">
                ${stats.doodstream?.balance || stats.lulustream?.balance || '0'}
              </div>
              <div className="text-xs text-muted-foreground">Balance</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions Grid */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  variant={action.variant}
                  className="h-auto p-4 flex flex-col items-start gap-3 bg-background/50 hover:bg-background/80 border-border/50"
                  onClick={() => handleActionClick(action)}
                  disabled={action.loading}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className={`p-2 rounded-lg bg-card/30 ${action.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-foreground">{action.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {action.description}
                      </div>
                    </div>
                  </div>
                  {action.loading && (
                    <Badge variant="secondary" className="self-end">
                      Loading...
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Aktivitas Terbaru
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 p-3 bg-background/30 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-muted-foreground">Sistem siap digunakan</span>
              <Badge variant="outline" className="ml-auto">Aktif</Badge>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-background/30 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-muted-foreground">Koneksi Doodstream tersedia</span>
              <Badge variant="outline" className="ml-auto">Online</Badge>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-background/30 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-muted-foreground">Koneksi LuluStream tersedia</span>
              <Badge variant="outline" className="ml-auto">Online</Badge>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-background/30 rounded-lg">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-muted-foreground">Multi-Provider System aktif</span>
              <Badge variant="outline" className="ml-auto">Ready</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuickActions;