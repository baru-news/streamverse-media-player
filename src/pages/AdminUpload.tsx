import { Link } from "react-router-dom";
import { ArrowLeft, List, Settings, Globe, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import WebsiteSettings from "@/components/admin/WebsiteSettings";
import HashtagManagement from "@/components/admin/HashtagManagement";
import QuickActions from "@/components/admin/QuickActions";
import { SecureDoodstreamAPI } from "@/lib/supabase-doodstream";
import EnhancedVideoManager from "@/components/admin/EnhancedVideoManager";

const AdminUpload = () => {
  const { toast } = useToast();

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

          <Tabs defaultValue="dashboard" className="space-y-6" id="admin-tabs">
            <div className="w-full overflow-x-auto scrollbar-hide pb-1">
              <TabsList className="bg-card/50 backdrop-blur-sm inline-flex w-max min-w-full">
                <TabsTrigger value="dashboard" className="gap-2 whitespace-nowrap px-4 py-2">
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                  <span className="sm:hidden">Dash</span>
                </TabsTrigger>
                <TabsTrigger value="website" className="gap-2 whitespace-nowrap px-4 py-2" id="website">
                  <Globe className="w-4 h-4" />
                  <span className="hidden sm:inline">Website</span>
                  <span className="sm:hidden">Web</span>
                </TabsTrigger>
                <TabsTrigger value="hashtags" className="gap-2 whitespace-nowrap px-4 py-2" id="hashtags">
                  <Hash className="w-4 h-4" />
                  <span className="hidden sm:inline">Hashtag</span>
                  <span className="sm:hidden">Tag</span>
                </TabsTrigger>
                <TabsTrigger value="videos" className="gap-2 whitespace-nowrap px-4 py-2" id="videos">
                  <List className="w-4 h-4" />
                  <span className="hidden sm:inline">Kelola Video</span>
                  <span className="sm:hidden">Video</span>
                </TabsTrigger>
                <TabsTrigger value="settings" className="gap-2 whitespace-nowrap px-4 py-2" id="settings">
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Pengaturan</span>
                  <span className="sm:hidden">Set</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard">
              <QuickActions />
            </TabsContent>

            {/* Website Settings Tab */}
            <TabsContent value="website">
              <WebsiteSettings />
            </TabsContent>

            {/* Hashtag Management Tab */}
            <TabsContent value="hashtags">
              <HashtagManagement />
            </TabsContent>

            {/* Videos Tab */}
            <TabsContent value="videos">
              <EnhancedVideoManager />
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <div className="space-y-6">
                <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-6">
                  <h3 className="text-white text-lg font-semibold mb-4">Informasi Akun Doodstream</h3>
                  
                  <div className="bg-yellow-900/20 border border-yellow-500/50 p-4 rounded-lg">
                    <h4 className="font-medium text-yellow-300 mb-2">⚠️ Konfigurasi Diperlukan</h4>
                    <p className="text-yellow-200 text-sm mb-4">
                      Untuk menggunakan fitur streaming Doodstream, Anda perlu mengkonfigurasi API key di Supabase secrets.
                    </p>
                    <div className="space-y-2 text-sm text-yellow-200">
                      <p>1. Dapatkan API key dari dashboard Doodstream</p>
                      <p>2. Simpan API key di Supabase secrets dengan nama "DOODSTREAM_API_KEY"</p>
                      <p>3. Restart aplikasi untuk memuat konfigurasi baru</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default AdminUpload;