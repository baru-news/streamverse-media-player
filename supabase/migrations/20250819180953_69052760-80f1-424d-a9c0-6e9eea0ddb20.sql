-- Create likes table
CREATE TABLE public.video_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, video_id)
);

-- Create subscriptions table  
CREATE TABLE public.user_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscriber_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(subscriber_id, creator_name)
);

-- Enable RLS
ALTER TABLE public.video_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies for video_likes
CREATE POLICY "Users can view all likes" ON public.video_likes FOR SELECT USING (true);
CREATE POLICY "Users can like videos" ON public.video_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike their own likes" ON public.video_likes FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for user_subscriptions
CREATE POLICY "Users can view their own subscriptions" ON public.user_subscriptions FOR SELECT USING (auth.uid() = subscriber_id);
CREATE POLICY "Users can subscribe" ON public.user_subscriptions FOR INSERT WITH CHECK (auth.uid() = subscriber_id);
CREATE POLICY "Users can unsubscribe" ON public.user_subscriptions FOR DELETE USING (auth.uid() = subscriber_id);

-- Create indexes for performance
CREATE INDEX idx_video_likes_video_id ON public.video_likes(video_id);
CREATE INDEX idx_video_likes_user_id ON public.video_likes(user_id);
CREATE INDEX idx_user_subscriptions_subscriber_id ON public.user_subscriptions(subscriber_id);
CREATE INDEX idx_user_subscriptions_creator_name ON public.user_subscriptions(creator_name);