import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Minus, Search, Coins, TrendingUp, TrendingDown, Eye } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserCoin {
  id: string;
  user_id: string;
  balance: number;
  total_earned: number;
  total_spent: number;
  created_at: string;
  updated_at: string;
  profiles: {
    username: string | null;
    email: string;
    avatar_url: string | null;
  } | null;
}

const CoinManagement = () => {
  const [users, setUsers] = useState<UserCoin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserCoin | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'add' | 'subtract'>('add');
  const [coinAmount, setCoinAmount] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch user coins and profiles separately then join
      const { data: userCoins, error: coinsError } = await supabase
        .from('user_coins')
        .select('*')
        .order('balance', { ascending: false });

      if (coinsError) throw coinsError;

      if (!userCoins || userCoins.length === 0) {
        setUsers([]);
        return;
      }

      // Get all profile data for these users
      const userIds = userCoins.map(coin => coin.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, email, avatar_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Combine the data
      const usersWithProfiles: UserCoin[] = userCoins.map(coin => {
        const profile = profiles?.find(p => p.id === coin.user_id);
        return {
          ...coin,
          profiles: profile ? {
            username: profile.username,
            email: profile.email,
            avatar_url: profile.avatar_url
          } : null
        };
      }).filter(user => user.profiles !== null); // Only show users with profiles

      setUsers(usersWithProfiles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch user coins",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCoinAction = async () => {
    if (!selectedUser || coinAmount <= 0) return;

    setSubmitting(true);
    try {
      const newBalance = actionType === 'add' 
        ? selectedUser.balance + coinAmount
        : Math.max(0, selectedUser.balance - coinAmount);

      const updateData: any = {
        balance: newBalance,
        updated_at: new Date().toISOString()
      };

      if (actionType === 'add') {
        updateData.total_earned = selectedUser.total_earned + coinAmount;
      } else {
        updateData.total_spent = selectedUser.total_spent + coinAmount;
      }

      const { error } = await supabase
        .from('user_coins')
        .update(updateData)
        .eq('user_id', selectedUser.user_id);

      if (error) throw error;

        toast({
          title: "Success",
          description: `${actionType === 'add' ? 'Added' : 'Subtracted'} ${coinAmount} coins ${actionType === 'add' ? 'to' : 'from'} ${selectedUser.profiles?.username || selectedUser.profiles?.email}`,
        });

      setDialogOpen(false);
      setCoinAmount(0);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error updating coins:', error);
      toast({
        title: "Error",
        description: "Failed to update coins",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const openCoinDialog = (user: UserCoin, type: 'add' | 'subtract') => {
    setSelectedUser(user);
    setActionType(type);
    setCoinAmount(0);
    setDialogOpen(true);
  };

  const filteredUsers = users.filter(user => 
    user.profiles && (
      user.profiles.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.profiles.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const totalCoinsInSystem = users.reduce((sum, user) => sum + user.balance, 0);
  const totalEarned = users.reduce((sum, user) => sum + user.total_earned, 0);
  const totalSpent = users.reduce((sum, user) => sum + user.total_spent, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Coin Management</h2>
          <p className="text-muted-foreground">Kelola coin pengguna dan lihat statistik coin</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Total Coins in System</CardTitle>
            <Coins className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{totalCoinsInSystem.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across {users.length} users</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Total Earned</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{totalEarned.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All time earnings</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Total Spent</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{totalSpent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All time spending</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-foreground">Search Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by username or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <div className="grid gap-4">
        {filteredUsers.map((user) => (
          <Card key={user.id} className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.profiles?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {(user.profiles?.username || user.profiles?.email || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">
                        {user.profiles?.username || 'Anonymous User'}
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        {user.profiles?.email || 'No email'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Balance: <span className="text-yellow-500 font-medium">{user.balance}</span> coins</span>
                      <span>Earned: <span className="text-green-500">{user.total_earned}</span></span>
                      <span>Spent: <span className="text-red-500">{user.total_spent}</span></span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openCoinDialog(user, 'add')}
                    className="gap-2 text-green-600 hover:text-green-700"
                  >
                    <Plus className="w-4 h-4" />
                    Add Coins
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openCoinDialog(user, 'subtract')}
                    className="gap-2 text-red-600 hover:text-red-700"
                    disabled={user.balance === 0}
                  >
                    <Minus className="w-4 h-4" />
                    Remove Coins
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Eye className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? 'No users found matching your search' : 'No users found'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Coin Action Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'add' ? 'Add Coins' : 'Remove Coins'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'add' ? 'Add coins to' : 'Remove coins from'} {selectedUser?.profiles?.username || selectedUser?.profiles?.email}
              <br />
              Current balance: <span className="text-yellow-500 font-medium">{selectedUser?.balance} coins</span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="coinAmount">Amount</Label>
              <Input
                id="coinAmount"
                type="number"
                min="1"
                max={actionType === 'subtract' ? selectedUser?.balance : undefined}
                value={coinAmount || ''}
                onChange={(e) => setCoinAmount(parseInt(e.target.value) || 0)}
                placeholder="Enter coin amount"
              />
              {actionType === 'subtract' && selectedUser && coinAmount > selectedUser.balance && (
                <p className="text-sm text-red-500 mt-1">
                  Cannot remove more coins than user has
                </p>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCoinAction}
              disabled={submitting || coinAmount <= 0 || (actionType === 'subtract' && selectedUser && coinAmount > selectedUser.balance)}
              className={actionType === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {actionType === 'add' ? 'Add' : 'Remove'} {coinAmount} Coins
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CoinManagement;