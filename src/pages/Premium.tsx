import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePremium } from '@/hooks/usePremium';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, Crown, Key, Users, Star, MessageSquare, ArrowRight, ArrowLeft, Play, Zap, Clock, Gift } from 'lucide-react';
import SEO from '@/components/SEO';
import TrakteerPaymentForm from '@/components/TrakteerPaymentForm';
import PremiumRequestStatus from '@/components/PremiumRequestStatus';
import { TelegramLinkForm } from '@/components/TelegramLinkForm';
import BadgePreview from '@/components/BadgePreview';
import { supabase } from '@/integrations/supabase/client';

const Premium = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { status, error } = usePremium();
  
  const telegramSub = status.telegram.subscription;
  const telegramLoading = status.telegram.loading;
  const hasTelegram = status.telegram.isActive;
  const streamingSub = status.streaming.subscription;
  const streamingLoading = status.streaming.loading;
  const isPremiumStreaming = status.streaming.isActive;
  const [currentStep, setCurrentStep] = useState(1);
  const [telegramLinked, setTelegramLinked] = useState(false);
  const [telegramUsername, setTelegramUsername] = useState<string>('');
  const [profileLoading, setProfileLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<'telegram' | 'streaming'>('telegram');

  // Fetch user profile to check Telegram linking status
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      setProfileLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('telegram_username, telegram_user_id')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        
        if (data?.telegram_username && data?.telegram_user_id) {
          setTelegramLinked(true);
          setTelegramUsername(data.telegram_username);
          setCurrentStep(2);
        } else {
          setTelegramLinked(false);
          setCurrentStep(1);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleTelegramSuccess = (username: string) => {
    setTelegramLinked(true);
    setTelegramUsername(username);
    setCurrentStep(2);
  };

  // Pricing plans
  const telegramPlan = {
    name: 'Telegram Lifetime',
    price: 149000,
    duration: 'Seumur Hidup',
    features: [
      'Akses channel Telegram premium eksklusif',
      'Reward Kitty Key 2x pada setiap klaim harian',
      'Badge Premium Member (tampilan permanen)',
      'Dukungan prioritas dan feedback',
      'Akses awal ke fitur baru',
      'Benefit seumur hidup (tidak pernah kedaluwarsa)'
    ]
  };

  const streamingPlans = [
    {
      id: 'streaming_1month',
      name: '1 Bulan',
      price: 15000,
      duration: '30 hari',
      popular: false,
      discount: 0
    },
    {
      id: 'streaming_3month', 
      name: '3 Bulan',
      price: 40000,
      originalPrice: 45000,
      duration: '90 hari',
      popular: true,
      discount: 11
    },
    {
      id: 'streaming_6month',
      name: '6 Bulan', 
      price: 75000,
      originalPrice: 90000,
      duration: '180 hari',
      popular: false,
      discount: 17
    },
    {
      id: 'streaming_1year',
      name: '1 Tahun',
      price: 140000,
      originalPrice: 180000, 
      duration: '365 hari',
      popular: false,
      discount: 22
    }
  ];

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <SEO 
          title="Berlangganan Premium"
          description="Upgrade ke Premium untuk benefit eksklusif"
        />
        
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Kembali</span>
          </Button>
        </div>
        
        <div className="text-center">
          <h1 className="text-xl sm:text-2xl font-bold mb-4">Berlangganan Premium</h1>
          <p className="text-muted-foreground mb-6 text-sm sm:text-base">Silakan masuk untuk melihat opsi berlangganan premium.</p>
          <Button onClick={() => navigate('/login')} size="lg" className="w-full sm:w-auto">
            Masuk
          </Button>
        </div>
      </div>
    );
  }

  if (telegramLoading || streamingLoading || profileLoading) {
    return (
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <SEO title="Loading Premium..." />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 sm:py-8">
      <SEO 
        title="Premium Subscriptions"
        description="Pilih paket premium yang sesuai: Telegram Lifetime atau Streaming tanpa iklan"
      />
      
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Kembali</span>
        </Button>
      </div>
      
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-100 to-teal-200 text-emerald-800 px-4 py-2 sm:px-6 sm:py-3 rounded-full mb-6 shadow-lg text-sm sm:text-base">
          <Crown className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="font-semibold">Premium Subscriptions</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Pilih Paket Premium Anda
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Dua jenis premium untuk kebutuhan berbeda - Telegram seumur hidup atau streaming tanpa iklan
        </p>
      </div>

      {/* Current Subscriptions Status */}
      {(hasTelegram || isPremiumStreaming) && (
        <Card className="mb-8 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Check className="w-5 h-5" />
              Status Premium Anda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-blue-600" />
                  <div>
                    <h4 className="font-semibold">Telegram Premium</h4>
                    <p className="text-sm text-muted-foreground">Akses grup telegram</p>
                  </div>
                </div>
                <Badge variant={hasTelegram ? "default" : "secondary"}>
                  {hasTelegram ? "Aktif" : "Tidak Aktif"}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                <div className="flex items-center gap-3">
                  <Play className="w-5 h-5 text-purple-600" />
                  <div>
                    <h4 className="font-semibold">Streaming Premium</h4>
                    <p className="text-sm text-muted-foreground">Nonton tanpa iklan</p>
                  </div>
                </div>
                <Badge variant={isPremiumStreaming ? "default" : "secondary"}>
                  {isPremiumStreaming ? "Aktif" : "Tidak Aktif"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscription Plans */}
      <Tabs value={selectedPlan} onValueChange={(value) => setSelectedPlan(value as 'telegram' | 'streaming')} className="mb-8">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="telegram" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Telegram Premium
          </TabsTrigger>
          <TabsTrigger value="streaming" className="flex items-center gap-2">
            <Play className="w-4 h-4" />
            Streaming Premium
          </TabsTrigger>
        </TabsList>

        <TabsContent value="telegram" className="space-y-6">
          <Card className="relative overflow-hidden border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
            <div className="absolute top-4 right-4">
              <Badge className="bg-blue-600 text-white">
                <Crown className="w-3 h-3 mr-1" />
                Lifetime
              </Badge>
            </div>
            
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-blue-900">{telegramPlan.name}</CardTitle>
                  <CardDescription className="text-blue-700">Akses eksklusif grup telegram selamanya</CardDescription>
                </div>
              </div>
              
              <div className="text-center py-4">
                <div className="text-4xl font-bold text-blue-900 mb-2">
                  Rp {telegramPlan.price.toLocaleString('id-ID')}
                </div>
                <div className="text-blue-700">{telegramPlan.duration}</div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3 mb-6">
                {telegramPlan.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
              
              {!hasTelegram ? (
                telegramLinked ? (
                  <TrakteerPaymentForm 
                    telegramUsername={telegramUsername}
                    amount={telegramPlan.price}
                    subscriptionType="telegram_lifetime"
                  />
                ) : (
                  <div className="space-y-4">
                    <Alert>
                      <MessageSquare className="h-4 w-4" />
                      <AlertDescription>
                        Hubungkan akun Telegram Anda terlebih dahulu untuk melanjutkan pembelian.
                      </AlertDescription>
                    </Alert>
                    <TelegramLinkForm onSuccess={handleTelegramSuccess} />
                  </div>
                )
              ) : (
                <Alert className="bg-green-50 border-green-200">
                  <Check className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Telegram Premium sudah aktif! Terima kasih sudah berlangganan.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
          
          {/* Badge Preview for Telegram */}
          <BadgePreview subscriptionType="telegram" />
        </TabsContent>

        <TabsContent value="streaming" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {streamingPlans.map((plan, index) => (
              <Card 
                key={plan.id} 
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg ${
                  plan.popular 
                    ? 'border-2 border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 scale-105' 
                    : 'border border-gray-200 hover:border-purple-300'
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center py-2 text-xs font-semibold">
                    🔥 PALING POPULER
                  </div>
                )}
                
                <CardHeader className={`${plan.popular ? 'pt-8' : 'pt-6'} pb-4`}>
                  <div className="text-center">
                    <CardTitle className="text-xl mb-2">{plan.name}</CardTitle>
                    <div className="mb-4">
                      {plan.discount > 0 && (
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <span className="text-lg text-muted-foreground line-through">
                            Rp {plan.originalPrice?.toLocaleString('id-ID')}
                          </span>
                          <Badge variant="destructive" className="text-xs">
                            -{plan.discount}%
                          </Badge>
                        </div>
                      )}
                      <div className="text-3xl font-bold text-purple-900">
                        Rp {plan.price.toLocaleString('id-ID')}
                      </div>
                      <div className="text-sm text-muted-foreground">{plan.duration}</div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm">Streaming tanpa iklan</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Play className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">Kualitas premium</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Loading lebih cepat</span>
                    </div>
                    {plan.discount > 0 && (
                      <div className="flex items-center gap-2">
                        <Gift className="w-4 h-4 text-red-600" />
                        <span className="text-sm font-semibold text-red-600">Hemat {plan.discount}%</span>
                      </div>
                    )}
                  </div>
                  
                  {!isPremiumStreaming ? (
                    telegramLinked ? (
                      <TrakteerPaymentForm 
                        telegramUsername={telegramUsername}
                        amount={plan.price}
                        subscriptionType={plan.id}
                      />
                    ) : (
                      <div className="space-y-3">
                        <Alert className="text-xs">
                          <MessageSquare className="h-3 w-3" />
                          <AlertDescription>
                            Link Telegram terlebih dahulu
                          </AlertDescription>
                        </Alert>
                        <Button disabled className="w-full" size="sm">
                          Pilih Paket
                        </Button>
                      </div>
                    )
                  ) : (
                    <Alert className="bg-green-50 border-green-200">
                      <Check className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800 text-xs">
                        Streaming Premium aktif
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Badge Preview for Streaming */}
          <BadgePreview subscriptionType="streaming" />
          
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <CardHeader>
              <CardTitle className="text-center text-purple-900">Fitur Streaming Premium</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4 text-center">
                <div className="space-y-2">
                  <Zap className="w-8 h-8 text-yellow-600 mx-auto" />
                  <h4 className="font-semibold">Tanpa Iklan</h4>
                  <p className="text-sm text-muted-foreground">Streaming tanpa gangguan iklan</p>
                </div>
                <div className="space-y-2">
                  <Play className="w-8 h-8 text-blue-600 mx-auto" />
                  <h4 className="font-semibold">Kualitas Premium</h4>
                  <p className="text-sm text-muted-foreground">Video berkualitas tinggi</p>
                </div>
                <div className="space-y-2">
                  <Clock className="w-8 h-8 text-green-600 mx-auto" />
                  <h4 className="font-semibold">Loading Cepat</h4>
                  <p className="text-sm text-muted-foreground">Server premium untuk loading cepat</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Steps for Purchase */}
      {!telegramLinked && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-center">Langkah-langkah Berlangganan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 text-center">
              <div className="space-y-2">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto font-bold">1</div>
                <h4 className="font-semibold">Link Telegram</h4>
                <p className="text-sm text-muted-foreground">Hubungkan akun Telegram Anda</p>
              </div>
              <div className="space-y-2">
                <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto font-bold">2</div>
                <h4 className="font-semibold">Pilih Paket</h4>
                <p className="text-sm text-muted-foreground">Telegram Lifetime atau Streaming</p>
              </div>
              <div className="space-y-2">
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto font-bold">3</div>
                <h4 className="font-semibold">Bayar & Nikmati</h4>
                <p className="text-sm text-muted-foreground">Lakukan pembayaran dan nikmati benefit</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Premium Request Status */}
      <div className="mt-8">
        <PremiumRequestStatus />
      </div>
    </div>
  );
};

export default Premium;