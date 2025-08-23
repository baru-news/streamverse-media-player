import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePremiumSubscription } from '@/hooks/usePremiumSubscription';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Key, Users, Star } from 'lucide-react';
import SEO from '@/components/SEO';
import TrakteerPaymentForm from '@/components/TrakteerPaymentForm';
import PremiumRequestStatus from '@/components/PremiumRequestStatus';

const Premium = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subscription, loading, isPremium } = usePremiumSubscription();

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

  if (loading) {
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
      
      {/* Hero Section */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 px-4 py-2 rounded-full mb-6">
          <Crown className="w-4 h-4" />
          <span className="text-sm font-medium">Premium Membership</span>
        </div>
        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
          Unlock Exclusive Benefits
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
          Join our premium community and get access to exclusive content, enhanced rewards, and special privileges that last a lifetime.
        </p>
      </div>

      {/* Benefits Section */}
      <div className="max-w-6xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-center mb-12">Premium Benefits</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-center mb-4 text-primary">
                  {benefit.icon}
                </div>
                <CardTitle className="text-xl">{benefit.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {benefit.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Trakteer Payment Section */}
      <div className="max-w-4xl mx-auto mb-16 space-y-8">
        <TrakteerPaymentForm />
        <PremiumRequestStatus />
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What do I get with Premium membership?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Premium members get exclusive access to our Telegram channel with early content, 2x Kitty Key rewards on every daily claim, and a special Premium badge that displays alongside your regular badges.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Is the Premium membership a one-time payment?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Yes! Premium membership is a lifetime purchase. Once you upgrade, you'll have permanent access to all premium benefits including the 2x Kitty Key bonus and exclusive Telegram content.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How do I access the premium Telegram channel?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                After purchasing Premium membership, our Telegram bot will automatically invite you to the exclusive premium channel where you'll get early access to content before it's published on the main site.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Premium;