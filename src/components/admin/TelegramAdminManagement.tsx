import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Trash2, UserPlus, MessageSquare } from 'lucide-react';

interface TelegramAdmin {
  id: string;
  user_id: string;
  telegram_user_id: number;
  telegram_username: string;
  is_active: boolean;
  added_at: string;
  profiles: {
    email: string;
    username: string;
  };
}

interface PremiumGroup {
  id: string;
  chat_id: number;
  chat_title: string;
  auto_upload_enabled: boolean;
  created_at: string;
}

export function TelegramAdminManagement() {
  const { user, isAdmin } = useAuth();
  const [telegramAdmins, setTelegramAdmins] = useState<TelegramAdmin[]>([]);
  const [premiumGroups, setPremiumGroups] = useState<PremiumGroup[]>([]);
  const [newAdminUserId, setNewAdminUserId] = useState('');
  const [newTelegramUserId, setNewTelegramUserId] = useState('');
  const [newTelegramUsername, setNewTelegramUsername] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      fetchTelegramAdmins();
      fetchPremiumGroups();
    }
  }, [isAdmin]);

  const fetchTelegramAdmins = async () => {
    try {
      const { data: adminsData, error } = await supabase
        .from('admin_telegram_users')
        .select('*')
        .order('added_at', { ascending: false });

      if (error) throw error;

      // Get profile data separately since there's no direct foreign key
      const profilesData = await Promise.all(
        (adminsData || []).map(async (admin) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, username')
            .eq('id', admin.user_id)
            .maybeSingle();
          
          return {
            ...admin,
            profiles: profile || { email: 'Unknown', username: 'Unknown' }
          };
        })
      );

      setTelegramAdmins(profilesData);
    } catch (error: any) {
      console.error('Error fetching telegram admins:', error);
      toast.error('Failed to load telegram admins');
    }
  };

  const fetchPremiumGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('premium_groups')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPremiumGroups(data || []);
    } catch (error: any) {
      console.error('Error fetching premium groups:', error);
      toast.error('Failed to load premium groups');
    } finally {
      setLoading(false);
    }
  };

  const addTelegramAdmin = async () => {
    if (!newAdminUserId || !newTelegramUserId) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const { error } = await supabase
        .from('admin_telegram_users')
        .insert({
          user_id: newAdminUserId,
          telegram_user_id: parseInt(newTelegramUserId),
          telegram_username: newTelegramUsername || null,
          is_active: true
        });

      if (error) throw error;

      toast.success('Telegram admin added successfully');
      setNewAdminUserId('');
      setNewTelegramUserId('');
      setNewTelegramUsername('');
      fetchTelegramAdmins();
    } catch (error: any) {
      console.error('Error adding telegram admin:', error);
      toast.error('Failed to add telegram admin');
    }
  };

  const toggleAdminStatus = async (adminId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('admin_telegram_users')
        .update({ is_active: !currentStatus })
        .eq('id', adminId);

      if (error) throw error;

      toast.success(`Admin ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchTelegramAdmins();
    } catch (error: any) {
      console.error('Error toggling admin status:', error);
      toast.error('Failed to update admin status');
    }
  };

  const deleteAdmin = async (adminId: string) => {
    if (!confirm('Are you sure you want to delete this admin?')) return;

    try {
      const { error } = await supabase
        .from('admin_telegram_users')
        .delete()
        .eq('id', adminId);

      if (error) throw error;

      toast.success('Telegram admin deleted');
      fetchTelegramAdmins();
    } catch (error: any) {
      console.error('Error deleting admin:', error);
      toast.error('Failed to delete admin');
    }
  };

  const toggleGroupAutoUpload = async (groupId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('premium_groups')
        .update({ auto_upload_enabled: !currentStatus })
        .eq('id', groupId);

      if (error) throw error;

      toast.success(`Auto-upload ${!currentStatus ? 'enabled' : 'disabled'} for group`);
      fetchPremiumGroups();
    } catch (error: any) {
      console.error('Error toggling auto-upload:', error);
      toast.error('Failed to update auto-upload status');
    }
  };

  if (!isAdmin) {
    return <div className="text-center py-8">Access denied. Admin privileges required.</div>;
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add Telegram Admin
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">User ID (UUID)</label>
              <Input
                placeholder="Enter user ID from profiles table"
                value={newAdminUserId}
                onChange={(e) => setNewAdminUserId(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Telegram User ID</label>
              <Input
                placeholder="Enter Telegram user ID"
                type="number"
                value={newTelegramUserId}
                onChange={(e) => setNewTelegramUserId(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Telegram Username (Optional)</label>
              <Input
                placeholder="@username"
                value={newTelegramUsername}
                onChange={(e) => setNewTelegramUsername(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={addTelegramAdmin}>Add Telegram Admin</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Telegram Admins ({telegramAdmins.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {telegramAdmins.map((admin) => (
              <div key={admin.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{admin.profiles?.email || 'Unknown User'}</div>
                  <div className="text-sm text-muted-foreground">
                    Telegram ID: {admin.telegram_user_id}
                  </div>
                  {admin.telegram_username && (
                    <div className="text-sm text-muted-foreground">
                      @{admin.telegram_username}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Added: {new Date(admin.added_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={admin.is_active ? "default" : "secondary"}>
                    {admin.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleAdminStatus(admin.id, admin.is_active)}
                  >
                    {admin.is_active ? "Deactivate" : "Activate"}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteAdmin(admin.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Premium Groups ({premiumGroups.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {premiumGroups.map((group) => (
              <div key={group.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{group.chat_title}</div>
                  <div className="text-sm text-muted-foreground">
                    Chat ID: {group.chat_id}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Added: {new Date(group.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={group.auto_upload_enabled ? "default" : "secondary"}>
                    Auto-upload {group.auto_upload_enabled ? "Enabled" : "Disabled"}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleGroupAutoUpload(group.id, group.auto_upload_enabled)}
                  >
                    {group.auto_upload_enabled ? "Disable" : "Enable"}
                  </Button>
                </div>
              </div>
            ))}
            {premiumGroups.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No premium groups found. Use /add_premium_group command in Telegram groups.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}