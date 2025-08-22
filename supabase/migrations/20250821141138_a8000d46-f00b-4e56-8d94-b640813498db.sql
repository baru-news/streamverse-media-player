-- Remove all LuluStream integrations and fix DoodStream thumbnails

-- Delete all LuluStream videos from database
DELETE FROM videos WHERE provider = 'lulustream';

-- Drop the lulustream_file_code column
ALTER TABLE videos DROP COLUMN IF EXISTS lulustream_file_code;

-- Update video_provider enum to only allow doodstream
ALTER TYPE video_provider RENAME TO video_provider_old;
CREATE TYPE video_provider AS ENUM ('doodstream');

-- Update existing videos to use new enum
ALTER TABLE videos 
ALTER COLUMN provider TYPE video_provider USING provider::text::video_provider,
ALTER COLUMN primary_provider TYPE video_provider USING primary_provider::text::video_provider;

-- Drop old enum
DROP TYPE video_provider_old;

-- Update all existing thumbnails to use DoodStream format
UPDATE videos 
SET thumbnail_url = CASE 
  WHEN thumbnail_url LIKE '%postercdn.com%' THEN thumbnail_url
  ELSE 'https://img.doodcdn.io/thumbnails/' || file_code || '.jpg'
END
WHERE provider = 'doodstream';