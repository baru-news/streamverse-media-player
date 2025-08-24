-- Create premium_groups table for managing telegram groups with auto-upload
CREATE TABLE public.premium_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id BIGINT NOT NULL UNIQUE,
  chat_title TEXT,
  auto_upload_enabled BOOLEAN NOT NULL DEFAULT true,
  added_by_admin_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create telegram_uploads table for tracking upload history
CREATE TABLE public.telegram_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_file_id TEXT NOT NULL,
  telegram_file_unique_id TEXT NOT NULL UNIQUE,
  telegram_message_id BIGINT NOT NULL,
  telegram_chat_id BIGINT NOT NULL,
  telegram_user_id BIGINT NOT NULL,
  original_filename TEXT,
  file_size BIGINT,
  mime_type TEXT,
  video_id UUID REFERENCES public.videos(id),
  doodstream_file_code TEXT,
  upload_status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create admin_telegram_users table for admin verification
CREATE TABLE public.admin_telegram_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  telegram_user_id BIGINT NOT NULL UNIQUE,
  telegram_username TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.premium_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_telegram_users ENABLE ROW LEVEL SECURITY;

-- RLS policies for premium_groups
CREATE POLICY "Admins can manage premium groups" 
ON public.premium_groups 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can view active premium groups" 
ON public.premium_groups 
FOR SELECT 
USING (auto_upload_enabled = true);

-- RLS policies for telegram_uploads
CREATE POLICY "Admins can view all telegram uploads" 
ON public.telegram_uploads 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert telegram uploads" 
ON public.telegram_uploads 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update telegram uploads" 
ON public.telegram_uploads 
FOR UPDATE 
USING (true);

-- RLS policies for admin_telegram_users
CREATE POLICY "Admins can manage admin telegram users" 
ON public.admin_telegram_users 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for better performance
CREATE INDEX idx_premium_groups_chat_id ON public.premium_groups(chat_id);
CREATE INDEX idx_telegram_uploads_file_unique_id ON public.telegram_uploads(telegram_file_unique_id);
CREATE INDEX idx_telegram_uploads_status ON public.telegram_uploads(upload_status);
CREATE INDEX idx_telegram_uploads_chat_id ON public.telegram_uploads(telegram_chat_id);
CREATE INDEX idx_admin_telegram_users_telegram_id ON public.admin_telegram_users(telegram_user_id);

-- Create triggers for updated_at columns
CREATE TRIGGER update_premium_groups_updated_at
BEFORE UPDATE ON public.premium_groups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_telegram_uploads_updated_at
BEFORE UPDATE ON public.telegram_uploads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to check if user is admin via telegram
CREATE OR REPLACE FUNCTION public.is_telegram_admin(telegram_user_id_param BIGINT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.admin_telegram_users atu
    JOIN public.user_roles ur ON atu.user_id = ur.user_id
    WHERE atu.telegram_user_id = telegram_user_id_param 
    AND atu.is_active = true
    AND ur.role = 'admin'::app_role
  );
END;
$function$

-- Function to check if chat is premium group with auto-upload enabled
CREATE OR REPLACE FUNCTION public.is_premium_group_with_autoupload(chat_id_param BIGINT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.premium_groups 
    WHERE chat_id = chat_id_param 
    AND auto_upload_enabled = true
  );
END;
$function$