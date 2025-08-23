import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, MessageCircle } from "lucide-react";

interface TelegramLinkFormProps {
  onSuccess: (telegramUsername: string) => void;
  telegramUsername?: string;
}

export const TelegramLinkForm = ({ onSuccess, telegramUsername }: TelegramLinkFormProps) => {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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
            <h4 className="font-medium mb-2">Cara menghubungkan:</h4>
            <ol className="text-sm text-muted-foreground space-y-1">
              <li>1. Mulai chat dengan bot Telegram kami</li>
              <li>2. Kirim perintah: <code className="bg-background px-1 rounded">/link</code></li>
              <li>3. Salin kode 6 digit yang Anda terima</li>
              <li>4. Masukkan kode di bawah ini</li>
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