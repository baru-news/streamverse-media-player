-- Clear stuck uploads and mark them as failed
UPDATE videos 
SET status = 'failed', 
    updated_at = now()
WHERE status = 'processing' 
  AND created_at < (now() - INTERVAL '1 hour');

-- Update telegram uploads that are stuck in pending status
UPDATE telegram_uploads 
SET upload_status = 'failed',
    error_message = 'Upload timeout - marked as failed during cleanup',
    updated_at = now()
WHERE upload_status = 'pending' 
  AND created_at < (now() - INTERVAL '1 hour');