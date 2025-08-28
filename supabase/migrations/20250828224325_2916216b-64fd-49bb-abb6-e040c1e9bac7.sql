-- Fix remaining security issues by updating existing policies

-- Fix user badges policies - remove public access, keep user and admin access
DROP POLICY IF EXISTS "Anyone can view active user badges for display" ON public.user_badges;
DROP POLICY IF EXISTS "Public can view user badges for display" ON public.user_badges;

-- Add admin policy for user badges management (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_badges' 
        AND policyname = 'Admins can manage user badges'
    ) THEN
        EXECUTE 'CREATE POLICY "Admins can manage user badges" 
                ON public.user_badges 
                FOR ALL 
                USING (
                  EXISTS (
                    SELECT 1 FROM public.user_roles 
                    WHERE user_id = auth.uid() AND role = ''admin''::app_role
                  )
                )';
    END IF;
END $$;

-- Fix analytics events policy - ensure users can only track themselves
DROP POLICY IF EXISTS "Users can insert their own analytics events" ON public.analytics_events;

-- Create proper analytics policy
CREATE POLICY "Users can insert only their own analytics events" 
ON public.analytics_events 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow anonymous analytics for non-logged in users
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'analytics_events' 
        AND policyname = 'Allow anonymous analytics events'
    ) THEN
        EXECUTE 'CREATE POLICY "Allow anonymous analytics events" 
                ON public.analytics_events 
                FOR INSERT 
                WITH CHECK (user_id IS NULL AND auth.uid() IS NULL)';
    END IF;
END $$;

-- Create secure function to get public badge info for display (if needed)
CREATE OR REPLACE FUNCTION public.get_user_badge_display(badge_user_id uuid)
RETURNS TABLE(badge_key text, is_active boolean, badge_slot integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Return only active badge info for public display
  RETURN QUERY
  SELECT ub.badge_key, ub.is_active, ub.badge_slot
  FROM public.user_badges ub
  WHERE ub.user_id = badge_user_id 
    AND ub.is_active = true;
END;
$$;