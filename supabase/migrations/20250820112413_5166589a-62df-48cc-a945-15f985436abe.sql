-- Allow public viewing of usernames and avatars for comments
-- while keeping email and other sensitive data private
CREATE POLICY "Public can view usernames and avatars"
ON public.profiles
FOR SELECT
USING (true);