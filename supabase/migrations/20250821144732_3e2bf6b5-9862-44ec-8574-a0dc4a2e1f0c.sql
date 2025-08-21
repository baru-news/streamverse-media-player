-- Fix problematic thumbnail URLs and ensure DoodStream format
UPDATE videos 
SET thumbnail_url = CASE 
  WHEN file_code IS NOT NULL AND file_code != '' 
  THEN 'https://img.doodcdn.io/thumbnails/' || file_code || '.jpg'
  ELSE NULL
END
WHERE thumbnail_url IS NULL 
  OR thumbnail_url NOT LIKE '%img.doodcdn.io%'
  OR thumbnail_url LIKE '%postercdn.com%';

-- Clean up any remaining invalid thumbnail URLs
UPDATE videos 
SET thumbnail_url = 'https://img.doodcdn.io/thumbnails/' || file_code || '.jpg'
WHERE file_code IS NOT NULL 
  AND file_code != '' 
  AND (thumbnail_url IS NULL OR thumbnail_url = '');