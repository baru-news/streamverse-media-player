-- Add provider support to videos table (fix enum casting issue)
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS provider text DEFAULT 'doodstream';
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS provider_data jsonb DEFAULT '{}';

-- Update existing videos to have doodstream provider
UPDATE public.videos SET provider = 'doodstream' WHERE provider IS NULL;

-- Create enum for video providers
CREATE TYPE video_provider AS ENUM ('doodstream', 'lulustream');

-- Update provider column to use enum (after setting default values)
ALTER TABLE public.videos ALTER COLUMN provider TYPE video_provider USING provider::video_provider;
ALTER TABLE public.videos ALTER COLUMN provider SET DEFAULT 'doodstream'::video_provider;

-- Create unique constraint for file_code per provider
DROP INDEX IF EXISTS videos_file_code_unique;
CREATE UNIQUE INDEX videos_file_code_provider_unique ON public.videos(file_code, provider);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_videos_provider ON public.videos(provider);
CREATE INDEX IF NOT EXISTS idx_videos_provider_status ON public.videos(provider, status);