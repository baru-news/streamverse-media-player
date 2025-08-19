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
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

const QuickActions = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const { toast } = useToast();

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await SecureDoodstreamAPI.syncVideos();
      toast({
        title: "Berhasil",
        description: "Video berhasil disinkronisasi dari Doodstream",
      });
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

  const loadStats = async () => {
    setIsLoadingStats(true);
    try {
      const [videoCount, accountInfo] = await Promise.all([
        supabase.from('videos').select('id', { count: 'exact' }),
        SecureDoodstreamAPI.getAccountInfo()
      ]);

      setStats({
        totalVideos: videoCount.count || 0,
        storageUsed: accountInfo.storage_used || '0 GB',
        storageLeft: accountInfo.storage_left || '0 GB',
        balance: accountInfo.balance || '0'
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const quickActions = [
    {
      title: "Sync Video",
      description: "Sinkronkan video dari Doodstream",
      icon: RefreshCw,
      action: handleSync,
      loading: isSyncing,
      variant: "default" as const,
      color: "text-blue-500"
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
      title: "Pengaturan Doodstream",
      description: "Konfigurasi API",
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
              <div className="text-2xl font-bold text-white">{stats.totalVideos}</div>
              <div className="text-xs text-muted-foreground">Total Video</div>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-4 text-center">
              <Activity className="w-6 h-6 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">${stats.balance}</div>
              <div className="text-xs text-muted-foreground">Balance</div>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-4 text-center">
              <Download className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stats.storageUsed}</div>
              <div className="text-xs text-muted-foreground">Storage Used</div>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-4 text-center">
              <Upload className="w-6 h-6 text-purple-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stats.storageLeft}</div>
              <div className="text-xs text-muted-foreground">Storage Left</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions Grid */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
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
                      <div className="font-medium text-white">{action.title}</div>
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
          <CardTitle className="text-white flex items-center gap-2">
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
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-muted-foreground">Panel admin siap digunakan</span>
              <Badge variant="outline" className="ml-auto">Siap</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuickActions;