-- Create table for temporary Telegram link codes
CREATE TABLE public.telegram_link_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  telegram_user_id BIGINT NOT NULL,
  telegram_username TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '10 minutes'),
  used_at TIMESTAMP WITH TIME ZONE NULL,
  user_id UUID NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.telegram_link_codes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view active codes for verification" 
ON public.telegram_link_codes 
FOR SELECT 
USING (expires_at > now() AND used_at IS NULL);

CREATE POLICY "System can insert codes" 
ON public.telegram_link_codes 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update codes" 
ON public.telegram_link_codes 
FOR UPDATE 
USING (true);

-- Create index for efficient lookups
CREATE INDEX idx_telegram_link_codes_code ON public.telegram_link_codes(code);
CREATE INDEX idx_telegram_link_codes_expires ON public.telegram_link_codes(expires_at);

-- Create function to verify and link Telegram account
CREATE OR REPLACE FUNCTION public.verify_telegram_link_code(
  link_code TEXT,
  user_id_param UUID
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  code_record RECORD;
BEGIN
  -- Find the active code
  SELECT * INTO code_record
  FROM public.telegram_link_codes
  WHERE code = link_code
    AND expires_at > now()
    AND used_at IS NULL;
  
  IF code_record IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired code');
  END IF;
  
  -- Mark code as used
  UPDATE public.telegram_link_codes
  SET used_at = now(), user_id = user_id_param
  WHERE id = code_record.id;
  
  -- Update user profile with Telegram info
  UPDATE public.profiles
  SET 
    telegram_user_id = code_record.telegram_user_id,
    telegram_username = code_record.telegram_username,
    updated_at = now()
  WHERE id = user_id_param;
  
  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Telegram account linked successfully',
    'telegram_username', code_record.telegram_username
  );
END;
$$;