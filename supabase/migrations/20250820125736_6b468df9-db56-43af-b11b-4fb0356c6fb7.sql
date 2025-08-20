-- Create storage bucket untuk badge images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('badge-images', 'badge-images', true);

-- Create RLS policies untuk badge images
CREATE POLICY "Anyone can view badge images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'badge-images');

CREATE POLICY "Admins can upload badge images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'badge-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update badge images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'badge-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete badge images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'badge-images' AND has_role(auth.uid(), 'admin'::app_role));

-- Add image_url column to badge_store table
ALTER TABLE badge_store ADD COLUMN image_url TEXT;