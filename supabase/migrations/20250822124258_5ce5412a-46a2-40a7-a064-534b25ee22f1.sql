-- Fix any potential database issues with videos table
-- Ensure proper indexing for better performance

-- Add index on file_code for faster lookups
CREATE INDEX IF NOT EXISTS idx_videos_file_code ON public.videos(file_code);

-- Add index on provider for filtering
CREATE INDEX IF NOT EXISTS idx_videos_provider ON public.videos(provider);

-- Add index on status for filtering
CREATE INDEX IF NOT EXISTS idx_videos_status ON public.videos(status);

-- Add index on upload_date for sorting
CREATE INDEX IF NOT EXISTS idx_videos_upload_date ON public.videos(upload_date DESC);

-- Ensure RLS is properly enabled
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- Fix any constraint issues
ALTER TABLE public.videos 
ALTER COLUMN file_code SET NOT NULL;