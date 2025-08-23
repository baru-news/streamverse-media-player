import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";
import SEO from "@/components/SEO";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const UpdatePassword = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();
  const { settings, isLoading } = useWebsiteSettings();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setIsValidSession(true);
        } else {
          toast.error("Session tidak valid. Silakan coba reset password lagi.");
          navigate("/forgot-password");
        }
      } catch (error) {
        console.error("Error checking session:", error);
        toast.error("Terjadi kesalahan saat memeriksa session");
        navigate("/forgot-password");
      } finally {
        setChecking(false);
      }
    };

    checkSession();
  }, [navigate]);

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePassword(password)) {
      toast.error("Password minimal 6 karakter");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Konfirmasi password tidak cocok");
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Password berhasil diupdate!");
        
        // Redirect to login page after successful password update
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    } catch (error) {
      console.error("Update password error:", error);
      toast.error("Terjadi kesalahan saat mengupdate password");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50/30 via-background to-pink-100/20 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <Card className="bg-pink-50/10 backdrop-blur-xl border-pink-200/30 shadow-xl shadow-pink-500/10">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <Skeleton className="h-8 w-3/4 mx-auto" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3 mx-auto" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!isValidSession) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50/30 via-background to-pink-100/20 flex items-center justify-center px-4">
      <SEO 
        title="Update Password - DINO18"
        description="Update password akun DINO18 Anda dengan password baru yang aman."
        keywords="update password, ganti password, dino18, keamanan"
      />
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2">
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
          </div>
        </div>

        <Card className="bg-pink-50/10 backdrop-blur-xl border-pink-200/30 shadow-xl shadow-pink-500/10">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold text-foreground">Update Password</CardTitle>
            <CardDescription className="text-muted-foreground">
              Masukkan password baru untuk akun {settings.site_title || 'DINO18'} Anda
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">Password Baru</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan password baru"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-pink-50/20 border-pink-200/50 focus:border-primary focus:bg-pink-50/30 transition-colors"
                    required
                    minLength={6}
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
                <Label htmlFor="confirmPassword" className="text-foreground">Konfirmasi Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Konfirmasi password baru"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-destructive">Password tidak cocok</p>
                )}
                {confirmPassword && password === confirmPassword && (
                  <p className="text-xs text-primary flex items-center">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Password cocok
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                variant="hero" 
                className="w-full" 
                size="lg" 
                disabled={loading || !password || !confirmPassword || password !== confirmPassword}
              >
                {loading ? "Mengupdate..." : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UpdatePassword;