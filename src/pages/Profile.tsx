import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, Settings, Camera, Lock, Mail, ArrowLeft, Trophy, Star, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '@/components/SEO';
import { ProfilePhotoUpload } from '@/components/profile/ProfilePhotoUpload';
import { ChangePasswordForm } from '@/components/profile/ChangePasswordForm';
import { ChangeEmailForm } from '@/components/profile/ChangeEmailForm';
import { CoinDisplay } from '@/components/CoinDisplay';
import KittyKeyDisplay from '@/components/KittyKeyDisplay';
import { UserBadgeDisplay } from '@/components/UserBadgeDisplay';
import { useBadges } from '@/hooks/useBadges';
import { useCoins } from '@/hooks/useCoins';
import { supabase } from '@/integrations/supabase/client';

const Profile = () => {
  const { user } = useAuth();
  const { badges, activeBadge } = useBadges();
  const { coins } = useCoins();
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'email'>('profile');
  const [profile, setProfile] = useState<{ username: string | null; avatar_url: string | null } | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', user.id)
        .single();
      
      if (data) {
        setProfile(data);
      }
    };

    fetchProfile();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-4">Anda harus login untuk mengakses profil</p>
            <Link to="/login">
              <Button>Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getInitials = (email: string) => {
    return email.split('@')[0].substring(0, 2).toUpperCase();
  };

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'password', label: 'Password', icon: Lock },
    { id: 'email', label: 'Email', icon: Mail },
  ] as const;

  return (
    <>
      <SEO 
        title="Profil Saya"
        description="Kelola profil, foto, password dan email akun Anda"
        keywords="profil, akun, pengaturan, foto profil, ganti password"
      />
      
      <div className="min-h-screen bg-gradient-hero">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link to="/">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Kembali
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-primary rounded-xl shadow-glow">
                <Settings className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  Profil Saya
                </h1>
                <p className="text-muted-foreground">
                  Kelola informasi akun Anda
                </p>
              </div>
            </div>
          </div>

          {/* Profile Overview Card */}
          <Card className="mb-8 bg-gradient-card border-0 shadow-video">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row items-center gap-6">
                <div className="relative">
                  <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-primary/20 shadow-glow">
                    <AvatarImage src={profile?.avatar_url || ""} alt="Profile" />
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xl font-bold">
                      {getInitials(user.email || '')}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="sm"
                    className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0 shadow-glow"
                    onClick={() => setActiveTab('profile')}
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex-1 text-center lg:text-left">
                  <div className="flex items-center justify-center lg:justify-start gap-3 mb-2">
                    <h2 className="text-xl font-semibold text-foreground">
                      {profile?.username || 'User'}
                    </h2>
                    {user.id && <UserBadgeDisplay userId={user.id} showTooltip />}
                  </div>
                  <p className="text-muted-foreground mb-4">
                    {user.email}
                  </p>
                  
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    <div className="bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 p-4 rounded-xl border border-yellow-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Trophy className="w-5 h-5 text-yellow-500" />
                        <span className="text-sm font-medium text-foreground">Coins</span>
                      </div>
                      <CoinDisplay className="justify-center lg:justify-start" showTotal />
                    </div>
                    
                    <div className="bg-gradient-to-r from-pink-500/10 to-pink-600/10 p-4 rounded-xl border border-pink-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Crown className="w-5 h-5 text-pink-500" />
                        <span className="text-sm font-medium text-foreground">Kitty Keys</span>
                      </div>
                      <div className="flex justify-center lg:justify-start">
                        <KittyKeyDisplay />
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-purple-500/10 to-purple-600/10 p-4 rounded-xl border border-purple-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Star className="w-5 h-5 text-purple-500" />
                        <span className="text-sm font-medium text-foreground">Badges</span>
                      </div>
                      <div className="text-center lg:text-left">
                        <span className="text-lg font-bold text-foreground">
                          {badges.filter(b => b.owned).length}
                        </span>
                        <span className="text-sm text-muted-foreground ml-1">/ {badges.length}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      Verified
                    </Badge>
                    <Badge variant="outline" className="bg-secondary/10">
                      Member sejak {new Date(user.created_at).getFullYear()}
                    </Badge>
                    {activeBadge && (
                      <Badge variant="outline" className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
                        Active Badge: {activeBadge.name}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs Navigation */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* Sidebar Tabs */}
            <div className="w-full md:w-64">
              <Card className="p-4 bg-gradient-card border-0 shadow-video">
                <div className="space-y-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <Button
                        key={tab.id}
                        variant={activeTab === tab.id ? "default" : "ghost"}
                        className={`w-full justify-start gap-3 transition-smooth ${
                          activeTab === tab.id 
                            ? "bg-gradient-primary text-primary-foreground shadow-glow" 
                            : "hover:bg-primary/10"
                        }`}
                        onClick={() => setActiveTab(tab.id)}
                      >
                        <Icon className="w-5 h-5" />
                        {tab.label}
                      </Button>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* Content Area */}
            <div className="flex-1">
              <Card className="bg-gradient-card border-0 shadow-video">
                <CardHeader className="border-b border-border/50">
                  <CardTitle className="flex items-center gap-3 text-foreground">
                    {tabs.find(tab => tab.id === activeTab)?.icon && (
                      <div className="p-2 bg-primary/10 rounded-lg">
                        {(() => {
                          const Icon = tabs.find(tab => tab.id === activeTab)?.icon!;
                          return <Icon className="w-5 h-5 text-primary" />;
                        })()}
                      </div>
                    )}
                    {tabs.find(tab => tab.id === activeTab)?.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {activeTab === 'profile' && <ProfilePhotoUpload />}
                  {activeTab === 'password' && <ChangePasswordForm />}
                  {activeTab === 'email' && <ChangeEmailForm />}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;