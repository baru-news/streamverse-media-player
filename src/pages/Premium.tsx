import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePremium } from '@/hooks/usePremium';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, Crown, Users, Star, MessageSquare, ArrowLeft, Play, Zap, Clock, Gift, Shield } from 'lucide-react';
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
  const [selectedPlan, setSelectedPlan] = useState<'telegram' | 'streaming'>('streaming');

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-purple-50/30">
      <SEO 
        title="Premium Elite - Upgrade Your Experience"
        description="Bergabunglah dengan komunitas eksklusif - Premium Telegram seumur hidup atau Streaming tanpa iklan dengan kualitas HD"
      />
      
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="group flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all duration-300 hover:scale-105"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
            <span className="hidden sm:inline">Kembali</span>
          </Button>
        </div>
        
        {/* Elite Hero Section */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 blur-3xl"></div>
            <div className="relative inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-2xl shadow-2xl hover:shadow-purple-500/25 transition-all duration-500 hover:scale-105">
              <Crown className="w-6 h-6 animate-pulse" />
              <span className="font-bold text-lg">PREMIUM ELITE</span>
              <Crown className="w-6 h-6 animate-pulse" />
            </div>
          </div>
          
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent leading-tight">
            UPGRADE TO
            <br />
            <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
              ELITE
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Rasakan pengalaman premium yang tak terlupakan dengan akses eksklusif dan fitur-fitur canggih
          </p>
          
          <div className="flex items-center justify-center gap-8 mt-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>100% Aman & Terpercaya</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span>Support 24/7</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              <span>Akses Selamanya</span>
            </div>
          </div>
        </div>

        {/* Elite Status Display */}
        {(hasTelegram || isPremiumStreaming) && (
          <div className="mb-12 animate-scale-in">
            <Card className="relative overflow-hidden border-0 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10 backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-emerald-400/20 animate-pulse"></div>
              <CardHeader className="relative">
                <CardTitle className="flex items-center gap-3 text-2xl font-bold text-green-700">
                  <div className="p-2 bg-green-500 rounded-xl shadow-lg">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  Status Elite Anda
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="group relative overflow-hidden bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-bl-full"></div>
                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-lg text-gray-800">Telegram Elite</h4>
                          <p className="text-sm text-muted-foreground">Komunitas Eksklusif</p>
                        </div>
                      </div>
                      <Badge 
                        variant={hasTelegram ? "default" : "secondary"}
                        className={hasTelegram ? "bg-green-500 hover:bg-green-600 shadow-lg" : ""}
                      >
                        {hasTelegram ? "🔥 AKTIF" : "Tidak Aktif"}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="group relative overflow-hidden bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-bl-full"></div>
                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl shadow-lg">
                          <Play className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-lg text-gray-800">Streaming Elite</h4>
                          <p className="text-sm text-muted-foreground">Premium HD Experience</p>
                        </div>
                      </div>
                      <Badge 
                        variant={isPremiumStreaming ? "default" : "secondary"}
                        className={isPremiumStreaming ? "bg-purple-500 hover:bg-purple-600 shadow-lg" : ""}
                      >
                        {isPremiumStreaming ? "🔥 AKTIF" : "Tidak Aktif"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Elite Subscription Tabs */}
        <div className="mb-8">
          <Tabs value={selectedPlan} onValueChange={(value) => setSelectedPlan(value as 'telegram' | 'streaming')} className="w-full">
            <div className="flex justify-center mb-12">
              <TabsList className="grid grid-cols-2 w-full max-w-md h-16 p-2 bg-white/50 backdrop-blur-sm border border-white/20 shadow-2xl rounded-2xl">
                <TabsTrigger 
                  value="streaming" 
                  className="flex items-center gap-3 h-12 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-xl font-semibold hover:scale-105"
                >
                  <Play className="w-5 h-5" />
                  <span className="hidden sm:inline">Streaming Elite</span>
                  <span className="sm:hidden">Stream</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="telegram" 
                  className="flex items-center gap-3 h-12 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-xl font-semibold hover:scale-105"
                >
                  <Users className="w-5 h-5" />
                  <span className="hidden sm:inline">Telegram Elite</span>
                  <span className="sm:hidden">Telegram</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="streaming" className="space-y-8 animate-fade-in">
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
                  Streaming Elite Plans
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Nikmati streaming berkualitas HD tanpa gangguan iklan
                </p>
              </div>
              
              <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">
                {streamingPlans.map((plan, index) => (
                  <Card 
                    key={plan.id} 
                    className={`group relative overflow-hidden transition-all duration-500 hover:shadow-2xl border-0 ${
                      plan.popular 
                        ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white scale-110 shadow-2xl shadow-purple-500/25' 
                        : 'bg-white/80 backdrop-blur-sm hover:bg-white hover:scale-105 shadow-xl'
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-0 -left-4 -right-4 bg-gradient-to-r from-amber-400 to-orange-500 text-black text-center py-3 text-sm font-bold shadow-lg transform -rotate-1 z-10">
                        ⚡ MOST POPULAR ⚡
                      </div>
                    )}
                    
                    {!plan.popular && (
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    )}
                    
                    <CardHeader className={`relative ${plan.popular ? 'pt-12' : 'pt-8'} pb-6`}>
                      <div className="text-center space-y-4">
                        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${
                          plan.popular ? 'bg-white/20' : 'bg-gradient-to-r from-purple-500 to-pink-600'
                        } shadow-lg`}>
                          <Play className={`w-8 h-8 text-white`} />
                        </div>
                        
                        <CardTitle className={`text-2xl font-bold ${
                          plan.popular ? 'text-white' : 'text-gray-800'
                        }`}>
                          {plan.name}
                        </CardTitle>
                        
                        <div className="space-y-2">
                          {plan.discount > 0 && (
                            <div className="flex items-center justify-center gap-2">
                              <span className={`text-lg line-through ${
                                plan.popular ? 'text-white/70' : 'text-muted-foreground'
                              }`}>
                                Rp {plan.originalPrice?.toLocaleString('id-ID')}
                              </span>
                              <Badge 
                                variant={plan.popular ? "secondary" : "destructive"} 
                                className={plan.popular ? "bg-white/20 text-white border-white/30" : "bg-red-500 text-white"}
                              >
                                HEMAT {plan.discount}%
                              </Badge>
                            </div>
                          )}
                          <div className={`text-4xl font-black ${
                            plan.popular ? 'text-white' : 'text-purple-900'
                          }`}>
                            Rp {plan.price.toLocaleString('id-ID')}
                          </div>
                          <div className={`text-sm font-medium ${
                            plan.popular ? 'text-white/80' : 'text-muted-foreground'
                          }`}>
                            {plan.duration}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="relative">
                      <div className="space-y-4 mb-8">
                        <div className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
                          plan.popular ? 'bg-white/10' : 'bg-purple-50 group-hover:bg-purple-100'
                        }`}>
                          <Zap className={`w-5 h-5 ${plan.popular ? 'text-yellow-300' : 'text-yellow-600'}`} />
                          <span className={`text-sm font-medium ${
                            plan.popular ? 'text-white' : 'text-gray-700'
                          }`}>
                            Streaming Tanpa Iklan
                          </span>
                        </div>
                        
                        <div className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
                          plan.popular ? 'bg-white/10' : 'bg-blue-50 group-hover:bg-blue-100'
                        }`}>
                          <Star className={`w-5 h-5 ${plan.popular ? 'text-blue-300' : 'text-blue-600'}`} />
                          <span className={`text-sm font-medium ${
                            plan.popular ? 'text-white' : 'text-gray-700'
                          }`}>
                            Kualitas HD Premium
                          </span>
                        </div>
                        
                        <div className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
                          plan.popular ? 'bg-white/10' : 'bg-green-50 group-hover:bg-green-100'
                        }`}>
                          <Clock className={`w-5 h-5 ${plan.popular ? 'text-green-300' : 'text-green-600'}`} />
                          <span className={`text-sm font-medium ${
                            plan.popular ? 'text-white' : 'text-gray-700'
                          }`}>
                            Loading Super Cepat
                          </span>
                        </div>
                        
                        {plan.discount > 0 && (
                          <div className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
                            plan.popular ? 'bg-white/10' : 'bg-red-50 group-hover:bg-red-100'
                          }`}>
                            <Gift className={`w-5 h-5 ${plan.popular ? 'text-red-300' : 'text-red-600'}`} />
                            <span className={`text-sm font-bold ${
                              plan.popular ? 'text-white' : 'text-red-600'
                            }`}>
                              HEMAT {plan.discount}% 🎉
                            </span>
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
                          <div className="space-y-4">
                            <Alert className={`border-0 ${
                              plan.popular ? 'bg-white/20 text-white' : 'bg-amber-50 border-amber-200'
                            }`}>
                              <MessageSquare className={`h-4 w-4 ${
                                plan.popular ? 'text-white' : 'text-amber-600'
                              }`} />
                              <AlertDescription className={`text-sm ${
                                plan.popular ? 'text-white' : 'text-amber-800'
                              }`}>
                                Link akun Telegram dulu untuk melanjutkan pembelian
                              </AlertDescription>
                            </Alert>
                            <Button 
                              disabled 
                              className={`w-full h-12 font-bold ${
                                plan.popular 
                                  ? 'bg-white/20 text-white border border-white/30 hover:bg-white/30' 
                                  : 'bg-gray-100 text-gray-400'
                              }`}
                            >
                              Pilih Paket Elite
                            </Button>
                          </div>
                        )
                      ) : (
                        <Alert className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-400/30">
                          <Check className="h-5 w-5 text-green-600" />
                          <AlertDescription className="text-green-800 font-semibold">
                            ✨ Streaming Elite Aktif ✨
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {/* Elite Badge Preview for Streaming */}
              <div className="mt-12">
                <BadgePreview subscriptionType="streaming" />
              </div>
              
              {/* Elite Features Showcase */}
              <Card className="mt-12 border-0 bg-gradient-to-br from-purple-600/10 via-pink-600/10 to-indigo-600/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-center text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    ✨ Elite Features ✨
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-8 text-center">
                    <div className="group space-y-4 p-6 rounded-2xl bg-white/50 backdrop-blur-sm hover:bg-white/80 transition-all duration-500 hover:scale-105 hover:shadow-xl">
                      <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg group-hover:shadow-yellow-500/25 transition-shadow duration-500">
                        <Zap className="w-8 h-8 text-white" />
                      </div>
                      <h4 className="font-bold text-xl text-gray-800">Zero Ads</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">Streaming tanpa gangguan iklan sama sekali</p>
                    </div>
                    
                    <div className="group space-y-4 p-6 rounded-2xl bg-white/50 backdrop-blur-sm hover:bg-white/80 transition-all duration-500 hover:scale-105 hover:shadow-xl">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg group-hover:shadow-blue-500/25 transition-shadow duration-500">
                        <Star className="w-8 h-8 text-white" />
                      </div>
                      <h4 className="font-bold text-xl text-gray-800">Ultra HD</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">Kualitas video kristal jernih dengan resolusi maksimal</p>
                    </div>
                    
                    <div className="group space-y-4 p-6 rounded-2xl bg-white/50 backdrop-blur-sm hover:bg-white/80 transition-all duration-500 hover:scale-105 hover:shadow-xl">
                      <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg group-hover:shadow-green-500/25 transition-shadow duration-500">
                        <Clock className="w-8 h-8 text-white" />
                      </div>
                      <h4 className="font-bold text-xl text-gray-800">Lightning Fast</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">Loading super cepat tanpa buffering</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="telegram" className="space-y-8 animate-fade-in">
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
                  Telegram Elite Lifetime
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Bergabung dengan komunitas eksklusif dan dapatkan akses selamanya
                </p>
              </div>
              
              <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white shadow-2xl shadow-blue-500/25">
                {/* Elite background effects */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-400/20"></div>
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-white/10 to-transparent rounded-bl-full"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-white/5 to-transparent rounded-tr-full"></div>
                
                {/* Lifetime Badge */}
                <div className="absolute top-6 right-6 z-10">
                  <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-black font-bold px-4 py-2 shadow-lg">
                    <Crown className="w-4 h-4 mr-2" />
                    LIFETIME ACCESS
                  </Badge>
                </div>
                
                <CardHeader className="relative pb-8 pt-12">
                  <div className="flex items-center gap-6 mb-8">
                    <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg">
                      <Users className="w-10 h-10 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-3xl font-bold text-white">{telegramPlan.name}</CardTitle>
                      <CardDescription className="text-blue-100 text-lg">
                        Komunitas eksklusif elite members selamanya
                      </CardDescription>
                    </div>
                  </div>
                  
                  <div className="text-center py-8 space-y-2">
                    <div className="text-6xl font-black text-white mb-4">
                      Rp {telegramPlan.price.toLocaleString('id-ID')}
                    </div>
                    <div className="text-xl text-blue-100 font-semibold">{telegramPlan.duration}</div>
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-sm">One-time payment • No recurring fees</span>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="relative">
                  <div className="space-y-6 mb-10">
                    {telegramPlan.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-4 p-4 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-all duration-300">
                        <div className="p-2 bg-green-500 rounded-lg shadow-lg">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-white font-medium leading-relaxed">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  {!hasTelegram ? (
                    telegramLinked ? (
                      <div className="space-y-6">
                        <div className="text-center space-y-2 mb-6">
                          <div className="inline-flex items-center gap-2 bg-green-500/20 backdrop-blur-sm px-4 py-2 rounded-full border border-green-400/30">
                            <Check className="w-4 h-4 text-green-400" />
                            <span className="text-green-300 font-medium text-sm">Telegram Berhasil Terhubung</span>
                          </div>
                          <div className="text-white/90 text-lg font-semibold">
                            🚀 Siap untuk bergabung dengan elite members?
                          </div>
                        </div>
                        <TrakteerPaymentForm 
                          telegramUsername={telegramUsername}
                          amount={telegramPlan.price}
                          subscriptionType="telegram_lifetime"
                        />
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Step-by-step verification header */}
                        <div className="text-center space-y-4 mb-8">
                          <div className="inline-flex items-center gap-2 bg-amber-500/20 backdrop-blur-sm px-6 py-3 rounded-full border border-amber-400/30">
                            <MessageSquare className="w-5 h-5 text-amber-300" />
                            <span className="text-amber-200 font-bold text-lg">STEP 1: Verifikasi Telegram</span>
                          </div>
                          <p className="text-white/80 text-sm max-w-md mx-auto leading-relaxed">
                            Untuk keamanan dan akses eksklusif, Anda perlu menghubungkan akun Telegram terlebih dahulu
                          </p>
                        </div>

                        {/* Enhanced verification process */}
                        <div className="relative">
                          {/* Glowing border effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-3xl blur-sm"></div>
                          <div className="relative bg-white/15 backdrop-blur-md rounded-3xl p-8 border border-white/20">
                            <TelegramLinkForm onSuccess={handleTelegramSuccess} />
                          </div>
                        </div>

                        {/* Next step preview */}
                        <div className="text-center space-y-3 mt-8 p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
                          <div className="inline-flex items-center gap-2 text-white/60">
                            <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-xs font-bold">2</div>
                            <span className="text-sm font-medium">Selanjutnya: Pembayaran Elite</span>
                          </div>
                          <div className="flex items-center justify-center gap-6 text-xs text-white/50">
                            <div className="flex items-center gap-1">
                              <Shield className="w-3 h-3" />
                              <span>Pembayaran Aman</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Zap className="w-3 h-3" />
                              <span>Akses Instan</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Crown className="w-3 h-3" />
                              <span>Elite Forever</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  ) : (
                    <Alert className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-400/30 text-white">
                      <Check className="h-6 w-6 text-green-400" />
                      <AlertDescription className="text-white font-bold text-lg">
                        ✨ Telegram Elite sudah aktif! Selamat menjadi member elite! ✨
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
              
              {/* Elite Badge Preview for Telegram */}
              <div className="mt-12">
                <BadgePreview subscriptionType="telegram" />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Elite Premium Request Status */}
        <div className="mt-16">
          <Card className="border-0 bg-gradient-to-r from-slate-100/50 to-gray-100/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-center text-2xl font-bold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">
                📋 Status Permintaan Premium
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PremiumRequestStatus />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Premium;