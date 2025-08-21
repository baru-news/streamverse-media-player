-- Add provider support to videos table (alternative approach)
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS provider text;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS provider_data jsonb DEFAULT '{}';

-- Update existing videos to have doodstream provider
UPDATE public.videos SET provider = 'doodstream' WHERE provider IS NULL;

-- Create enum for video providers
DO $$ BEGIN
    CREATE TYPE video_provider AS ENUM ('doodstream', 'lulustream');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Now alter the column to use the enum and set default
ALTER TABLE public.videos ALTER COLUMN provider TYPE video_provider USING provider::video_provider;
ALTER TABLE public.videos ALTER COLUMN provider SET DEFAULT 'doodstream'::video_provider;
ALTER TABLE public.videos ALTER COLUMN provider SET NOT NULL;

-- Create unique constraint for file_code per provider
DROP INDEX IF EXISTS videos_file_code_unique;
CREATE UNIQUE INDEX videos_file_code_provider_unique ON public.videos(file_code, provider);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_videos_provider ON public.videos(provider);
CREATE INDEX IF NOT EXISTS idx_videos_provider_status ON public.videos(provider, status);