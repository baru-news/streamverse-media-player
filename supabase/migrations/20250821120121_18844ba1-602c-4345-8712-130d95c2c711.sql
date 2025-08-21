-- Create RLS policies for banners bucket (bucket already exists)
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public Access for banners" ON storage.objects;
DROP POLICY IF EXISTS "Admin can upload banners" ON storage.objects;
DROP POLICY IF EXISTS "Admin can update banners" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete banners" ON storage.objects;

-- Create new policies for banners bucket
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