-- Fix thumbnail URLs by replacing postercdn.com with doodcdn.io
UPDATE videos 
SET thumbnail_url = REPLACE(thumbnail_url, 'https://postercdn.com/', 'https://img.doodcdn.io/')
WHERE thumbnail_url LIKE '%postercdn.com%';

-- Also fix any http postercdn URLs to use the correct https doodcdn URLs  
UPDATE videos 
SET thumbnail_url = REPLACE(thumbnail_url, 'http://postercdn.com/', 'https://img.doodcdn.io/')
WHERE thumbnail_url LIKE '%http://postercdn.com%';