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
      price: 39000,
      originalPrice: 45000,
      duration: '90 hari',
      popular: true,
      discount: 13
    },
    {
      id: 'streaming_6month',
      name: '6 Bulan', 
      price: 69000,
      originalPrice: 90000,
      duration: '180 hari',
      popular: false,
      discount: 23
    }
  ];

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Akses Premium</CardTitle>
            <CardDescription>
              Silakan login untuk mengakses halaman premium
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/login')} className="w-full">
              Login Sekarang
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <SEO 
        title="Premium Elite Subscription"
        description="Upgrade ke premium untuk mendapatkan akses eksklusif, streaming tanpa iklan, dan benefit seumur hidup"
        keywords="premium, elite, subscription, streaming, telegram"
      />
      
      {/* Mobile-optimized container */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-12 max-w-7xl">
        {/* Enhanced Header - Mobile First */}
        <div className="text-center mb-8 lg:mb-16 animate-fade-in">
          <Button 
            onClick={() => navigate('/')}
            variant="outline" 
            size="sm"
            className="mb-6 lg:mb-8 hover:scale-105 transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Kembali ke Beranda</span>
            <span className="sm:hidden">Kembali</span>
          </Button>
          
          {/* Mobile-optimized title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black text-gray-900 mb-4 lg:mb-8 leading-tight">
            UPGRADE TO
            <br />
            <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
              ELITE
            </span>
          </h1>
          
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-4">
            Rasakan pengalaman premium yang tak terlupakan dengan akses eksklusif dan fitur-fitur canggih
          </p>
          
          {/* Mobile-responsive status indicators */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 mt-6 lg:mt-8 text-xs sm:text-sm text-muted-foreground">
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

        {/* Elite Status Display - Mobile Optimized */}
        {(hasTelegram || isPremiumStreaming) && (
          <div className="mb-8 lg:mb-12 animate-scale-in">
            <Card className="relative overflow-hidden border-0 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10 backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-emerald-400/20 animate-pulse"></div>
              <CardHeader className="relative p-4 sm:p-6">
                <CardTitle className="flex items-center gap-3 text-lg sm:text-xl lg:text-2xl font-bold text-green-700">
                  <div className="p-2 bg-green-500 rounded-xl shadow-lg">
                    <Crown className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                  </div>
                  Status Elite Anda
                </CardTitle>
              </CardHeader>
              <CardContent className="relative p-4 sm:p-6">
                <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                  {/* Telegram Elite Card - Mobile Optimized */}
                  <div className="group relative overflow-hidden bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105">
                    <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-bl-full"></div>
                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="p-2 sm:p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg sm:rounded-xl shadow-lg">
                          <Users className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-base sm:text-lg text-gray-800">Telegram Elite</h4>
                          <p className="text-xs sm:text-sm text-muted-foreground">Komunitas Eksklusif</p>
                        </div>
                      </div>
                      <Badge 
                        variant={hasTelegram ? "default" : "secondary"}
                        className={`text-xs sm:text-sm px-2 sm:px-3 py-1 ${hasTelegram ? "bg-green-500 hover:bg-green-600 shadow-lg" : ""}`}
                      >
                        {hasTelegram ? "🔥 AKTIF" : "Tidak Aktif"}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Streaming Elite Card - Mobile Optimized */}
                  <div className="group relative overflow-hidden bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105">
                    <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-bl-full"></div>
                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="p-2 sm:p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg sm:rounded-xl shadow-lg">
                          <Play className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-base sm:text-lg text-gray-800">Streaming Elite</h4>
                          <p className="text-xs sm:text-sm text-muted-foreground">Premium HD Experience</p>
                        </div>
                      </div>
                      <Badge 
                        variant={isPremiumStreaming ? "default" : "secondary"}
                        className={`text-xs sm:text-sm px-2 sm:px-3 py-1 ${isPremiumStreaming ? "bg-purple-500 hover:bg-purple-600 shadow-lg" : ""}`}
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

        {/* Elite Subscription Tabs - Mobile Optimized */}
        <div className="mb-8">
          <Tabs value={selectedPlan} onValueChange={(value) => setSelectedPlan(value as 'telegram' | 'streaming')} className="w-full">
            {/* Mobile-first tab navigation */}
            <div className="flex justify-center mb-8 lg:mb-12">
              <TabsList className="grid grid-cols-2 w-full max-w-sm sm:max-w-md h-12 sm:h-16 p-1 sm:p-2 bg-white/50 backdrop-blur-sm border border-white/20 shadow-2xl rounded-xl sm:rounded-2xl">
                <TabsTrigger 
                  value="streaming" 
                  className="flex items-center gap-2 sm:gap-3 h-10 sm:h-12 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg sm:rounded-xl font-semibold hover:scale-105 text-xs sm:text-sm"
                >
                  <Play className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                  <span className="hidden xs:inline">Streaming Elite</span>
                  <span className="xs:hidden">Stream</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="telegram"
                  className="flex items-center gap-2 sm:gap-3 h-10 sm:h-12 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg sm:rounded-xl font-semibold hover:scale-105 text-xs sm:text-sm"
                >
                  <Users className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                  <span className="hidden xs:inline">Telegram Elite</span>
                  <span className="xs:hidden">Telegram</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Streaming Elite Tab Content */}
            <TabsContent value="streaming" className="animate-fade-in">
              <div className="text-center mb-8 lg:mb-12">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
                  ⚡ Streaming Elite ⚡
                </h2>
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed px-4">
                  Nikmati streaming premium tanpa batas dengan kualitas HD dan tanpa iklan
                </p>
              </div>
              
              {/* Mobile-optimized pricing cards */}
              <div className="grid gap-4 sm:gap-6 lg:gap-8 md:grid-cols-2 lg:grid-cols-3 mb-8 lg:mb-12">
                {streamingPlans.map((plan, index) => (
                  <Card 
                    key={plan.id} 
                    className={`group relative overflow-hidden transition-all duration-500 hover:scale-105 hover:shadow-2xl border-0 ${
                      plan.popular 
                        ? 'bg-gradient-to-br from-purple-600 via-pink-600 to-indigo-700 text-white shadow-2xl shadow-purple-500/25 ring-2 ring-purple-400/50' 
                        : 'bg-white/80 backdrop-blur-sm shadow-xl hover:shadow-purple-500/10'
                    }`}
                  >
                    {/* Popular badge - Mobile responsive */}
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                        <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-black font-bold px-3 py-1 sm:px-4 sm:py-2 shadow-lg text-xs sm:text-sm">
                          <Crown className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          TERPOPULER
                        </Badge>
                      </div>
                    )}
                    
                    {/* Background effects - Responsive */}
                    {plan.popular && (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-pink-400/20"></div>
                        <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-bl from-white/10 to-transparent rounded-bl-full"></div>
                        <div className="absolute bottom-0 left-0 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-tr from-white/5 to-transparent rounded-tr-full"></div>
                      </>
                    )}
                    
                    <CardHeader className={`relative text-center p-4 sm:p-6 ${plan.popular ? 'pb-6 sm:pb-8 pt-8 sm:pt-12' : ''}`}>
                      <div className="space-y-3 sm:space-y-4">
                        <CardTitle className={`text-lg sm:text-xl lg:text-2xl font-bold ${
                          plan.popular ? 'text-white' : 'text-gray-800'
                        }`}>
                          {plan.name}
                        </CardTitle>
                        
                        <div className="space-y-2">
                          {plan.discount > 0 && (
                            <div className="flex items-center justify-center gap-2">
                              <span className={`text-sm sm:text-lg line-through ${
                                plan.popular ? 'text-white/70' : 'text-muted-foreground'
                              }`}>
                                Rp {plan.originalPrice?.toLocaleString('id-ID')}
                              </span>
                              <Badge 
                                variant={plan.popular ? "secondary" : "destructive"} 
                                className={`text-xs sm:text-sm ${plan.popular ? "bg-white/20 text-white border-white/30" : "bg-red-500 text-white"}`}
                              >
                                HEMAT {plan.discount}%
                              </Badge>
                            </div>
                          )}
                          <div className={`text-2xl sm:text-3xl lg:text-4xl font-black ${
                            plan.popular ? 'text-white' : 'text-purple-900'
                          }`}>
                            Rp {plan.price.toLocaleString('id-ID')}
                          </div>
                          <div className={`text-xs sm:text-sm font-medium ${
                            plan.popular ? 'text-white/80' : 'text-muted-foreground'
                          }`}>
                            {plan.duration}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="relative p-4 sm:p-6">
                      <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                        <div className={`flex items-center gap-3 p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-300 ${
                          plan.popular ? 'bg-white/10' : 'bg-purple-50 group-hover:bg-purple-100'
                        }`}>
                          <Zap className={`w-4 h-4 sm:w-5 sm:h-5 ${plan.popular ? 'text-yellow-300' : 'text-yellow-600'}`} />
                          <span className={`text-xs sm:text-sm font-medium ${
                            plan.popular ? 'text-white' : 'text-gray-700'
                          }`}>
                            Streaming Tanpa Iklan
                          </span>
                        </div>
                        
                        <div className={`flex items-center gap-3 p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-300 ${
                          plan.popular ? 'bg-white/10' : 'bg-blue-50 group-hover:bg-blue-100'
                        }`}>
                          <Star className={`w-4 h-4 sm:w-5 sm:h-5 ${plan.popular ? 'text-blue-300' : 'text-blue-600'}`} />
                          <span className={`text-xs sm:text-sm font-medium ${
                            plan.popular ? 'text-white' : 'text-gray-700'
                          }`}>
                            Kualitas HD Premium
                          </span>
                        </div>
                        
                        <div className={`flex items-center gap-3 p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-300 ${
                          plan.popular ? 'bg-white/10' : 'bg-green-50 group-hover:bg-green-100'
                        }`}>
                          <Clock className={`w-4 h-4 sm:w-5 sm:h-5 ${plan.popular ? 'text-green-300' : 'text-green-600'}`} />
                          <span className={`text-xs sm:text-sm font-medium ${
                            plan.popular ? 'text-white' : 'text-gray-700'
                          }`}>
                            Loading Super Cepat
                          </span>
                        </div>
                        
                        {plan.discount > 0 && (
                          <div className={`flex items-center gap-3 p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-300 ${
                            plan.popular ? 'bg-white/10' : 'bg-red-50 group-hover:bg-red-100'
                          }`}>
                            <Gift className={`w-4 h-4 sm:w-5 sm:h-5 ${plan.popular ? 'text-red-300' : 'text-red-600'}`} />
                            <span className={`text-xs sm:text-sm font-bold ${
                              plan.popular ? 'text-white' : 'text-red-600'
                            }`}>
                              HEMAT {plan.discount}% 🎉
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {!isPremiumStreaming ? (
                        <TrakteerPaymentForm 
                          telegramUsername={telegramUsername}
                          amount={plan.price}
                          subscriptionType={plan.id}
                        />
                      ) : (
                        <Alert className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-400/30">
                          <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                          <AlertDescription className="text-green-800 font-semibold text-xs sm:text-sm">
                            ✨ Streaming Elite Aktif ✨
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {/* Elite Badge Preview for Streaming - Mobile Optimized */}
              <div className="mt-8 lg:mt-12">
                <BadgePreview subscriptionType="streaming" />
              </div>
              
              {/* Elite Features Showcase - Mobile Optimized */}
              <Card className="mt-8 lg:mt-12 border-0 bg-gradient-to-br from-purple-600/10 via-pink-600/10 to-indigo-600/10 backdrop-blur-sm">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-center text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    ✨ Elite Features ✨
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="grid gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3 text-center">
                    <div className="group space-y-3 sm:space-y-4 p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-white/50 backdrop-blur-sm hover:bg-white/80 transition-all duration-500 hover:scale-105 hover:shadow-xl">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto shadow-lg group-hover:shadow-yellow-500/25 transition-shadow duration-500">
                        <Zap className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
                      </div>
                      <h4 className="font-bold text-base sm:text-lg lg:text-xl text-gray-800">Zero Ads</h4>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        Streaming tanpa gangguan iklan apapun untuk pengalaman menonton yang maksimal
                      </p>
                    </div>
                    
                    <div className="group space-y-3 sm:space-y-4 p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-white/50 backdrop-blur-sm hover:bg-white/80 transition-all duration-500 hover:scale-105 hover:shadow-xl">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto shadow-lg group-hover:shadow-purple-500/25 transition-shadow duration-500">
                        <Star className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
                      </div>
                      <h4 className="font-bold text-base sm:text-lg lg:text-xl text-gray-800">HD Quality</h4>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        Kualitas video HD premium dengan loading super cepat untuk kepuasan maksimal
                      </p>
                    </div>
                    
                    <div className="group space-y-3 sm:space-y-4 p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-white/50 backdrop-blur-sm hover:bg-white/80 transition-all duration-500 hover:scale-105 hover:shadow-xl sm:col-span-2 lg:col-span-1">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-r from-green-400 to-teal-500 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto shadow-lg group-hover:shadow-teal-500/25 transition-shadow duration-500">
                        <Crown className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
                      </div>
                      <h4 className="font-bold text-base sm:text-lg lg:text-xl text-gray-800">Elite Status</h4>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        Badge premium eksklusif yang menunjukkan status elite Anda di komunitas
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Telegram Elite Tab Content */}
            <TabsContent value="telegram" className="animate-fade-in">
              <div className="text-center mb-8 lg:mb-12">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
                  🚀 Telegram Elite 🚀
                </h2>
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed px-4">
                  Bergabung dengan komunitas eksklusif dan dapatkan akses selamanya
                </p>
              </div>
              
              {/* Mobile-optimized Telegram Elite card */}
              <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white shadow-2xl shadow-blue-500/25">
                {/* Elite background effects - Mobile responsive */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-400/20"></div>
                <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 bg-gradient-to-bl from-white/10 to-transparent rounded-bl-full"></div>
                <div className="absolute bottom-0 left-0 w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 bg-gradient-to-tr from-white/5 to-transparent rounded-tr-full"></div>
                
                {/* Lifetime Badge - Mobile responsive */}
                <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10">
                  <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-black font-bold px-2 py-1 sm:px-3 sm:py-1 lg:px-4 lg:py-2 shadow-lg text-xs sm:text-sm">
                    <Crown className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">LIFETIME ACCESS</span>
                    <span className="sm:hidden">LIFETIME</span>
                  </Badge>
                </div>
                
                <CardHeader className="relative p-4 sm:p-6 lg:p-8 pb-6 sm:pb-8 pt-8 sm:pt-10 lg:pt-12">
                  <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
                    <div className="p-3 sm:p-4 bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg">
                      <Users className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 text-white" />
                    </div>
                    <div className="text-center sm:text-left">
                      <CardTitle className="text-2xl sm:text-2xl lg:text-3xl font-bold text-white">{telegramPlan.name}</CardTitle>
                      <CardDescription className="text-blue-100 text-sm sm:text-base lg:text-lg">
                        Komunitas eksklusif elite members selamanya
                      </CardDescription>
                    </div>
                  </div>
                  
                  <div className="text-center py-6 sm:py-8 space-y-2">
                    <div className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-3 sm:mb-4">
                      Rp {telegramPlan.price.toLocaleString('id-ID')}
                    </div>
                    <div className="text-lg sm:text-xl text-blue-100 font-semibold">{telegramPlan.duration}</div>
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1 sm:px-4 sm:py-2 rounded-full">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-xs sm:text-sm">One-time payment • No recurring fees</span>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="relative p-4 sm:p-6 lg:p-8">
                  <div className="space-y-4 sm:space-y-6 mb-8 sm:mb-10">
                    {telegramPlan.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl hover:bg-white/20 transition-all duration-300">
                        <div className="p-1.5 sm:p-2 bg-green-500 rounded-md sm:rounded-lg shadow-lg flex-shrink-0">
                          <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                        </div>
                        <span className="text-white font-medium leading-relaxed text-sm sm:text-base">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  {!hasTelegram ? (
                    telegramLinked ? (
                      <div className="space-y-4 sm:space-y-6">
                        <div className="text-center space-y-2 mb-4 sm:mb-6">
                          <div className="inline-flex items-center gap-2 bg-green-500/20 backdrop-blur-sm px-3 py-1 sm:px-4 sm:py-2 rounded-full border border-green-400/30">
                            <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                            <span className="text-green-300 font-medium text-xs sm:text-sm">Telegram Berhasil Terhubung</span>
                          </div>
                          <div className="text-white/90 text-base sm:text-lg font-semibold">
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
                      <div className="space-y-4 sm:space-y-6">
                        {/* Step-by-step verification header - Mobile optimized */}
                        <div className="text-center space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                          <div className="inline-flex items-center gap-2 bg-amber-500/20 backdrop-blur-sm px-4 py-2 sm:px-6 sm:py-3 rounded-full border border-amber-400/30">
                            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" />
                            <span className="text-amber-200 font-bold text-sm sm:text-base lg:text-lg">STEP 1: Verifikasi Telegram</span>
                          </div>
                          <p className="text-white/80 text-xs sm:text-sm max-w-md mx-auto leading-relaxed px-4">
                            Untuk keamanan dan akses eksklusif, Anda perlu menghubungkan akun Telegram terlebih dahulu
                          </p>
                        </div>

                        {/* Enhanced verification process - Mobile optimized */}
                        <div className="relative">
                          {/* Glowing border effect - Responsive */}
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-2xl sm:rounded-3xl blur-sm"></div>
                          <div className="relative bg-white/15 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-white/20">
                            <TelegramLinkForm onSuccess={handleTelegramSuccess} />
                          </div>
                        </div>

                        {/* Next step preview - Mobile optimized */}
                        <div className="text-center space-y-2 sm:space-y-3 mt-6 sm:mt-8 p-4 sm:p-6 bg-white/5 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-white/10">
                          <div className="inline-flex items-center gap-2 text-white/60">
                            <div className="w-5 h-5 sm:w-6 sm:h-6 bg-white/10 rounded-full flex items-center justify-center text-xs font-bold">2</div>
                            <span className="text-xs sm:text-sm font-medium">Selanjutnya: Pembayaran Elite</span>
                          </div>
                          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-xs text-white/50">
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
                      <Check className="h-5 w-5 sm:h-6 sm:w-6 text-green-400" />
                      <AlertDescription className="text-white font-bold text-base sm:text-lg">
                        ✨ Telegram Elite sudah aktif! Selamat menjadi member elite! ✨
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
              
              {/* Elite Badge Preview for Telegram - Mobile Optimized */}
              <div className="mt-8 lg:mt-12">
                <BadgePreview subscriptionType="telegram" />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Elite Premium Request Status - Mobile Optimized */}
        <div className="mt-12 lg:mt-16">
          <Card className="border-0 bg-gradient-to-r from-slate-100/50 to-gray-100/50 backdrop-blur-sm">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-center text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">
                📋 Status Permintaan Premium
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <PremiumRequestStatus />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Premium;