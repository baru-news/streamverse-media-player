import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, Clock, Eye, MessageSquare, RefreshCw, Users, DollarSign } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface PremiumRequest {
  id: string;
  user_id: string;
  trakteer_transaction_id?: string;
  payment_proof_url?: string;
  telegram_username?: string;
  amount: number;
  subscription_type: string;
  status: string;
  admin_notes?: string;
  admin_user_id?: string;
  created_at: string;
  updated_at: string;
  processed_at?: string;
  profiles?: {
    username?: string;
    email: string;
  } | null;
}

const PremiumRequestsManagement = () => {
  const [requests, setRequests] = useState<PremiumRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<PremiumRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [dialogType, setDialogType] = useState<'approve' | 'reject'>('approve');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('premium_subscription_requests')
        .select(`
          *,
          profiles!inner (
            username,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests((data as any) || []);
    } catch (error) {
      console.error('Error fetching premium requests:', error);
      toast({
        title: "Error",
        description: "Failed to fetch premium requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string, notes?: string) => {
    setProcessingId(requestId);
    try {
      const { data, error } = await supabase.rpc('approve_premium_request', {
        request_id: requestId,
        admin_notes_param: notes || null
      });

      if (error) throw error;

      if (data) {
        toast({
          title: "Success",
          description: "Premium subscription request approved successfully",
        });
        await fetchRequests();
      } else {
        throw new Error('Failed to approve request');
      }
    } catch (error) {
      console.error('Error approving request:', error);
      toast({
        title: "Error",
        description: "Failed to approve premium request",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
      setShowDialog(false);
      setAdminNotes('');
    }
  };

  const handleReject = async (requestId: string, notes: string) => {
    if (!notes.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      });
      return;
    }

    setProcessingId(requestId);
    try {
      const { data, error } = await supabase.rpc('reject_premium_request', {
        request_id: requestId,
        admin_notes_param: notes
      });

      if (error) throw error;

      if (data) {
        toast({
          title: "Success",
          description: "Premium subscription request rejected",
        });
        await fetchRequests();
      } else {
        throw new Error('Failed to reject request');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast({
        title: "Error",
        description: "Failed to reject premium request",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
      setShowDialog(false);
      setAdminNotes('');
    }
  };

  const openDialog = (request: PremiumRequest, type: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setDialogType(type);
    setAdminNotes('');
    setShowDialog(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filterRequests = (status: string) => {
    return requests.filter(request => request.status === status);
  };

  const getStats = () => {
    const pending = requests.filter(r => r.status === 'pending').length;
    const approved = requests.filter(r => r.status === 'approved').length;
    const rejected = requests.filter(r => r.status === 'rejected').length;
    const totalRevenue = requests
      .filter(r => r.status === 'approved')
      .reduce((sum, r) => sum + r.amount, 0);

    return { pending, approved, rejected, totalRevenue };
  };

  const stats = getStats();

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  const RequestCard = ({ request }: { request: PremiumRequest }) => (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon(request.status)}
            <div>
              <h4 className="font-semibold">
                {request.profiles?.username || request.profiles?.email || 'Unknown User'}
              </h4>
              <p className="text-sm text-muted-foreground">{request.profiles?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(request.status)}>
              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <span className="font-medium">Amount:</span>
            <div>IDR {request.amount.toLocaleString('id-ID')}</div>
          </div>
          <div>
            <span className="font-medium">Type:</span>
            <div className="capitalize">{request.subscription_type}</div>
          </div>
          <div>
            <span className="font-medium">Created:</span>
            <div>{formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}</div>
          </div>
          {request.processed_at && (
            <div>
              <span className="font-medium">Processed:</span>
              <div>{formatDistanceToNow(new Date(request.processed_at), { addSuffix: true })}</div>
            </div>
          )}
        </div>

        {request.telegram_username && (
          <div className="mb-3">
            <span className="font-medium text-sm">Telegram Username:</span>
            <div className="text-sm font-mono bg-muted p-2 rounded flex items-center justify-between">
              <span>{request.telegram_username}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigator.clipboard.writeText(request.telegram_username || '')}
                className="ml-2 h-6 px-2 text-xs"
              >
                Copy
              </Button>
            </div>
          </div>
        )}

        {request.trakteer_transaction_id && (
          <div className="mb-3">
            <span className="font-medium text-sm">Transaction ID:</span>
            <div className="text-sm font-mono bg-muted p-2 rounded">
              {request.trakteer_transaction_id}
            </div>
          </div>
        )}

        {request.payment_proof_url && (
          <div className="mb-4">
            <span className="font-medium text-sm">Payment Proof:</span>
            <div className="mt-2">
              <img
                src={request.payment_proof_url}
                alt="Payment proof"
                className="max-w-full h-auto rounded border max-h-60 object-contain cursor-pointer"
                onClick={() => window.open(request.payment_proof_url, '_blank')}
              />
            </div>
          </div>
        )}

        {request.admin_notes && (
          <div className="mb-4">
            <span className="font-medium text-sm">Admin Notes:</span>
            <div className="text-sm bg-muted p-2 rounded mt-1">
              {request.admin_notes}
            </div>
          </div>
        )}

        {request.status === 'pending' && (
          <>
            <Alert className="mb-4">
              <MessageSquare className="h-4 w-4" />
              <AlertDescription>
                <strong>Manual Telegram Invitation:</strong>
                {request.telegram_username ? (
                  <>
                    {' '}After approval, manually invite <strong>{request.telegram_username}</strong> to the premium Telegram channel.
                  </>
                ) : (
                  ' No Telegram username provided.'
                )}
              </AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => openDialog(request, 'approve')}
                disabled={processingId === request.id}
                className="flex-1"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => openDialog(request, 'reject')}
                disabled={processingId === request.id}
                className="flex-1"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Premium Requests</h2>
          <p className="text-muted-foreground">Manage premium subscription requests</p>
        </div>
        <Button onClick={fetchRequests} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">Pending</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Approved</p>
                <p className="text-2xl font-bold">{stats.approved}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              <div>
                <p className="text-sm font-medium">Rejected</p>
                <p className="text-2xl font-bold">{stats.rejected}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Revenue</p>
                <p className="text-2xl font-bold">
                  IDR {stats.totalRevenue.toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({stats.approved})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({stats.rejected})</TabsTrigger>
          <TabsTrigger value="all">All ({requests.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <div>
            {filterRequests('pending').length === 0 ? (
              <Alert>
                <AlertDescription>No pending premium requests</AlertDescription>
              </Alert>
            ) : (
              filterRequests('pending').map(request => (
                <RequestCard key={request.id} request={request} />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="approved">
          <div>
            {filterRequests('approved').length === 0 ? (
              <Alert>
                <AlertDescription>No approved premium requests</AlertDescription>
              </Alert>
            ) : (
              filterRequests('approved').map(request => (
                <RequestCard key={request.id} request={request} />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="rejected">
          <div>
            {filterRequests('rejected').length === 0 ? (
              <Alert>
                <AlertDescription>No rejected premium requests</AlertDescription>
              </Alert>
            ) : (
              filterRequests('rejected').map(request => (
                <RequestCard key={request.id} request={request} />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="all">
          <div>
            {requests.length === 0 ? (
              <Alert>
                <AlertDescription>No premium requests found</AlertDescription>
              </Alert>
            ) : (
              requests.map(request => (
                <RequestCard key={request.id} request={request} />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Action Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogType === 'approve' ? 'Approve' : 'Reject'} Premium Request
            </DialogTitle>
            <DialogDescription>
              {dialogType === 'approve'
                ? 'This will activate the premium subscription for the user.'
                : 'Please provide a reason for rejecting this request.'}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded">
                <p><strong>User:</strong> {selectedRequest.profiles?.username || selectedRequest.profiles?.email}</p>
                <p><strong>Amount:</strong> IDR {selectedRequest.amount.toLocaleString('id-ID')}</p>
                {selectedRequest.trakteer_transaction_id && (
                  <p><strong>Transaction ID:</strong> {selectedRequest.trakteer_transaction_id}</p>
                )}
                {selectedRequest.telegram_username && (
                  <p><strong>Telegram:</strong> {selectedRequest.telegram_username}</p>
                )}
              </div>

              <div>
                <Label htmlFor="admin-notes">
                  {dialogType === 'approve' ? 'Admin Notes (Optional)' : 'Reason for Rejection *'}
                </Label>
                <Textarea
                  id="admin-notes"
                  placeholder={
                    dialogType === 'approve'
                      ? 'Optional notes about this approval...'
                      : 'Please explain why this request is being rejected...'
                  }
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedRequest) {
                  if (dialogType === 'approve') {
                    handleApprove(selectedRequest.id, adminNotes);
                  } else {
                    handleReject(selectedRequest.id, adminNotes);
                  }
                }
              }}
              disabled={processingId !== null || (dialogType === 'reject' && !adminNotes.trim())}
              variant={dialogType === 'approve' ? 'default' : 'destructive'}
            >
              {processingId ? 'Processing...' : (dialogType === 'approve' ? 'Approve' : 'Reject')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PremiumRequestsManagement;