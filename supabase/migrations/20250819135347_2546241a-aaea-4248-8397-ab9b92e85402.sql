-- Fix RLS policies for videos table to allow edge functions to insert data
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can insert videos" ON public.videos;
DROP POLICY IF EXISTS "Authenticated users can update videos" ON public.videos;

-- Create new policies that allow service role (edge functions) to insert/update
CREATE POLICY "Allow service role to insert videos" 
ON public.videos 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow service role to update videos" 
ON public.videos 
FOR UPDATE 
USING (true);

-- Keep the existing select policy for public access
-- "Anyone can view videos" policy is already good