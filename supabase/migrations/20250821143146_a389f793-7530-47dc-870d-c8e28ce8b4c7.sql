-- Fix all remaining LuluStream thumbnail URLs to DoodStream format
UPDATE videos 
SET thumbnail_url = 'https://img.doodcdn.io/thumbnails/' || file_code || '.jpg'
WHERE thumbnail_url LIKE '%lulustream.com%';

-- Verify the update
SELECT COUNT(*) as lulustream_count FROM videos WHERE thumbnail_url LIKE '%lulustream%';