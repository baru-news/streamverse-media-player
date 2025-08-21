import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Header from "@/components/Header";
import SEO from "@/components/SEO";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";

const contactSchema = z.object({
  name: z.string().min(2, "Nama harus minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  subject: z.string().min(5, "Subjek harus minimal 5 karakter"),
  message: z.string().min(10, "Pesan harus minimal 10 karakter"),
});

type ContactForm = z.infer<typeof contactSchema>;

const Contact = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { settings } = useWebsiteSettings();

  const form = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  const onSubmit = async (data: ContactForm) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('contact_messages' as any)
        .insert([
          {
            name: data.name,
            email: data.email,
            subject: data.subject,
            message: data.message,
          }
        ]);

      if (error) throw error;

      toast.success("Pesan berhasil dikirim! Kami akan menghubungi Anda segera.");
      form.reset();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error("Gagal mengirim pesan. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Kontak Kami"
        description="Hubungi kami untuk pertanyaan, saran, atau permintaan penghapusan konten. Tim support siap membantu Anda."
        keywords="kontak, support, bantuan, penghapusan video, DMCA"
      />
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">Kontak Kami</h1>
            <p className="text-muted-foreground">
              Jika Anda memiliki pertanyaan, saran, atau permintaan penghapusan konten, 
              silakan hubungi kami melalui form di bawah ini.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Kirim Pesan</CardTitle>
              <CardDescription>
                Kami akan merespons pesan Anda dalam 1-2 hari kerja.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Lengkap</FormLabel>
                        <FormControl>
                          <Input placeholder="Masukkan nama lengkap Anda" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="nama@email.com" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subjek</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Permintaan penghapusan video / Pertanyaan umum / dll" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pesan</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Jelaskan detail permintaan atau pertanyaan Anda. Untuk penghapusan video, mohon sertakan link video dan alasan penghapusan."
                            className="min-h-[120px] resize-none"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Mengirim..." : "Kirim Pesan"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <div className="mt-8 p-6 bg-muted/50 rounded-lg">
            <h3 className="font-semibold mb-2">Informasi Penting:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Untuk permintaan penghapusan video, sertakan link video dan alasan yang jelas</li>
              <li>• Kami menghormati hak cipta dan akan menindaklanjuti laporan DMCA</li>
              <li>• Respon akan dikirim ke email yang Anda berikan</li>
              <li>• Untuk pertanyaan teknis, sertakan detail browser dan perangkat yang digunakan</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Contact;