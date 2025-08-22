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
  const { signIn, user } = useAuth();
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
            <form onSubmit={handleSubmit} className="space-y-4">
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