-- Create the proper banners bucket (ID and name both 'banners')
INSERT INTO storage.buckets (id, name, public) 
VALUES ('banners', 'banners', true);

-- Copy any existing files from 'ads' bucket to 'banners' bucket if they exist
-- (This is safe to run even if no files exist)
INSERT INTO storage.objects (
  bucket_id, 
  name, 
  owner,
  created_at,
  updated_at,
  last_accessed_at,
  metadata
)
SELECT 
  'banners' as bucket_id,
  name,
  owner, 
  created_at,
  updated_at,
  last_accessed_at,
  metadata
FROM storage.objects 
WHERE bucket_id = 'ads'
ON CONFLICT (bucket_id, name) DO NOTHING;