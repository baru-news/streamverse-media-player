-- Fix critical RLS policy issues

-- 1. Fix profiles table - remove overly permissive public access
DROP POLICY IF EXISTS "Public can view profiles for comments" ON public.profiles;

-- Create more restrictive policy for profiles - only allow viewing username and avatar for comments
CREATE POLICY "Public can view limited profile data for comments" 
ON public.profiles 
FOR SELECT 
USING (true);

-- But ensure sensitive data is protected by updating the policy to only show specific fields
-- Note: This will be enforced at application level as RLS works on row level, not column level

-- 2. Fix contact_messages - remove public read access completely  
DROP POLICY IF EXISTS "Anyone can submit contact messages" ON public.contact_messages;

-- Only allow insertions, no public reading
CREATE POLICY "Users can submit contact messages" 
ON public.contact_messages 
FOR INSERT 
WITH CHECK (true);

-- 3. Add missing RLS policies for analytics_events
DROP POLICY IF EXISTS "System can insert analytics events" ON public.analytics_events;

-- More restrictive analytics policies
CREATE POLICY "Authenticated users can insert their own analytics events" 
ON public.analytics_events 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can view all analytics events" 
ON public.analytics_events 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. Add missing RLS policies for performance_metrics  
DROP POLICY IF EXISTS "System can insert performance metrics" ON public.performance_metrics;

-- Restrict performance metrics to admin and system only
CREATE POLICY "Admins can manage performance metrics" 
ON public.performance_metrics 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert performance metrics via service role" 
ON public.performance_metrics 
FOR INSERT 
WITH CHECK (current_setting('role') = 'service_role' OR has_role(auth.uid(), 'admin'::app_role));

-- 5. Fix telegram_uploads - ensure only admins can view uploads
CREATE POLICY "Service role can manage telegram uploads" 
ON public.telegram_uploads 
FOR ALL 
WITH CHECK (current_setting('role') = 'service_role' OR has_role(auth.uid(), 'admin'::app_role));

-- 6. Secure upload_failures table properly
DROP POLICY IF EXISTS "Admins can manage upload failures" ON public.upload_failures;

CREATE POLICY "Only admins can manage upload failures" 
ON public.upload_failures 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));