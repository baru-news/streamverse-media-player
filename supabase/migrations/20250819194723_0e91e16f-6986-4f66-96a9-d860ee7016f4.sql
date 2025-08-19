-- Add new columns to videos table for enhanced functionality
ALTER TABLE videos ADD COLUMN IF NOT EXISTS original_title text;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS title_edited boolean DEFAULT false;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS description_edited boolean DEFAULT false;

-- Create index for better search performance
CREATE INDEX IF NOT EXISTS idx_videos_slug ON videos(slug);
CREATE INDEX IF NOT EXISTS idx_videos_title_search ON videos USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_videos_description_search ON videos USING gin(to_tsvector('english', description));