-- Rename the storage bucket from 'ads' to 'banners'
UPDATE storage.buckets SET name = 'banners' WHERE name = 'ads';

-- Update all existing URLs in the ads table to use the new 'banners' folder
UPDATE ads 
SET image_url = REPLACE(image_url, '/ads/', '/banners/')
WHERE image_url LIKE '%/ads/%';