-- Update all postercdn.com thumbnail URLs to the correct doodcdn.io format
UPDATE videos 
SET thumbnail_url = 'https://img.doodcdn.io/thumbnails/' || file_code || '.jpg'
WHERE thumbnail_url LIKE '%postercdn.com%';

-- Also update any null or empty thumbnail URLs to use the standard format
UPDATE videos 
SET thumbnail_url = 'https://img.doodcdn.io/thumbnails/' || file_code || '.jpg'
WHERE (thumbnail_url IS NULL OR thumbnail_url = '') AND file_code IS NOT NULL;