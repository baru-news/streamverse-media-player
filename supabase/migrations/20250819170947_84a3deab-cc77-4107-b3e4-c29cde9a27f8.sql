-- Create website_settings table for admin panel
CREATE TABLE public.website_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT,
  setting_type TEXT NOT NULL DEFAULT 'text',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.website_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for website_settings (only admins can manage)
CREATE POLICY "Admins can manage website settings"
ON public.website_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create policy for public reading of certain settings
CREATE POLICY "Public can view public website settings"
ON public.website_settings
FOR SELECT
USING (setting_key IN ('site_title', 'site_description', 'site_logo_url', 'favicon_url'));

-- Insert default website settings
INSERT INTO public.website_settings (setting_key, setting_value, setting_type) VALUES
('site_title', 'DINO18 - Platform Streaming Video', 'text'),
('site_description', 'Platform streaming video terdepan dengan koleksi konten dari Doodstream', 'text'),
('site_logo_url', '', 'url'),
('favicon_url', '', 'url'),
('hero_title', 'Selamat Datang di DINO18', 'text'),
('hero_description', 'Platform streaming terbaik untuk menonton video berkualitas tinggi dari Doodstream. Masuk atau daftar untuk mengakses koleksi video eksklusif kami dan nikmati pengalaman streaming yang luar biasa.', 'text');

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_website_settings_updated_at
BEFORE UPDATE ON public.website_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();