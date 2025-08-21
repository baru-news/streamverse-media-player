-- Ensure banners storage bucket exists and is properly configured
INSERT INTO storage.buckets (id, name, public) 
VALUES ('banners', 'banners', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for banners bucket
CREATE POLICY "Public Access for banners" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'banners');

CREATE POLICY "Admin can upload banners" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'banners' AND 
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Admin can update banners" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'banners' AND 
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Admin can delete banners" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'banners' AND 
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);