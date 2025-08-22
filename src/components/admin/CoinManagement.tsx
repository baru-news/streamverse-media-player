import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Minus, Search, Coins, TrendingUp, TrendingDown, Eye, Key } from "lucide-react";
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

interface UserKittyKey {
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
  const [kittyKeyUsers, setKittyKeyUsers] = useState<UserKittyKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [kittyKeyLoading, setKittyKeyLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [kittyKeySearchTerm, setKittyKeySearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserCoin | null>(null);
  const [selectedKittyKeyUser, setSelectedKittyKeyUser] = useState<UserKittyKey | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [kittyKeyDialogOpen, setKittyKeyDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'add' | 'subtract'>('add');
  const [kittyKeyActionType, setKittyKeyActionType] = useState<'add' | 'subtract'>('add');
  const [coinAmount, setCoinAmount] = useState<number>(0);
  const [kittyKeyAmount, setKittyKeyAmount] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [kittyKeySubmitting, setKittyKeySubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
    fetchKittyKeyUsers();
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

  const fetchKittyKeyUsers = async () => {
    try {
      setKittyKeyLoading(true);
      
      // Fetch user kitty keys and profiles separately then join
      const { data: userKittyKeys, error: kittyKeysError } = await supabase
        .from('user_kitty_keys')
        .select('*')
        .order('balance', { ascending: false });

      if (kittyKeysError) throw kittyKeysError;

      if (!userKittyKeys || userKittyKeys.length === 0) {
        setKittyKeyUsers([]);
        return;
      }

      // Get all profile data for these users
      const userIds = userKittyKeys.map(key => key.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, email, avatar_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Combine the data
      const usersWithProfiles: UserKittyKey[] = userKittyKeys.map(key => {
        const profile = profiles?.find(p => p.id === key.user_id);
        return {
          ...key,
          profiles: profile ? {
            username: profile.username,
            email: profile.email,
            avatar_url: profile.avatar_url
          } : null
        };
      }).filter(user => user.profiles !== null); // Only show users with profiles

      setKittyKeyUsers(usersWithProfiles);
    } catch (error) {
      console.error('Error fetching kitty key users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch user kitty keys",
        variant: "destructive"
      });
    } finally {
      setKittyKeyLoading(false);
    }
  };

  const handleKittyKeyAction = async () => {
    if (!selectedKittyKeyUser || kittyKeyAmount <= 0) return;

    setKittyKeySubmitting(true);
    try {
      const newBalance = kittyKeyActionType === 'add' 
        ? selectedKittyKeyUser.balance + kittyKeyAmount
        : Math.max(0, selectedKittyKeyUser.balance - kittyKeyAmount);

      const updateData: any = {
        balance: newBalance,
        updated_at: new Date().toISOString()
      };

      if (kittyKeyActionType === 'add') {
        updateData.total_earned = selectedKittyKeyUser.total_earned + kittyKeyAmount;
      } else {
        updateData.total_spent = selectedKittyKeyUser.total_spent + kittyKeyAmount;
      }

      const { error } = await supabase
        .from('user_kitty_keys')
        .update(updateData)
        .eq('user_id', selectedKittyKeyUser.user_id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${kittyKeyActionType === 'add' ? 'Added' : 'Subtracted'} ${kittyKeyAmount} kitty keys ${kittyKeyActionType === 'add' ? 'to' : 'from'} ${selectedKittyKeyUser.profiles?.username || selectedKittyKeyUser.profiles?.email}`,
      });

      setKittyKeyDialogOpen(false);
      setKittyKeyAmount(0);
      setSelectedKittyKeyUser(null);
      fetchKittyKeyUsers();
    } catch (error) {
      console.error('Error updating kitty keys:', error);
      toast({
        title: "Error",
        description: "Failed to update kitty keys",
        variant: "destructive"
      });
    } finally {
      setKittyKeySubmitting(false);
    }
  };

  const openCoinDialog = (user: UserCoin, type: 'add' | 'subtract') => {
    setSelectedUser(user);
    setActionType(type);
    setCoinAmount(0);
    setDialogOpen(true);
  };

  const openKittyKeyDialog = (user: UserKittyKey, type: 'add' | 'subtract') => {
    setSelectedKittyKeyUser(user);
    setKittyKeyActionType(type);
    setKittyKeyAmount(0);
    setKittyKeyDialogOpen(true);
  };

  const filteredUsers = users.filter(user => 
    user.profiles && (
      user.profiles.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.profiles.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const filteredKittyKeyUsers = kittyKeyUsers.filter(user => 
    user.profiles && (
      user.profiles.username?.toLowerCase().includes(kittyKeySearchTerm.toLowerCase()) ||
      user.profiles.email.toLowerCase().includes(kittyKeySearchTerm.toLowerCase())
    )
  );

  const totalCoinsInSystem = users.reduce((sum, user) => sum + user.balance, 0);
  const totalEarned = users.reduce((sum, user) => sum + user.total_earned, 0);
  const totalSpent = users.reduce((sum, user) => sum + user.total_spent, 0);
  
  const totalKittyKeysInSystem = kittyKeyUsers.reduce((sum, user) => sum + user.balance, 0);
  const totalKittyKeysEarned = kittyKeyUsers.reduce((sum, user) => sum + user.total_earned, 0);
  const totalKittyKeysSpent = kittyKeyUsers.reduce((sum, user) => sum + user.total_spent, 0);

  if (loading && kittyKeyLoading) {
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
          <h2 className="text-2xl font-bold text-foreground">Coin & Kitty Key Management</h2>
          <p className="text-muted-foreground">Kelola coin dan kitty key pengguna serta lihat statistik</p>
        </div>
      </div>

      <Tabs defaultValue="coins" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="coins" className="flex items-center gap-2">
            <Coins className="w-4 h-4" />
            Coins
          </TabsTrigger>
          <TabsTrigger value="kitty-keys" className="flex items-center gap-2">
            <Key className="w-4 h-4" />
            Kitty Keys
          </TabsTrigger>
        </TabsList>

        <TabsContent value="coins" className="space-y-6">

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
        </TabsContent>

        <TabsContent value="kitty-keys" className="space-y-6">
          {/* Kitty Key Statistics Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Total Kitty Keys in System</CardTitle>
                <Key className="h-4 w-4 text-pink-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-pink-500">{totalKittyKeysInSystem.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Across {kittyKeyUsers.length} users</p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Total Keys Earned</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">{totalKittyKeysEarned.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">All time earnings</p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Total Keys Spent</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">{totalKittyKeysSpent.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">All time spending</p>
              </CardContent>
            </Card>
          </div>

          {/* Kitty Key Search */}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-foreground">Search Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by username or email..."
                  value={kittyKeySearchTerm}
                  onChange={(e) => setKittyKeySearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Kitty Key Users List */}
          {kittyKeyLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredKittyKeyUsers.map((user) => (
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
                            <span>Balance: <span className="text-pink-500 font-medium">{user.balance}</span> keys</span>
                            <span>Earned: <span className="text-green-500">{user.total_earned}</span></span>
                            <span>Spent: <span className="text-red-500">{user.total_spent}</span></span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openKittyKeyDialog(user, 'add')}
                          className="gap-2 text-green-600 hover:text-green-700"
                        >
                          <Plus className="w-4 h-4" />
                          Add Keys
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openKittyKeyDialog(user, 'subtract')}
                          className="gap-2 text-red-600 hover:text-red-700"
                          disabled={user.balance === 0}
                        >
                          <Minus className="w-4 h-4" />
                          Remove Keys
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {filteredKittyKeyUsers.length === 0 && !kittyKeyLoading && (
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Eye className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {kittyKeySearchTerm ? 'No users found matching your search' : 'No users with kitty keys found'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Kitty Key Action Dialog */}
          <Dialog open={kittyKeyDialogOpen} onOpenChange={setKittyKeyDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {kittyKeyActionType === 'add' ? 'Add Kitty Keys' : 'Remove Kitty Keys'}
                </DialogTitle>
                <DialogDescription>
                  {kittyKeyActionType === 'add' ? 'Add kitty keys to' : 'Remove kitty keys from'} {selectedKittyKeyUser?.profiles?.username || selectedKittyKeyUser?.profiles?.email}
                  <br />
                  Current balance: <span className="text-pink-500 font-medium">{selectedKittyKeyUser?.balance} keys</span>
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="kittyKeyAmount">Amount</Label>
                  <Input
                    id="kittyKeyAmount"
                    type="number"
                    min="1"
                    max={kittyKeyActionType === 'subtract' ? selectedKittyKeyUser?.balance : undefined}
                    value={kittyKeyAmount || ''}
                    onChange={(e) => setKittyKeyAmount(parseInt(e.target.value) || 0)}
                    placeholder="Enter kitty key amount"
                  />
                  {kittyKeyActionType === 'subtract' && selectedKittyKeyUser && kittyKeyAmount > selectedKittyKeyUser.balance && (
                    <p className="text-sm text-red-500 mt-1">
                      Cannot remove more kitty keys than user has
                    </p>
                  )}
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setKittyKeyDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleKittyKeyAction}
                  disabled={kittyKeySubmitting || kittyKeyAmount <= 0 || (kittyKeyActionType === 'subtract' && selectedKittyKeyUser && kittyKeyAmount > selectedKittyKeyUser.balance)}
                  className={kittyKeyActionType === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                >
                  {kittyKeySubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  {kittyKeyActionType === 'add' ? 'Add' : 'Remove'} {kittyKeyAmount} Keys
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CoinManagement;