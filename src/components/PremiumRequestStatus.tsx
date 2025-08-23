import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, XCircle, AlertCircle, RefreshCw, Edit } from 'lucide-react';
import { usePremiumRequests } from '@/hooks/usePremiumRequests';
import { formatDistanceToNow } from 'date-fns';

const PremiumRequestStatus = () => {
  const { requests, loading, refreshRequests } = usePremiumRequests();

  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (requests.length === 0) {
    return null;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
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

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Your premium subscription request is being reviewed. We typically process requests within 24 hours.';
      case 'approved':
        return 'Congratulations! Your premium subscription has been approved and activated. Enjoy your premium benefits!';
      case 'rejected':
        return 'Your premium subscription request was rejected. Please check the admin notes below for details.';
      default:
        return 'Unknown status';
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Premium Request Status
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshRequests}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <CardDescription>
          Track your premium subscription request progress
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {requests.map((request) => (
          <div key={request.id} className="border rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {getStatusIcon(request.status)}
                <Badge className={getStatusColor(request.status)}>
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
              </div>
            </div>

            <Alert className={`mb-3 ${request.status === 'approved' ? 'border-green-200 bg-green-50' : 
                                    request.status === 'rejected' ? 'border-red-200 bg-red-50' : 
                                    'border-yellow-200 bg-yellow-50'}`}>
              <AlertDescription>
                {getStatusMessage(request.status)}
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Amount:</span>
                <div className="text-muted-foreground">
                  IDR {request.amount.toLocaleString('id-ID')}
                </div>
              </div>
              <div>
                <span className="font-medium">Type:</span>
                <div className="text-muted-foreground capitalize">
                  {request.subscription_type}
                </div>
              </div>
              {request.trakteer_transaction_id && (
                <div>
                  <span className="font-medium">Transaction ID:</span>
                  <div className="text-muted-foreground font-mono text-xs">
                    {request.trakteer_transaction_id}
                  </div>
                </div>
              )}
              {request.processed_at && (
                <div>
                  <span className="font-medium">Processed:</span>
                  <div className="text-muted-foreground">
                    {formatDistanceToNow(new Date(request.processed_at), { addSuffix: true })}
                  </div>
                </div>
              )}
            </div>

            {request.admin_notes && (
              <>
                <Separator className="my-3" />
                <div>
                  <span className="font-medium text-sm">Admin Notes:</span>
                  <div className="text-sm text-muted-foreground mt-1 p-2 bg-muted rounded">
                    {request.admin_notes}
                  </div>
                </div>
              </>
            )}

            {request.payment_proof_url && (
              <>
                <Separator className="my-3" />
                <div>
                  <span className="font-medium text-sm">Payment Proof:</span>
                  <div className="mt-2">
                    <img
                      src={request.payment_proof_url}
                      alt="Payment proof"
                      className="max-w-full h-auto rounded border max-h-40 object-contain"
                    />
                  </div>
                </div>
              </>
            )}

            {request.status === 'pending' && (
              <>
                <Separator className="my-3" />
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    // TODO: Implement edit functionality
                    console.log('Edit request:', request.id);
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Request
                </Button>
              </>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default PremiumRequestStatus;