-- Update thumbnail URLs to use DoodStream format
UPDATE videos 
SET thumbnail_url = 'https://img.doodcdn.io/thumbnails/' || file_code || '.jpg'
WHERE provider = 'doodstream' AND file_code IS NOT NULL;