-- Create videos table to store Doodstream video metadata
CREATE TABLE public.videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  duration INTEGER,
  views INTEGER DEFAULT 0,
  status TEXT DEFAULT 'processing',
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  file_size BIGINT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (videos are public content)
CREATE POLICY "Anyone can view videos" 
ON public.videos 
FOR SELECT 
USING (true);

-- Create policy for inserting videos (for now, allow authenticated users)
CREATE POLICY "Authenticated users can insert videos" 
ON public.videos 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Create policy for updating videos
CREATE POLICY "Authenticated users can update videos" 
ON public.videos 
FOR UPDATE 
TO authenticated
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_videos_updated_at
  BEFORE UPDATE ON public.videos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_videos_file_code ON public.videos(file_code);
CREATE INDEX idx_videos_upload_date ON public.videos(upload_date DESC);
CREATE INDEX idx_videos_status ON public.videos(status);

-- Enable realtime for videos table
ALTER PUBLICATION supabase_realtime ADD TABLE public.videos;