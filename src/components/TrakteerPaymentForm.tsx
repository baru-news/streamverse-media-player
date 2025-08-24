import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ExternalLink, Upload, CreditCard, AlertCircle, CheckCircle, MessageSquare } from 'lucide-react';
import { usePremiumRequests } from '@/hooks/usePremiumRequests';
import { toast } from '@/hooks/use-toast';

const TRAKTEER_AMOUNT = 50000; // IDR 50,000
const TRAKTEER_URL = "https://trakteer.id/your-username"; // Replace with actual Trakteer URL

interface TrakteerPaymentFormProps {
  telegramUsername?: string;
  amount?: number;
  subscriptionType?: string;
}

const TrakteerPaymentForm = ({ telegramUsername, amount = 50000, subscriptionType = 'telegram_lifetime' }: TrakteerPaymentFormProps) => {
  const { submitRequest, loading } = usePremiumRequests();
  const [formData, setFormData] = useState({
    trakteer_transaction_id: '',
    payment_proof_url: '',
    amount: amount,
  });
  const [step, setStep] = useState<'payment' | 'proof'>('payment');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitProof = async () => {
    if (!formData.trakteer_transaction_id || !formData.payment_proof_url) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    const result = await submitRequest({
      trakteer_transaction_id: formData.trakteer_transaction_id,
      payment_proof_url: formData.payment_proof_url,
      amount: formData.amount,
      subscription_type: subscriptionType,
      telegram_username: telegramUsername || ''
    });
    
    if (!result.error) {
      toast({
        title: "Success",
        description: "Payment proof submitted! We'll review it within 24 hours and invite you to our premium Telegram channel.",
      });
      setStep('payment');
      setFormData({
        trakteer_transaction_id: '',
        payment_proof_url: '',
        amount: amount,
      });
    }
    setSubmitting(false);
  };

  if (step === 'proof') {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Submit Payment Proof
          </CardTitle>
          <CardDescription>
            Please provide your Trakteer transaction details and payment proof
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Make sure your payment amount matches exactly <strong>IDR {amount.toLocaleString('id-ID')}</strong> 
              for {subscriptionType.includes('streaming') ? 'streaming premium' : 'lifetime premium membership'} verification.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div>
              <Label htmlFor="transaction-id">Trakteer Transaction ID *</Label>
              <Input
                id="transaction-id"
                placeholder="e.g., TRX123456789"
                value={formData.trakteer_transaction_id}
                onChange={(e) => setFormData(prev => ({ ...prev, trakteer_transaction_id: e.target.value }))}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="proof-url">Payment Proof Image URL *</Label>
              <Textarea
                id="proof-url"
                placeholder="Upload your screenshot to imgur.com or similar service and paste the URL here"
                value={formData.payment_proof_url}
                onChange={(e) => setFormData(prev => ({ ...prev, payment_proof_url: e.target.value }))}
                className="mt-1"
                rows={3}
              />
            </div>

            <div>
              <Label>Linked Telegram Account</Label>
              <div className="mt-1 p-3 bg-muted rounded-md flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{telegramUsername}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                This verified Telegram account will receive premium channel access
              </p>
            </div>

            <div>
              <Label>Payment Amount</Label>
              <div className="mt-1 p-3 bg-muted rounded-md">
                <span className="text-lg font-semibold">IDR {amount.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setStep('payment')}
              className="flex-1"
            >
              Back to Payment
            </Button>
            <Button
              onClick={handleSubmitProof}
              disabled={!formData.trakteer_transaction_id || !formData.payment_proof_url || submitting}
              className="flex-1"
            >
              {submitting ? 'Submitting...' : 'Submit for Review'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Pay with Trakteer
        </CardTitle>
        <CardDescription>
          Support us through Trakteer and get lifetime premium benefits
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>{subscriptionType === 'telegram_lifetime' ? 'Lifetime Telegram Premium' : 'Streaming Premium'}</strong> - 
              {subscriptionType === 'telegram_lifetime' 
                ? ' One-time payment for permanent access to all premium features including 2x Kitty Keys, exclusive Telegram access, and premium badge.'
                : ' Streaming tanpa iklan dengan kualitas premium dan loading cepat.'
              }
            </AlertDescription>
          </Alert>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
          <div className="text-center mb-4">
            <div className="text-3xl font-bold text-green-700 mb-2">
              IDR {amount.toLocaleString('id-ID')}
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {subscriptionType === 'telegram_lifetime' ? 'Lifetime Access' : 
               subscriptionType.includes('1month') ? '30 Hari' :
               subscriptionType.includes('3month') ? '90 Hari' :
               subscriptionType.includes('6month') ? '180 Hari' :
               subscriptionType.includes('1year') ? '365 Hari' : 'Premium'}
            </Badge>
          </div>
          
          <div className="space-y-3 text-sm text-green-700">
            <p className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              Exclusive premium Telegram channel access
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              2x Kitty Key rewards on every daily claim (permanent)
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              Premium Member badge display
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              Priority support and early access to features
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold">How to Pay:</h3>
          <ol className="space-y-3 text-sm">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">1</span>
              <span>Click the button below to open Trakteer in a new tab</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">2</span>
              <span>Support us with exactly <strong>IDR {amount.toLocaleString('id-ID')}</strong></span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">3</span>
              <span>Screenshot the confirmation/receipt page</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">4</span>
              <span>Come back here and submit your payment proof</span>
            </li>
          </ol>
        </div>

        <Separator />

        <div className="flex gap-3">
          <Button
            asChild
            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
          >
            <a href={TRAKTEER_URL} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              Pay on Trakteer
            </a>
          </Button>
          <Button
            variant="outline"
            onClick={() => setStep('proof')}
            className="flex-1"
          >
            <Upload className="w-4 h-4 mr-2" />
            Submit Proof
          </Button>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Manual Verification:</strong> After payment, our team will verify your transaction within 24 hours. 
            You'll receive a notification once your premium subscription is activated.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default TrakteerPaymentForm;