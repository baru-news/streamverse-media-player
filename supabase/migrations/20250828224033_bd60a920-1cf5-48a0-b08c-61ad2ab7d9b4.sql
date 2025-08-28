-- Fix Critical Security Issue #3: Fix conflicting profiles table policies
DROP POLICY IF EXISTS "Users can view basic profile info for comments and display" ON public.profiles;

-- Create secure policies for profiles table
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Fix Critical Security Issue #4: Fix conflicting user badges policies
DROP POLICY IF EXISTS "Anyone can view active user badges for display" ON public.user_badges;
DROP POLICY IF EXISTS "Public can view user badges for display" ON public.user_badges;

-- Keep only secure user badge policies
-- (Users can view their own badges policy already exists)
-- Add admin policy for management
CREATE POLICY "Admins can manage user badges" 
ON public.user_badges 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  )
);

-- Fix Critical Security Issue #5: Remove duplicate contact message policies  
DROP POLICY IF EXISTS "Admins can update contact messages" ON public.contact_messages;

-- The "Only admins can view contact messages" policy is already correct
-- Add back the proper update policy
CREATE POLICY "Admins can update contact messages status" 
ON public.contact_messages 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  )
);

-- Fix Critical Security Issue #6: Fix analytics events user tracking
DROP POLICY IF EXISTS "Users can insert their own analytics events" ON public.analytics_events;

CREATE POLICY "Users can insert only their own analytics events" 
ON public.analytics_events 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow anonymous analytics (for non-logged in users) with null user_id
CREATE POLICY "Allow anonymous analytics events" 
ON public.analytics_events 
FOR INSERT 
WITH CHECK (user_id IS NULL AND auth.uid() IS NULL);

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