import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";
import SEO from "@/components/SEO";
import { Skeleton } from "@/components/ui/skeleton";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signInWithGoogle, user } = useAuth();
  const { settings, isLoading } = useWebsiteSettings();

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await signIn(email, password);
    
    setLoading(false);
    
    if (!error) {
      // Navigation will be handled by auth state change
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    await signInWithGoogle();
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50/30 via-background to-pink-100/20 flex items-center justify-center px-4">
      <SEO 
        title="Masuk ke Akun DINO18"
        description="Masuk ke akun DINO18 Anda untuk mengakses ribuan video streaming berkualitas tinggi. Platform streaming video terbaik dengan konten dari Doodstream."
        keywords="login, masuk, akun dino18, streaming video, doodstream"
      />
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2">
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <Skeleton className="h-8 w-24" />
              </div>
            ) : settings.site_logo_url ? (
              <img 
                src={settings.site_logo_url} 
                alt="Logo" 
                className="h-12 w-auto"
              />
            ) : (
              <>
                <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-xl">D</span>
                </div>
                <span className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  {settings.site_title || 'DINO18'}
                </span>
              </>
            )}
          </Link>
        </div>

        <Card className="bg-pink-50/10 backdrop-blur-xl border-pink-200/30 shadow-xl shadow-pink-500/10">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold text-foreground">Masuk ke Akun Anda</CardTitle>
            <CardDescription className="text-muted-foreground">
              Masukkan email dan kata sandi untuk mengakses akun {settings.site_title || 'DINO18'} Anda
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Google Login Button */}
            <div className="space-y-4">
              <Button 
                type="button" 
                variant="outline" 
                className="w-full bg-white hover:bg-gray-50 text-gray-700 border-gray-300 shadow-sm" 
                size="lg" 
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {loading ? "Masuk..." : "Masuk dengan Google"}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-pink-50/10 px-2 text-muted-foreground">atau</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-pink-50/20 border-pink-200/50 focus:border-primary focus:bg-pink-50/30 transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">Kata Sandi</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan kata sandi"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-pink-50/20 border-pink-200/50 focus:border-primary focus:bg-pink-50/30 transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Forgot Password */}
              <div className="text-right">
                <Link 
                  to="/forgot-password" 
                  className="text-sm text-primary hover:text-primary-glow transition-colors"
                >
                  Lupa kata sandi?
                </Link>
              </div>

              {/* Submit Button */}
              <Button type="submit" variant="hero" className="w-full" size="lg" disabled={loading}>
                {loading ? "Masuk..." : "Masuk"}
              </Button>
            </form>

            {/* Register Link */}
            <div className="mt-6 text-center">
              <p className="text-muted-foreground">
                Belum punya akun?{" "}
                <Link 
                  to="/register" 
                  className="text-primary hover:text-primary-glow font-medium transition-colors"
                >
                  Daftar sekarang
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;