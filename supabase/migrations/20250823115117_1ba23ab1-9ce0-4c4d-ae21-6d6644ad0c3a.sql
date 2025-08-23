-- Add unique constraint for username in profiles table
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_username_unique UNIQUE (username);

-- Create index for better performance on username lookups
CREATE INDEX idx_profiles_username ON public.profiles(username) WHERE username IS NOT NULL;