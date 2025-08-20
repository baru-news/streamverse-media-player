-- Create video_favorites table
CREATE TABLE public.video_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  video_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, video_id)
);

-- Enable Row Level Security
ALTER TABLE public.video_favorites ENABLE ROW LEVEL SECURITY;

-- Create policies for video_favorites
CREATE POLICY "Users can add their own favorites" 
ON public.video_favorites 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own favorites" 
ON public.video_favorites 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can remove their own favorites" 
ON public.video_favorites 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add index for better performance
CREATE INDEX idx_video_favorites_user_id ON public.video_favorites(user_id);
CREATE INDEX idx_video_favorites_video_id ON public.video_favorites(video_id);