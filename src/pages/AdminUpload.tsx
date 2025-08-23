import { Link } from "react-router-dom";
import { ArrowLeft, List, Settings, Globe, Hash, Folder, Award, Coins, Megaphone, Users, Mail, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import WebsiteSettings from "@/components/admin/WebsiteSettings";
import HashtagManagement from "@/components/admin/HashtagManagement";
import CategoryManagement from "@/components/admin/CategoryManagement";
import BadgeStoreManagement from "@/components/admin/BadgeStoreManagement";
import CoinManagement from "@/components/admin/CoinManagement";
import QuickActions from "@/components/admin/QuickActions";
import AdsManagement from "@/components/admin/AdsManagement";
import UserManagement from "@/components/admin/UserManagement";
import ContactMessageManagement from "@/components/admin/ContactMessageManagement";
import PremiumRequestsManagement from "@/components/admin/PremiumRequestsManagement";
import { SecureDoodstreamAPI } from "@/lib/supabase-doodstream";
import EnhancedVideoManager from "@/components/admin/EnhancedVideoManager";
import { useContactMessages } from "@/hooks/useContactMessages";

const AdminUpload = () => {
  const { toast } = useToast();
  const { unreadCount } = useContactMessages();

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
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          </div>

          <Tabs defaultValue="dashboard" className="space-y-6" id="admin-tabs">
            <div className="w-full overflow-x-auto admin-scroll pb-1">
              <TabsList className="bg-card/50 backdrop-blur-sm inline-flex w-max min-w-max gap-1">
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
                <TabsTrigger value="categories" className="gap-2 whitespace-nowrap px-4 py-2" id="categories">
                  <Folder className="w-4 h-4" />
                  <span className="hidden sm:inline">Kategori</span>
                  <span className="sm:hidden">Kat</span>
                </TabsTrigger>
                <TabsTrigger value="hashtags" className="gap-2 whitespace-nowrap px-4 py-2" id="hashtags">
                  <Hash className="w-4 h-4" />
                  <span className="hidden sm:inline">Tagar</span>
                  <span className="sm:hidden">Tag</span>
                </TabsTrigger>
                <TabsTrigger value="badges" className="gap-2 whitespace-nowrap px-4 py-2" id="badges">
                  <Award className="w-4 h-4" />
                  <span className="hidden sm:inline">Badge Store</span>
                  <span className="sm:hidden">Badge</span>
                </TabsTrigger>
                <TabsTrigger value="coins" className="gap-2 whitespace-nowrap px-4 py-2" id="coins">
                  <Coins className="w-4 h-4" />
                  <span className="hidden sm:inline">Coin Management</span>
                  <span className="sm:hidden">Coins</span>
                </TabsTrigger>
                <TabsTrigger value="ads" className="gap-2 whitespace-nowrap px-4 py-2" id="ads">
                  <Megaphone className="w-4 h-4" />
                  <span className="hidden sm:inline">Manajemen Iklan</span>
                  <span className="sm:hidden">Ads</span>
                </TabsTrigger>
                <TabsTrigger value="users" className="gap-2 whitespace-nowrap px-4 py-2" id="users">
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">Kelola User</span>
                  <span className="sm:hidden">User</span>
                </TabsTrigger>
                <TabsTrigger value="premium" className="gap-2 whitespace-nowrap px-4 py-2" id="premium">
                  <Crown className="w-4 h-4" />
                  <span className="hidden sm:inline">Premium Requests</span>
                  <span className="sm:hidden">Premium</span>
                </TabsTrigger>
                <TabsTrigger value="messages" className="gap-2 whitespace-nowrap px-4 py-2 relative" id="messages">
                  <Mail className="w-4 h-4" />
                  <span className="hidden sm:inline">Pesan Kontak</span>
                  <span className="sm:hidden">Pesan</span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
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

            {/* Category Management Tab */}
            <TabsContent value="categories">
              <CategoryManagement />
            </TabsContent>

            {/* Hashtag Management Tab */}
            <TabsContent value="hashtags">
              <HashtagManagement />
            </TabsContent>

            {/* Badge Store Management Tab */}
            <TabsContent value="badges">
              <BadgeStoreManagement />
            </TabsContent>

            {/* Coin Management Tab */}
            <TabsContent value="coins">
              <CoinManagement />
            </TabsContent>

            {/* Ads Management Tab */}
            <TabsContent value="ads">
              <AdsManagement />
            </TabsContent>

            {/* User Management Tab */}
            <TabsContent value="users">
              <UserManagement />
            </TabsContent>

            {/* Premium Requests Tab */}
            <TabsContent value="premium">
              <PremiumRequestsManagement />
            </TabsContent>

            {/* Contact Messages Tab */}
            <TabsContent value="messages">
              <ContactMessageManagement />
            </TabsContent>

            {/* Videos Tab */}
            <TabsContent value="videos">
              <EnhancedVideoManager />
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <div className="space-y-6">
                <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-6">
                  <h3 className="text-foreground text-lg font-semibold mb-4">Informasi Akun Doodstream</h3>
                  
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