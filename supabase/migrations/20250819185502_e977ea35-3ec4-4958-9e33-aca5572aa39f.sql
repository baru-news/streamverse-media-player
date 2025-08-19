-- Create hashtags table for managing global hashtags
CREATE TABLE public.hashtags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create video_hashtags junction table for many-to-many relationship
CREATE TABLE public.video_hashtags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL,
  hashtag_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(video_id, hashtag_id)
);

-- Add foreign key constraints
ALTER TABLE public.video_hashtags 
ADD CONSTRAINT fk_video_hashtags_video 
FOREIGN KEY (video_id) REFERENCES public.videos(id) ON DELETE CASCADE;

ALTER TABLE public.video_hashtags 
ADD CONSTRAINT fk_video_hashtags_hashtag 
FOREIGN KEY (hashtag_id) REFERENCES public.hashtags(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE public.hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_hashtags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for hashtags
CREATE POLICY "Anyone can view hashtags" 
ON public.hashtags 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage hashtags" 
ON public.hashtags 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for video_hashtags  
CREATE POLICY "Anyone can view video hashtags" 
ON public.video_hashtags 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage video hashtags" 
ON public.video_hashtags 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create triggers for updated_at
CREATE TRIGGER update_hashtags_updated_at
BEFORE UPDATE ON public.hashtags
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default hashtags
INSERT INTO public.hashtags (name, description, color) VALUES 
('gaming', 'Video game related content', '#ff6b6b'),
('tutorial', 'Educational and instructional videos', '#4ecdc4'),
('entertainment', 'Fun and entertaining content', '#45b7d1'),
('music', 'Music and audio content', '#f9ca24'),
('sports', 'Sports and fitness content', '#6c5ce7'),
('technology', 'Tech reviews and discussions', '#00b894'),
('cooking', 'Food and cooking videos', '#fd79a8'),
('travel', 'Travel vlogs and guides', '#fdcb6e');