-- Create a policy that allows public viewing of profiles for comments
-- We'll control what columns are accessed in the application code
CREATE POLICY "Public can view profiles for comments"
ON public.profiles
FOR SELECT
USING (true);