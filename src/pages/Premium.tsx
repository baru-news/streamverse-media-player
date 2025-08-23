import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePremiumSubscription } from '@/hooks/usePremiumSubscription';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Check, Crown, Key, Users, Star, MessageSquare, ArrowRight, CheckCircle, CreditCard } from 'lucide-react';
import SEO from '@/components/SEO';
import TrakteerPaymentForm from '@/components/TrakteerPaymentForm';
import PremiumRequestStatus from '@/components/PremiumRequestStatus';
import { TelegramLinkForm } from '@/components/TelegramLinkForm';
import { supabase } from '@/integrations/supabase/client';

const Premium = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subscription, loading, isPremium } = usePremiumSubscription();
  const [currentStep, setCurrentStep] = useState(1);
  const [telegramLinked, setTelegramLinked] = useState(false);
  const [telegramUsername, setTelegramUsername] = useState<string>('');
  const [profileLoading, setProfileLoading] = useState(true);

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

  const steps = [
    { number: 1, title: 'Link Telegram', description: 'Connect your Telegram account', completed: telegramLinked },
    { number: 2, title: 'Make Payment', description: 'Pay via Trakteer', completed: false },
    { number: 3, title: 'Submit Proof', description: 'Upload payment verification', completed: false }
  ];

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <SEO 
          title="Premium Subscription"
          description="Upgrade to Premium for exclusive benefits"
        />
        <h1 className="text-2xl font-bold mb-4">Premium Subscription</h1>
        <p className="text-muted-foreground mb-4">Please log in to view premium subscription options.</p>
        <Button onClick={() => navigate('/login')}>Log In</Button>
      </div>
    );
  }

  const benefits = [
    {
      icon: <Users className="w-6 h-6" />,
      title: "Exclusive Telegram Access",
      description: "Join our premium Telegram channel with exclusive content and early access to new videos"
    },
    {
      icon: <Key className="w-6 h-6" />,
      title: "Double Kitty Keys",
      description: "Earn 2x Kitty Keys for life on every daily claim - double your rewards forever!"
    },
    {
      icon: <Crown className="w-6 h-6" />,
      title: "Premium Badge",
      description: "Display your exclusive Premium Member badge alongside your regular badges"
    }
  ];

  const features = [
    "Exclusive premium Telegram channel access",
    "2x Kitty Key rewards on every daily claim",
    "Premium Member badge (permanent display)",
    "Priority support and feedback",
    "Early access to new features",
    "Lifetime benefits (never expires)"
  ];

  if (loading || profileLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <SEO 
          title="Premium Subscription"
          description="Upgrade to Premium for exclusive benefits"
        />
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (isPremium) {
    return (
      <div className="container mx-auto px-4 py-8">
        <SEO 
          title="Premium Subscription - Active"
          description="Your premium subscription is active"
        />
        
        <div className="text-center mb-12">
          <Badge variant="default" className="mb-4 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black">
            <Crown className="w-4 h-4 mr-1" />
            Premium Active
          </Badge>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
            Premium Member
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Thank you for being a premium member! You're enjoying all the exclusive benefits.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                Your Premium Benefits
              </CardTitle>
              <CardDescription>
                Active since: {new Date(subscription?.start_date || '').toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                {benefits.map((benefit, index) => (
                  <div key={index} className="text-center p-4 rounded-lg bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200">
                    <div className="flex justify-center mb-3 text-yellow-600">
                      {benefit.icon}
                    </div>
                    <h3 className="font-semibold mb-2">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
              <CardDescription>
                Having issues with your premium benefits? Contact our support team.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/contact')} variant="outline">
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <SEO 
        title="Premium Subscription"
        description="Upgrade to Premium for exclusive Telegram access, double Kitty Keys, and premium badge"
      />
      
      {/* Promotional Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 p-8 mb-12 animate-fade-in">
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
        <div className="relative z-10 text-center text-white">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
            <Star className="w-5 h-5 animate-pulse" />
            <span className="font-semibold">LIMITED TIME OFFER</span>
            <Star className="w-5 h-5 animate-pulse" />
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Premium Membership
          </h1>
          
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="text-center">
              <div className="text-3xl md:text-5xl font-bold">
                IDR 50,000
              </div>
              <div className="text-sm opacity-80">One-time payment</div>
            </div>
            <div className="w-px h-12 bg-white/30"></div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-yellow-300">
                LIFETIME
              </div>
              <div className="text-sm opacity-80">Access forever</div>
            </div>
          </div>
          
          <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto mb-8">
            🎉 Get exclusive Telegram access, 2x Kitty Keys, and premium badge - <strong>Forever!</strong>
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-full">
              <Users className="w-4 h-4" />
              <span>Exclusive Telegram Channel</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-full">
              <Key className="w-4 h-4" />
              <span>2x Kitty Keys Forever</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-full">
              <Crown className="w-4 h-4" />
              <span>Premium Badge</span>
            </div>
          </div>
        </div>
        
        {/* Animated Background Elements */}
        <div className="absolute top-4 left-4 w-12 h-12 bg-white/10 rounded-full animate-bounce delay-100"></div>
        <div className="absolute top-8 right-8 w-8 h-8 bg-yellow-300/20 rounded-full animate-bounce delay-300"></div>
        <div className="absolute bottom-4 left-1/4 w-6 h-6 bg-pink-300/20 rounded-full animate-bounce delay-500"></div>
        <div className="absolute bottom-8 right-1/3 w-10 h-10 bg-blue-300/10 rounded-full animate-bounce delay-700"></div>
      </div>

      {/* Hero Section */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-100 to-teal-200 text-emerald-800 px-6 py-3 rounded-full mb-6 shadow-lg">
          <Crown className="w-5 h-5" />
          <span className="font-semibold">Join 1000+ Premium Members</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
          Simple 3-Step Process
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Follow these easy steps to unlock your lifetime premium benefits
        </p>
      </div>

      {/* Benefits Section */}
      <div className="max-w-6xl mx-auto mb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            What You Get With Premium
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full mx-auto"></div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <Card 
              key={index} 
              className="group text-center hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <CardHeader className="relative z-10">
                <div className="flex justify-center mb-6">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    {benefit.icon}
                  </div>
                </div>
                <CardTitle className="text-xl font-bold group-hover:text-purple-600 transition-colors">
                  {benefit.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <CardDescription className="text-base leading-relaxed">
                  {benefit.description}
                </CardDescription>
              </CardContent>
              
              <div className="absolute -bottom-2 -right-2 w-24 h-24 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full opacity-20 group-hover:opacity-40 transition-opacity"></div>
            </Card>
          ))}
        </div>
        
        {/* Additional Benefits Grid */}
        <div className="mt-12 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-center mb-8">Plus Even More Benefits</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3 p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl hover:bg-white/80 dark:hover:bg-gray-700/80 transition-colors">
                <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex-shrink-0"></div>
                <span className="text-sm font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Premium Purchase Flow */}
      <div className="max-w-4xl mx-auto mb-16 space-y-8">
        {/* Progress Steps */}
        <Card className="overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-white via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-950 dark:to-purple-950">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardTitle className="text-2xl font-bold flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Crown className="w-6 h-6" />
              </div>
              Premium Upgrade Process
            </CardTitle>
            <CardDescription className="text-blue-100">
              Follow these simple steps to unlock your lifetime premium membership
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-8">
              {/* Enhanced Step Progress Bar */}
              <div className="space-y-6">
                {steps.map((step, index) => (
                  <div key={step.number} className="relative">
                    {/* Connection Line */}
                    {index < steps.length - 1 && (
                      <div className="absolute left-6 top-14 w-0.5 h-16 bg-gradient-to-b from-blue-200 to-purple-200 dark:from-blue-800 dark:to-purple-800"></div>
                    )}
                    
                    {/* Step Content */}
                    <div className="flex items-start gap-6">
                      {/* Step Circle */}
                      <div className={`relative flex items-center justify-center w-12 h-12 rounded-full border-3 transition-all duration-300 ${
                        step.completed 
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 border-green-500 text-white shadow-lg scale-110' :
                        currentStep === step.number 
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 border-blue-500 text-white shadow-lg animate-pulse' :
                          'border-gray-300 text-gray-400 bg-white dark:bg-gray-800'
                      }`}>
                        {step.completed ? (
                          <CheckCircle className="w-6 h-6" />
                        ) : (
                          <span className="text-lg font-bold">{step.number}</span>
                        )}
                        
                        {/* Glow Effect */}
                        {(step.completed || currentStep === step.number) && (
                          <div className="absolute inset-0 rounded-full bg-current opacity-20 animate-ping"></div>
                        )}
                      </div>
                      
                      {/* Step Info */}
                      <div className="flex-1 pt-1">
                        <div className={`text-lg font-bold mb-1 transition-colors ${
                          step.completed ? 'text-green-600' :
                          currentStep === step.number ? 'text-blue-600' :
                          'text-gray-500'
                        }`}>
                          {step.title}
                        </div>
                        <div className="text-muted-foreground mb-2">{step.description}</div>
                        
                        {/* Step Status Badge */}
                        <div className="flex items-center gap-2">
                          {step.completed ? (
                            <Badge className="bg-green-100 text-green-700 border-green-200">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Completed
                            </Badge>
                          ) : currentStep === step.number ? (
                            <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-2"></div>
                              Current Step
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-gray-500">
                              Pending
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Enhanced Step Content */}
              <div className="mt-8 p-6 bg-white/50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700">
                {currentStep === 1 && (
                  <div className="space-y-6 animate-fade-in">
                    <Alert className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                      <MessageSquare className="h-5 w-5 text-purple-600" />
                      <AlertDescription className="text-purple-800 dark:text-purple-200">
                        <strong>🔗 Step 1: Link Your Telegram</strong><br />
                        Connect your Telegram account to receive automatic premium group access after payment approval.
                      </AlertDescription>
                    </Alert>
                    <TelegramLinkForm 
                      onSuccess={handleTelegramSuccess}
                      telegramUsername={telegramLinked ? telegramUsername : undefined}
                    />
                  </div>
                )}

                {currentStep === 2 && telegramLinked && (
                  <div className="space-y-6 animate-fade-in">
                    <Alert className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <AlertDescription className="text-green-800 dark:text-green-200">
                        <strong>✅ Telegram Connected:</strong> @{telegramUsername}<br />
                        Your account is ready! Now proceed with the payment to unlock premium benefits.
                      </AlertDescription>
                    </Alert>
                    
                    {/* Price Highlight */}
                    <div className="bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/20 dark:to-orange-900/20 p-6 rounded-2xl border border-yellow-200 dark:border-yellow-800">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-yellow-700 dark:text-yellow-300 mb-2">
                          IDR 50,000
                        </div>
                        <div className="text-sm text-yellow-600 dark:text-yellow-400">
                          One-time payment • Lifetime access
                        </div>
                      </div>
                    </div>
                    
                    <TrakteerPaymentForm telegramUsername={telegramUsername} />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <PremiumRequestStatus />
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground">Everything you need to know about our premium membership</p>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mx-auto mt-4"></div>
        </div>
        <div className="space-y-4">
           <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
             <CardHeader>
               <CardTitle className="text-lg flex items-center gap-2 group-hover:text-blue-600 transition-colors">
                 <Crown className="w-5 h-5" />
                 What do I get with Premium membership?
               </CardTitle>
             </CardHeader>
             <CardContent>
               <p className="text-muted-foreground leading-relaxed">
                 Premium members get exclusive access to our Telegram channel with early content, <strong>2x Kitty Key rewards on every daily claim</strong>, and a special Premium badge that displays alongside your regular badges.
               </p>
             </CardContent>
           </Card>
           
           <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
             <CardHeader>
               <CardTitle className="text-lg flex items-center gap-2 group-hover:text-emerald-600 transition-colors">
                 <CreditCard className="w-5 h-5" />
                 Is the Premium membership a one-time payment?
               </CardTitle>
             </CardHeader>
             <CardContent>
               <p className="text-muted-foreground leading-relaxed">
                 Yes! Premium membership is a <strong>lifetime purchase for only IDR 50,000</strong>. Once you upgrade, you'll have permanent access to all premium benefits including the 2x Kitty Key bonus and exclusive Telegram content.
               </p>
             </CardContent>
           </Card>
           
           <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
             <CardHeader>
               <CardTitle className="text-lg flex items-center gap-2 group-hover:text-purple-600 transition-colors">
                 <MessageSquare className="w-5 h-5" />
                 How do I access the premium Telegram channel?
               </CardTitle>
             </CardHeader>
             <CardContent>
               <p className="text-muted-foreground leading-relaxed">
                 You must first link your Telegram account using our verification system, then purchase Premium membership through Trakteer. Our team will <strong>automatically invite</strong> your verified Telegram account to the exclusive premium channel within 24 hours of payment approval.
               </p>
             </CardContent>
           </Card>
           
           <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20">
             <CardHeader>
               <CardTitle className="text-lg flex items-center gap-2 group-hover:text-orange-600 transition-colors">
                 <CheckCircle className="w-5 h-5" />
                 What's the payment verification process?
               </CardTitle>
             </CardHeader>
             <CardContent>
               <p className="text-muted-foreground leading-relaxed">
                 <strong>Simple 3 steps:</strong> First link your Telegram account, then make payment via Trakteer, and finally submit your transaction ID and payment proof. Our team verifies each payment within 24 hours and automatically invites your linked Telegram account to the premium channel.
               </p>
             </CardContent>
           </Card>
           
           <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20">
             <CardHeader>
               <CardTitle className="text-lg flex items-center gap-2 group-hover:text-yellow-600 transition-colors">
                 <Star className="w-5 h-5" />
                 Why do I need to link my Telegram account first?
               </CardTitle>
             </CardHeader>
             <CardContent>
               <p className="text-muted-foreground leading-relaxed">
                 Linking your Telegram account ensures <strong>secure access</strong> to the premium channel. It prevents unauthorized users from accessing premium content and allows us to automatically invite only verified premium members.
               </p>
             </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
};

export default Premium;