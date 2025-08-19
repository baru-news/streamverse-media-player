-- Allow public access to view videos (no authentication required)
DROP POLICY IF EXISTS "Only authenticated users can view videos" ON public.videos;

CREATE POLICY "Public can view videos" 
ON public.videos 
FOR SELECT 
USING (true);

-- Keep other policies restrictive (only admins can manage videos)
-- INSERT, UPDATE, DELETE still require admin role