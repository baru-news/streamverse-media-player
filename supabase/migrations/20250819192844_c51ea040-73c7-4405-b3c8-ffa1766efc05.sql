-- Add flag to track manually edited titles
ALTER TABLE public.videos 
ADD COLUMN title_edited boolean DEFAULT false;

-- Add flag to track manually edited descriptions  
ALTER TABLE public.videos 
ADD COLUMN description_edited boolean DEFAULT false;

-- Update existing records to have the flag as false (already done by DEFAULT)
UPDATE public.videos SET 
  title_edited = false, 
  description_edited = false 
WHERE title_edited IS NULL OR description_edited IS NULL;