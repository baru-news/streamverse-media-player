import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";
import { toast } from "sonner";
import SEO from "@/components/SEO";
import { Skeleton } from "@/components/ui/skeleton";

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const { signUp, user } = useAuth();
  const { settings, isLoading } = useWebsiteSettings();

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation checks
    if (!formData.username.trim()) {
      toast.error("Username harus diisi");
      return;
    }
    
    if (formData.username.length < 3) {
      toast.error("Username minimal 3 karakter");
      return;
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      toast.error("Username hanya boleh mengandung huruf, angka, dan underscore");
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("Kata sandi tidak cocok");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Kata sandi minimal 6 karakter");
      return;
    }

    setLoading(true);
    
    const { error } = await signUp(formData.email, formData.password, formData.username);
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50/30 via-background to-pink-100/20 flex items-center justify-center px-4 py-8">
      <SEO 
        title="Daftar Akun DINO18"
        description="Bergabung dengan DINO18 dan nikmati ribuan video streaming berkualitas tinggi secara gratis. Daftar sekarang untuk akses penuh ke platform streaming video terbaik."
        keywords="daftar, registrasi, akun baru, streaming video, doodstream, gratis, DINO18"
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
            <CardTitle className="text-2xl font-bold text-foreground">Bergabung dengan {settings.site_title || 'DINO18'}</CardTitle>
            <CardDescription className="text-muted-foreground">
              Buat akun baru dan mulai menikmati ribuan video berkualitas tinggi
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-foreground">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="Pilih username unik (minimal 3 karakter)"
                    value={formData.username}
                    onChange={handleChange}
                    className="pl-10 bg-pink-50/20 border-pink-200/50 focus:border-primary focus:bg-pink-50/30 transition-colors"
                    required
                    minLength={3}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Username hanya boleh mengandung huruf, angka, dan underscore
                </p>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="nama@email.com"
                    value={formData.email}
                    onChange={handleChange}
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
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Buat kata sandi yang kuat"
                    value={formData.password}
                    onChange={handleChange}
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
                <p className="text-xs text-muted-foreground">Minimal 6 karakter</p>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-foreground">Konfirmasi Kata Sandi</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Ulangi kata sandi"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="pl-10 pr-10 bg-pink-50/20 border-pink-200/50 focus:border-primary focus:bg-pink-50/30 transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button type="submit" variant="hero" className="w-full" size="lg" disabled={loading}>
                {loading ? "Mendaftar..." : "Daftar Sekarang"}
              </Button>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center">
              <p className="text-muted-foreground">
                Sudah punya akun?{" "}
                <Link 
                  to="/login" 
                  className="text-primary hover:text-primary-glow font-medium transition-colors"
                >
                  Masuk di sini
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;