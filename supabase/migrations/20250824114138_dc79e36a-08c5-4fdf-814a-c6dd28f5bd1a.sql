-- Update videos table for dual upload system
ALTER TABLE public.videos 
ADD COLUMN IF NOT EXISTS premium_file_code TEXT,
ADD COLUMN IF NOT EXISTS regular_file_code TEXT,
ADD COLUMN IF NOT EXISTS upload_status JSONB DEFAULT '{"regular": "pending", "premium": "pending"}'::jsonb,
ADD COLUMN IF NOT EXISTS failed_uploads JSONB DEFAULT '{}'::jsonb;

-- Update existing videos to use file_code as regular_file_code
UPDATE public.videos 
SET regular_file_code = file_code 
WHERE regular_file_code IS NULL AND file_code IS NOT NULL;

-- Create upload_failures table for retry management
CREATE TABLE IF NOT EXISTS public.upload_failures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE,
  upload_type TEXT NOT NULL CHECK (upload_type IN ('regular', 'premium')),
  attempt_count INTEGER NOT NULL DEFAULT 1,
  error_details JSONB NOT NULL,
  requires_manual_upload BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for upload_failures
ALTER TABLE public.upload_failures ENABLE ROW LEVEL SECURITY;

-- Create policies for upload_failures
CREATE POLICY "Admins can manage upload failures" ON public.upload_failures
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Update premium_subscriptions table for multiple subscription types
ALTER TABLE public.premium_subscriptions 
ADD COLUMN IF NOT EXISTS plan_price NUMERIC,
ADD COLUMN IF NOT EXISTS grace_period_end TIMESTAMP WITH TIME ZONE;

-- Update subscription_type enum to include new types
ALTER TYPE public.app_subscription_type RENAME TO app_subscription_type_old;

CREATE TYPE public.app_subscription_type AS ENUM (
  'telegram_lifetime',
  'streaming_1month', 
  'streaming_3month',
  'streaming_6month', 
  'streaming_1year'
);

-- Update the column type
ALTER TABLE public.premium_subscriptions 
ALTER COLUMN subscription_type DROP DEFAULT,
ALTER COLUMN subscription_type TYPE app_subscription_type USING subscription_type::text::app_subscription_type,
ALTER COLUMN subscription_type SET DEFAULT 'telegram_lifetime'::app_subscription_type;

-- Drop old enum
DROP TYPE public.app_subscription_type_old;

-- Create trigger for upload_failures updated_at
CREATE TRIGGER update_upload_failures_updated_at
  BEFORE UPDATE ON public.upload_failures
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_videos_premium_file_code ON public.videos(premium_file_code);
CREATE INDEX IF NOT EXISTS idx_videos_regular_file_code ON public.videos(regular_file_code);
CREATE INDEX IF NOT EXISTS idx_upload_failures_video_id ON public.upload_failures(video_id);
CREATE INDEX IF NOT EXISTS idx_upload_failures_resolved ON public.upload_failures(resolved_at) WHERE resolved_at IS NULL;