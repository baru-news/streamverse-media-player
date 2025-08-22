import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Mail, Clock, User, Calendar, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface UserProfile {
  id: string;
  email: string;
  username: string;
  avatar_url: string;
  created_at: string;
  age_verified: boolean;
  total_watch_time: number;
  session_count: number;
  last_active: string;
}

const UserManagement = () => {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch profiles with watch time data
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          username,
          avatar_url,
          created_at,
          age_verified
        `)
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch watch time statistics for each user
      const usersWithStats = await Promise.all(
        profiles.map(async (profile) => {
          const { data: watchData } = await supabase
            .from('user_watch_sessions')
            .select('watch_duration, session_end')
            .eq('user_id', profile.id);

          const totalWatchTime = watchData?.reduce((sum, session) => sum + session.watch_duration, 0) || 0;
          const sessionCount = watchData?.length || 0;
          const lastActive = watchData?.[0]?.session_end || profile.created_at;

          return {
            ...profile,
            total_watch_time: totalWatchTime,
            session_count: sessionCount,
            last_active: lastActive
          };
        })
      );

      setUsers(usersWithStats);
      setTotalUsers(usersWithStats.length);
      setActiveUsers(usersWithStats.filter(u => u.session_count > 0).length);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Gagal memuat data user');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (email: string) => {
    try {
      // MENGIRIMKAN ORIGIN SAAT INI KE EDGE FUNCTION
      const { data, error } = await supabase.functions.invoke('admin-user-management', {
        body: {
          action: 'reset_password',
          email,
          redirect_to_origin: window.location.origin // BARIS YANG DITAMBAHKAN
        }
      });

      if (error) throw error;

      toast.success(`Email reset password telah dikirim ke ${email}`);
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('Gagal mengirim email reset password');
    }
  };

  const formatWatchTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}j ${minutes}m ${secs}d`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Akses ditolak. Hanya admin yang dapat mengakses halaman ini.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total User</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">User terdaftar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Aktif</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsers}</div>
            <p className="text-xs text-muted-foreground">Pernah menonton video</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Watch Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatWatchTime(users.reduce((sum, user) => sum + user.total_watch_time, 0))}
            </div>
            <p className="text-xs text-muted-foreground">Waktu menonton keseluruhan</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Manajemen User</CardTitle>
          <CardDescription>
            Kelola user, reset password, dan lihat statistik watch time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cari berdasarkan email atau username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Memuat data user...</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {filteredUsers.map((user) => (
                  <Card key={user.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarImage src={user.avatar_url} />
                          <AvatarFallback>
                            {user.username?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-semibold">{user.username || 'Tidak ada username'}</h4>
                            {user.age_verified && (
                              <Badge variant="secondary" className="text-xs">
                                <Shield className="h-3 w-3 mr-1" />
                                Terverifikasi
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span>{user.email}</span>
                          </div>
                          
                          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>Bergabung: {formatDate(user.created_at)}</span>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span className="font-medium">{formatWatchTime(user.total_watch_time)}</span>
                              <span className="text-muted-foreground">watch time</span>
                            </div>
                            <div>
                              <span className="font-medium">{user.session_count}</span>
                              <span className="text-muted-foreground"> sesi</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePasswordReset(user.email)}
                        className="gap-2"
                      >
                        <Mail className="h-3 w-3" />
                        Reset Password
                      </Button>
                    </div>
                  </Card>
                ))}

                {filteredUsers.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      {searchTerm ? 'Tidak ada user yang ditemukan' : 'Belum ada user terdaftar'}
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;