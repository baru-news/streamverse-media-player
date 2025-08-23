-- Add profile_complete field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS profile_complete boolean NOT NULL DEFAULT true;

-- Update existing profiles that have null usernames to be incomplete
UPDATE public.profiles 
SET profile_complete = false 
WHERE username IS NULL;

-- Update handle_new_user function to handle profile completion logic
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, username, profile_complete)
  VALUES (
    NEW.id,
    NEW.email,
    CASE 
      WHEN NEW.raw_user_meta_data->>'username' != '' 
      THEN LOWER(COALESCE(NEW.raw_user_meta_data->>'username', ''))
      ELSE NULL
    END,
    -- Mark as incomplete if username is null (Google users) or if explicitly marked in metadata
    CASE 
      WHEN NEW.raw_user_meta_data->>'username' IS NULL OR NEW.raw_user_meta_data->>'username' = ''
      THEN false
      ELSE true
    END
  );
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$function$;