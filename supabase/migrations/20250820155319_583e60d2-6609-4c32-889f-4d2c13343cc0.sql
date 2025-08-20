-- Create storage bucket for ads
INSERT INTO storage.buckets (id, name, public) VALUES ('ads', 'ads', true);

-- Create policies for ads uploads
CREATE POLICY "Admins can upload ads" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'ads' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update ads" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'ads' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete ads" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'ads' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can view ads" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'ads');