-- Create ads management table
CREATE TABLE public.ads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  link_url TEXT,
  position TEXT NOT NULL DEFAULT 'content', -- content, sidebar, banner
  size TEXT NOT NULL DEFAULT 'banner', -- banner, card, square
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ads settings table for global ad controls
CREATE TABLE public.ads_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL DEFAULT 'true',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default ads settings
INSERT INTO public.ads_settings (setting_key, setting_value) VALUES 
('ads_enabled', 'true'),
('show_ads_to_guests', 'true'),
('show_ads_to_users', 'true');

-- Enable RLS
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for ads
CREATE POLICY "Public can view active ads" 
ON public.ads 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage ads" 
ON public.ads 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create policies for ads settings
CREATE POLICY "Public can view ads settings" 
ON public.ads_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage ads settings" 
ON public.ads_settings 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_ads_updated_at
BEFORE UPDATE ON public.ads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ads_settings_updated_at
BEFORE UPDATE ON public.ads_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();