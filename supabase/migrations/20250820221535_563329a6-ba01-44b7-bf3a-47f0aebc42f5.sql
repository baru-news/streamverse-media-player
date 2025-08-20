-- Update all existing videos to use correct thumbnail format with /thumbnails/ path
UPDATE public.videos 
SET thumbnail_url = 'https://img.doodcdn.io/thumbnails/' || file_code || '.jpg'
WHERE thumbnail_url IS NULL 
   OR thumbnail_url LIKE '%postercdn.com%' 
   OR thumbnail_url LIKE '%img.doodcdn.co%'
   OR thumbnail_url LIKE '%/snaps/%';