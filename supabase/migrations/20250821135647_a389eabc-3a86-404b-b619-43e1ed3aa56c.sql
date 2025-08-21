-- Update all existing video thumbnails to LuluStream format
UPDATE videos 
SET thumbnail_url = 'https://lulustream.com/thumbs/' || file_code || '.jpg'
WHERE thumbnail_url IS NOT NULL;