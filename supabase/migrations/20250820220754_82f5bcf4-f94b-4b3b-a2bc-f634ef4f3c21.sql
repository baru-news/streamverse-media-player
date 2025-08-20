-- Update all existing videos to use correct thumbnail format
UPDATE public.videos 
SET thumbnail_url = 'https://img.doodcdn.io/snaps/' || file_code || '.jpg'
WHERE thumbnail_url IS NULL 
   OR thumbnail_url LIKE '%postercdn.com%' 
   OR thumbnail_url LIKE '%img.doodcdn.co%';