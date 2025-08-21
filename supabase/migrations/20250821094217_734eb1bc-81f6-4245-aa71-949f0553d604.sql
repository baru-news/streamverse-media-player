-- Fix remaining postercdn.com URLs and improve thumbnail logic
UPDATE videos 
SET thumbnail_url = CASE
  WHEN thumbnail_url LIKE '%postercdn.com/snaps/%' THEN 
    'https://img.doodcdn.io/snaps/' || file_code || '.jpg'
  WHEN thumbnail_url LIKE '%postercdn.com/thumbnails/%' THEN 
    'https://img.doodcdn.io/thumbnails/' || file_code || '.jpg' 
  WHEN thumbnail_url LIKE '%postercdn.com/splash/%' THEN 
    'https://img.doodcdn.io/splash/' || file_code || '.jpg'
  WHEN thumbnail_url IS NULL OR thumbnail_url = '' THEN
    'https://img.doodcdn.io/thumbnails/' || file_code || '.jpg'
  ELSE thumbnail_url
END
WHERE thumbnail_url LIKE '%postercdn.com%' OR thumbnail_url IS NULL OR thumbnail_url = '';

-- Also ensure all videos have proper file codes (just in case)
UPDATE videos 
SET thumbnail_url = 'https://img.doodcdn.io/thumbnails/' || file_code || '.jpg'
WHERE (thumbnail_url IS NULL OR thumbnail_url = '') AND file_code IS NOT NULL;