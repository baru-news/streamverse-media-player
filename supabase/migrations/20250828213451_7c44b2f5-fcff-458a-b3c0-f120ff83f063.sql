-- Create performance_metrics table for Phase 4 monitoring
CREATE TABLE public.performance_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_type TEXT NOT NULL,
  metric_data JSONB NOT NULL DEFAULT '{}',
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create analytics_events table for analytics tracking
CREATE TABLE public.analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}',
  user_id UUID NULL,
  session_id TEXT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for performance_metrics
CREATE POLICY "Admins can manage performance metrics" 
ON public.performance_metrics 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert performance metrics" 
ON public.performance_metrics 
FOR INSERT 
WITH CHECK (true);

-- Create RLS policies for analytics_events
CREATE POLICY "Admins can view all analytics events" 
ON public.analytics_events 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert analytics events" 
ON public.analytics_events 
FOR INSERT 
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_performance_metrics_type_date ON public.performance_metrics(metric_type, recorded_at DESC);
CREATE INDEX idx_performance_metrics_data ON public.performance_metrics USING GIN(metric_data);
CREATE INDEX idx_analytics_events_type_date ON public.analytics_events(event_type, recorded_at DESC);
CREATE INDEX idx_analytics_events_user ON public.analytics_events(user_id, recorded_at DESC);
CREATE INDEX idx_analytics_events_data ON public.analytics_events USING GIN(event_data);

-- Add callback_data and retry_history to upload_failures table
ALTER TABLE public.upload_failures 
ADD COLUMN callback_data JSONB DEFAULT '{}',
ADD COLUMN retry_history JSONB DEFAULT '[]',
ADD COLUMN notification_sent_at TIMESTAMP WITH TIME ZONE NULL,
ADD COLUMN admin_action_taken TEXT NULL;

-- Create function to get bot monitoring data
CREATE OR REPLACE FUNCTION public.get_bot_monitoring_data()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN jsonb_build_object(
    'active_uploads', (
      SELECT COUNT(*) 
      FROM public.telegram_uploads 
      WHERE upload_status = 'processing'
    ),
    'queue_size', (
      SELECT COUNT(*) 
      FROM public.telegram_uploads 
      WHERE upload_status = 'pending'
    ),
    'success_rate_24h', (
      SELECT COALESCE(
        ROUND(
          (COUNT(*) FILTER (WHERE upload_status = 'completed')::float / 
           NULLIF(COUNT(*), 0) * 100), 2
        ), 0
      )
      FROM public.telegram_uploads 
      WHERE created_at >= now() - interval '24 hours'
    ),
    'total_uploads_today', (
      SELECT COUNT(*) 
      FROM public.telegram_uploads 
      WHERE created_at >= CURRENT_DATE
    ),
    'error_count_24h', (
      SELECT COUNT(*) 
      FROM public.telegram_uploads 
      WHERE upload_status = 'failed' 
      AND created_at >= now() - interval '24 hours'
    )
  );
END;
$$;

-- Create function to get upload analytics
CREATE OR REPLACE FUNCTION public.get_upload_analytics(hours_param INTEGER DEFAULT 24)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  start_time TIMESTAMP WITH TIME ZONE;
  upload_data JSONB;
BEGIN
  start_time := now() - (hours_param || ' hours')::interval;
  
  SELECT jsonb_build_object(
    'total_uploads', COUNT(*),
    'successful_uploads', COUNT(*) FILTER (WHERE upload_status = 'completed'),
    'failed_uploads', COUNT(*) FILTER (WHERE upload_status = 'failed'),
    'pending_uploads', COUNT(*) FILTER (WHERE upload_status = 'pending'),
    'success_rate', COALESCE(
      ROUND(
        (COUNT(*) FILTER (WHERE upload_status = 'completed')::float / 
         NULLIF(COUNT(*), 0) * 100), 2
      ), 0
    ),
    'total_file_size', COALESCE(SUM(file_size), 0),
    'average_file_size', COALESCE(AVG(file_size), 0)
  ) INTO upload_data
  FROM public.telegram_uploads 
  WHERE created_at >= start_time;
  
  RETURN upload_data;
END;
$$;

-- Create trigger function to update performance metrics
CREATE OR REPLACE FUNCTION public.update_performance_metrics()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Insert performance metric when upload status changes
  IF TG_OP = 'UPDATE' AND OLD.upload_status != NEW.upload_status THEN
    INSERT INTO public.performance_metrics (metric_type, metric_data)
    VALUES (
      'upload_status_change',
      jsonb_build_object(
        'upload_id', NEW.id,
        'old_status', OLD.upload_status,
        'new_status', NEW.upload_status,
        'filename', NEW.original_filename,
        'file_size', NEW.file_size,
        'processing_time', EXTRACT(EPOCH FROM (now() - NEW.created_at))
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for performance metrics
CREATE TRIGGER trigger_update_performance_metrics
  AFTER UPDATE ON public.telegram_uploads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_performance_metrics();