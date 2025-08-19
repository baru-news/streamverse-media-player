-- Remove duplicate user role (keep only one role per user)
DELETE FROM public.user_roles 
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) as rn
    FROM public.user_roles
  ) t 
  WHERE t.rn > 1
);

-- Add unique constraint to prevent duplicate roles per user
ALTER TABLE public.user_roles 
ADD CONSTRAINT unique_user_role UNIQUE (user_id);

-- Update RLS policy for videos to ensure only authenticated users can view
DROP POLICY IF EXISTS "Authenticated users can view videos" ON public.videos;

CREATE POLICY "Only authenticated users can view videos" 
ON public.videos 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Ensure video deletion is properly handled (only admins can delete)
CREATE POLICY "Admins can delete videos"
ON public.videos 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));