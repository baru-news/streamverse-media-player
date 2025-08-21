-- Modify videos table to support dual provider setup
-- Add columns for both provider file codes
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS doodstream_file_code text;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS lulustream_file_code text;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS primary_provider video_provider DEFAULT 'doodstream'::video_provider;

-- Migrate existing data
UPDATE public.videos SET 
  doodstream_file_code = CASE WHEN provider = 'doodstream' THEN file_code ELSE NULL END,
  lulustream_file_code = CASE WHEN provider = 'lulustream' THEN file_code ELSE NULL END,
  primary_provider = provider;

-- Drop old unique constraint and create new ones
DROP INDEX IF EXISTS videos_file_code_provider_unique;
CREATE UNIQUE INDEX videos_doodstream_file_code_unique ON public.videos(doodstream_file_code) WHERE doodstream_file_code IS NOT NULL;
CREATE UNIQUE INDEX videos_lulustream_file_code_unique ON public.videos(lulustream_file_code) WHERE lulustream_file_code IS NOT NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_videos_dual_providers ON public.videos(doodstream_file_code, lulustream_file_code);