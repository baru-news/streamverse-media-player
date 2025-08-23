-- Create function to check if username exists (case insensitive)
CREATE OR REPLACE FUNCTION check_username_exists(username_input text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE LOWER(username) = LOWER(username_input)
  );
$$;

-- Update existing profiles to ensure unique lowercase usernames
-- First, let's see if there are any duplicates after converting to lowercase
UPDATE public.profiles 
SET username = username || '_' || EXTRACT(EPOCH FROM created_at)::text
WHERE id IN (
  SELECT id FROM (
    SELECT id, username, 
           ROW_NUMBER() OVER (PARTITION BY LOWER(username) ORDER BY created_at) as rn
    FROM public.profiles 
    WHERE username IS NOT NULL
  ) ranked 
  WHERE rn > 1
);

-- Now enforce that all usernames are stored in lowercase for consistency
UPDATE public.profiles 
SET username = LOWER(username) 
WHERE username IS NOT NULL AND username != LOWER(username);