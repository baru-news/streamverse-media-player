-- Fix Critical Security Issue #1: Restrict profiles table access
-- Remove overly permissive public access policy
DROP POLICY IF EXISTS "Public can view profiles for comments" ON public.profiles;

-- Add restricted policy for profile visibility
CREATE POLICY "Users can view basic profile info for comments and display" 
ON public.profiles 
FOR SELECT 
USING (
  -- Allow users to see basic info (username, avatar) for comments/display
  -- but restrict sensitive data like email, telegram info
  CASE 
    WHEN auth.uid() = id THEN true  -- Users can see their own full profile
    ELSE false  -- Others cannot see profiles directly (will be handled by app logic)
  END
);

-- Fix Critical Security Issue #2: Restrict contact_messages table access  
-- Remove overly permissive public viewing policy
DROP POLICY IF EXISTS "Admins can view all contact messages" ON public.contact_messages;

-- Add proper admin-only access policy
CREATE POLICY "Only admins can view contact messages" 
ON public.contact_messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  )
);

-- Ensure admins can still update message status
CREATE POLICY "Only admins can update contact messages" 
ON public.contact_messages 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  )
);

-- Add security function to safely get profile data for comments
CREATE OR REPLACE FUNCTION public.get_profile_for_comment(profile_user_id uuid)
RETURNS TABLE(username text, avatar_url text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Return only safe profile data for comment display
  RETURN QUERY
  SELECT p.username, p.avatar_url
  FROM public.profiles p
  WHERE p.id = profile_user_id;
END;
$$;