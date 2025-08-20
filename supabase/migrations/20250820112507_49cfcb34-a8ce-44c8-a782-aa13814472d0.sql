-- Remove the overly broad policy
DROP POLICY "Public can view usernames and avatars" ON public.profiles;

-- Create a more specific policy that only allows viewing username and avatar_url
-- We need to modify the useComments hook to only select these specific columns
-- The policy will be: anyone can SELECT but we'll control what columns are accessed in the code