-- Phase 1: Update existing thumbnail URLs from postercdn.com to correct Doodstream format
UPDATE videos 
SET thumbnail_url = CASE 
  WHEN thumbnail_url LIKE '%postercdn.com/snaps/%' THEN 
    REPLACE(thumbnail_url, 'https://postercdn.com/snaps/', 'https://img.doodcdn.io/snaps/')
  WHEN thumbnail_url LIKE '%postercdn.com/splash/%' THEN 
    REPLACE(thumbnail_url, 'https://postercdn.com/splash/', 'https://img.doodcdn.io/splash/')
  ELSE thumbnail_url 
END
WHERE thumbnail_url LIKE '%postercdn.com%';