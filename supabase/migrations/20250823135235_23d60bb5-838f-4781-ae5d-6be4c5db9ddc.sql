-- Create upload logs table for security monitoring
CREATE TABLE public.upload_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  filename TEXT NOT NULL,
  success BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  upload_type TEXT NOT NULL DEFAULT 'avatar',
  file_size INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.upload_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for upload_logs
CREATE POLICY "Users can insert their own upload logs" 
ON public.upload_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all upload logs" 
ON public.upload_logs 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own upload logs" 
ON public.upload_logs 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create index for performance on user_id and created_at
CREATE INDEX idx_upload_logs_user_created ON public.upload_logs(user_id, created_at DESC);
CREATE INDEX idx_upload_logs_upload_type ON public.upload_logs(upload_type, created_at DESC);

-- Update storage bucket policies for enhanced security
-- Create policy for avatar uploads that only allows images
CREATE POLICY "Enhanced avatar upload policy" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1] AND
  -- Only allow image files
  (
    LOWER(RIGHT(name, 4)) = '.jpg' OR 
    LOWER(RIGHT(name, 5)) = '.jpeg' OR 
    LOWER(RIGHT(name, 4)) = '.png' OR 
    LOWER(RIGHT(name, 5)) = '.webp'
  )
);

-- Update existing policies to be more restrictive
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;

-- Policy for viewing avatars (public access)
CREATE POLICY "Public avatar access" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars');

-- Policy for deleting own avatars
CREATE POLICY "Users can delete their own avatars" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create function to clean up old avatars (called by edge function)
CREATE OR REPLACE FUNCTION public.cleanup_old_avatar(user_id_param UUID, new_avatar_path TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    old_avatar_url TEXT;
    old_path TEXT;
BEGIN
    -- Get current avatar URL
    SELECT avatar_url INTO old_avatar_url
    FROM public.profiles
    WHERE id = user_id_param;
    
    -- Extract path from old avatar URL if it exists
    IF old_avatar_url IS NOT NULL AND old_avatar_url != '' THEN
        old_path := split_part(old_avatar_url, '/avatars/', 2);
        
        -- Only delete if it's in the user's folder and not the new file
        IF old_path != new_avatar_path AND old_path LIKE user_id_param || '%' THEN
            -- Note: This function logs the cleanup but actual deletion 
            -- should be done by the edge function with proper permissions
            INSERT INTO public.upload_logs (user_id, filename, success, upload_type, error_message)
            VALUES (user_id_param, old_path, true, 'avatar_cleanup', 'Old avatar marked for cleanup');
        END IF;
    END IF;
END;
$$;