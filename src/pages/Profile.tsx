import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User, Settings, Camera, Lock, Mail, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '@/components/SEO';
import { ProfilePhotoUpload } from '@/components/profile/ProfilePhotoUpload';
import { ChangePasswordForm } from '@/components/profile/ChangePasswordForm';
import { ChangeEmailForm } from '@/components/profile/ChangeEmailForm';

const Profile = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'email'>('profile');

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
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="relative">
                  <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-primary/20 shadow-glow">
                    <AvatarImage src="" alt="Profile" />
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
                <div className="text-center md:text-left">
                  <h2 className="text-xl font-semibold text-foreground mb-1">
                    {user.user_metadata?.username || 'User'}
                  </h2>
                  <p className="text-muted-foreground mb-3">
                    {user.email}
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                      Verified
                    </div>
                    <div className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm">
                      Member sejak {new Date(user.created_at).getFullYear()}
                    </div>
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