-- Fix critical RLS policy issues - Part 2 (Drop existing policies first)

-- 1. Drop all existing policies on analytics_events
DROP POLICY IF EXISTS "Admins can view all analytics events" ON public.analytics_events;
DROP POLICY IF EXISTS "System can insert analytics events" ON public.analytics_events;

-- 2. Drop all existing policies on performance_metrics  
DROP POLICY IF EXISTS "Admins can manage performance metrics" ON public.performance_metrics;
DROP POLICY IF EXISTS "System can insert performance metrics" ON public.performance_metrics;

-- 3. Drop existing policies on telegram_uploads
DROP POLICY IF EXISTS "Admins can view all telegram uploads" ON public.telegram_uploads;
DROP POLICY IF EXISTS "System can insert telegram uploads" ON public.telegram_uploads;
DROP POLICY IF EXISTS "System can update telegram uploads" ON public.telegram_uploads;

-- 4. Drop existing policies on upload_failures  
DROP POLICY IF EXISTS "Admins can manage upload failures" ON public.upload_failures;

-- Now create the secure policies

-- Analytics Events - Restrict to admins only for reading, authenticated users for their own inserts
CREATE POLICY "Admins can view analytics events" 
ON public.analytics_events 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert their own analytics events" 
ON public.analytics_events 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Performance Metrics - Admin and service role only
CREATE POLICY "Admins can view performance metrics" 
ON public.performance_metrics 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can insert performance metrics" 
ON public.performance_metrics 
FOR INSERT 
WITH CHECK (current_setting('role') = 'service_role');

-- Telegram Uploads - Service role and admin only
CREATE POLICY "Admins can view telegram uploads" 
ON public.telegram_uploads 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can insert telegram uploads" 
ON public.telegram_uploads 
FOR INSERT 
WITH CHECK (current_setting('role') = 'service_role');

CREATE POLICY "Service role can update telegram uploads" 
ON public.telegram_uploads 
FOR UPDATE 
USING (current_setting('role') = 'service_role');

-- Upload Failures - Admin only
CREATE POLICY "Admins can manage upload failures" 
ON public.upload_failures 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));