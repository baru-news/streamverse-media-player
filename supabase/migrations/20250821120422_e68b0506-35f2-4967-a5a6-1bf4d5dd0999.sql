-- Drop the incorrect policies for 'banners' bucket and create correct ones for 'ads' bucket
DROP POLICY IF EXISTS "Public Access for banners" ON storage.objects;
DROP POLICY IF EXISTS "Admin can upload banners" ON storage.objects;
DROP POLICY IF EXISTS "Admin can update banners" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete banners" ON storage.objects;

-- Create correct policies for the existing 'ads' bucket
CREATE POLICY "Public Access for ads banners" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'ads');

CREATE POLICY "Admin can upload ads banners" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'ads' AND 
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Admin can update ads banners" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'ads' AND 
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Admin can delete ads banners" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'ads' AND 
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);