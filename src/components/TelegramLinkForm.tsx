import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";
import { Loader2, MessageCircle, ExternalLink } from "lucide-react";

interface TelegramLinkFormProps {
  onSuccess: (telegramUsername: string) => void;
  telegramUsername?: string;
}

export const TelegramLinkForm = ({ onSuccess, telegramUsername }: TelegramLinkFormProps) => {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { settings } = useWebsiteSettings();

  const telegramBotUsername = settings.telegram_bot_username || "your_bot_name";

  const openTelegramChat = () => {
    const command = "/link";
    const botUsername = telegramBotUsername.startsWith('@') ? telegramBotUsername.slice(1) : telegramBotUsername;
    
    // Try to open in Telegram app first
    const telegramAppUrl = `tg://resolve?domain=${botUsername}&text=${encodeURIComponent(command)}`;
    
    // Fallback to web Telegram
    const telegramWebUrl = `https://t.me/${botUsername}?text=${encodeURIComponent(command)}`;
    
    // For mobile devices, try app first then fallback to web
    if (navigator.userAgent.match(/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/)) {
      // Try to open in app
      const appLink = document.createElement('a');
      appLink.href = telegramAppUrl;
      appLink.click();
      
      // Fallback to web after a short delay
      setTimeout(() => {
        window.open(telegramWebUrl, '_blank', 'noopener,noreferrer');
      }, 1000);
    } else {
      // Desktop: open web version directly
      window.open(telegramWebUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code.trim()) {
      toast({
        title: "Error",
        description: "Silakan masukkan kode verifikasi dari Telegram",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('verify-telegram-link', {
        body: { code: code.trim().toUpperCase() }
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        toast({
          title: "Berhasil!",
          description: data.message,
        });
        onSuccess(data.telegram_username);
        setCode("");
      } else {
        toast({
          title: "Error",
          description: data?.error || "Gagal memverifikasi kode",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error verifying Telegram link:', error);
      toast({
        title: "Error",
        description: "Gagal memverifikasi kode. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (telegramUsername) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Akun Telegram
          </CardTitle>
          <CardDescription>
            Akun Telegram Anda telah terhubung
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">@{telegramUsername}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Hubungkan Akun Telegram
        </CardTitle>
        <CardDescription>
          Hubungkan akun Telegram Anda untuk mendapat akses grup premium
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Cara menghubungkan:</h4>
              <Button 
                onClick={openTelegramChat}
                size="sm" 
                variant="outline"
                className="gap-2 text-xs sm:text-sm"
              >
                <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Buka Chat Bot</span>
                <span className="xs:hidden">Chat Bot</span>
              </Button>
            </div>
            <ol className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <span className="font-medium text-foreground min-w-[20px]">1.</span>
                <div>
                  <span>Klik tombol "Buka Chat Bot" di atas, atau mulai chat manual dengan bot Telegram kami</span>
                  {telegramBotUsername !== "your_bot_name" && (
                    <div className="mt-1 text-xs bg-background px-2 py-1 rounded border">
                      @{telegramBotUsername}
                    </div>
                  )}
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium text-foreground min-w-[20px]">2.</span>
                <span>Kirim perintah: <code className="bg-background px-2 py-1 rounded font-mono text-xs">/link</code></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium text-foreground min-w-[20px]">3.</span>
                <span>Salin kode 6 digit yang Anda terima dari bot</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium text-foreground min-w-[20px]">4.</span>
                <span>Masukkan kode tersebut di kolom di bawah ini</span>
              </li>
            </ol>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                placeholder="Masukkan kode 6 digit (contoh: ABC123)"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="text-center tracking-wider font-mono"
              />
            </div>
            
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verifikasi & Hubungkan Akun
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
};