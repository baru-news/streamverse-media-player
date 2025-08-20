-- Create user_coins table to track user coin balances
CREATE TABLE public.user_coins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,
  total_earned INTEGER NOT NULL DEFAULT 0,
  total_spent INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create daily_tasks table for task definitions
CREATE TABLE public.daily_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL, -- 'login', 'watch_time', 'community'
  target_value INTEGER NOT NULL DEFAULT 1,
  reward_coins INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_daily_progress table to track daily task progress
CREATE TABLE public.user_daily_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_key TEXT NOT NULL,
  progress_value INTEGER NOT NULL DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  task_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, task_key, task_date)
);

-- Create badge_store table for available badges
CREATE TABLE public.badge_store (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  badge_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  price_coins INTEGER NOT NULL,
  icon TEXT NOT NULL, -- emoji or icon name
  rarity TEXT NOT NULL DEFAULT 'common', -- common, rare, epic, legendary
  color TEXT NOT NULL DEFAULT '#3b82f6',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_badges table for user's purchased badges
CREATE TABLE public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_key TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false, -- which badge is currently displayed
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_key)
);

-- Create user_watch_sessions table for tracking watch time
CREATE TABLE public.user_watch_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id UUID,
  session_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  session_end TIMESTAMP WITH TIME ZONE,
  watch_duration INTEGER NOT NULL DEFAULT 0, -- in seconds
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_coins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_daily_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badge_store ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_watch_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_coins
CREATE POLICY "Users can view their own coins" ON public.user_coins
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own coin record" ON public.user_coins
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own coins" ON public.user_coins
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all coins" ON public.user_coins
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for daily_tasks
CREATE POLICY "Anyone can view active daily tasks" ON public.daily_tasks
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage daily tasks" ON public.daily_tasks
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for user_daily_progress
CREATE POLICY "Users can view their own progress" ON public.user_daily_progress
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" ON public.user_daily_progress
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" ON public.user_daily_progress
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all progress" ON public.user_daily_progress
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for badge_store
CREATE POLICY "Anyone can view active badges" ON public.badge_store
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage badge store" ON public.badge_store
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for user_badges
CREATE POLICY "Users can view their own badges" ON public.user_badges
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own badges" ON public.user_badges
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own badges" ON public.user_badges
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Public can view user badges for display" ON public.user_badges
FOR SELECT USING (true);

-- RLS Policies for user_watch_sessions
CREATE POLICY "Users can manage their own watch sessions" ON public.user_watch_sessions
FOR ALL USING (auth.uid() = user_id);

-- Create triggers for updated_at columns
CREATE TRIGGER update_user_coins_updated_at
BEFORE UPDATE ON public.user_coins
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_daily_tasks_updated_at
BEFORE UPDATE ON public.daily_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default daily tasks
INSERT INTO public.daily_tasks (task_key, title, description, task_type, target_value, reward_coins) VALUES
('daily_login', 'Daily Login', 'Login to your account', 'login', 1, 50),
('watch_10min', 'Watch 10 Minutes', 'Watch videos for 10 minutes', 'watch_time', 600, 100),
('watch_30min', 'Watch 30 Minutes', 'Watch videos for 30 minutes', 'watch_time', 1800, 300),
('watch_60min', 'Watch 1 Hour', 'Watch videos for 1 hour', 'watch_time', 3600, 500),
('watch_2hours', 'Watch 2 Hours', 'Watch videos for 2 hours', 'watch_time', 7200, 800),
('daily_comment', 'Leave a Comment', 'Comment on a video', 'community', 1, 25),
('daily_like', 'Like a Video', 'Like a video', 'community', 1, 15),
('daily_favorite', 'Add to Favorites', 'Add a video to your favorites', 'community', 1, 20);

-- Insert default badges
INSERT INTO public.badge_store (badge_key, name, description, price_coins, icon, rarity, color, sort_order) VALUES
('newbie', 'Newbie', 'Welcome to DINO18!', 100, '🌱', 'common', '#10b981', 1),
('active', 'Active', 'Regular viewer', 500, '⚡', 'common', '#3b82f6', 2),
('fan', 'Fan', 'True fan of DINO18', 1000, '❤️', 'rare', '#ec4899', 3),
('gg', 'GG', 'Good Game!', 2000, '🎮', 'rare', '#8b5cf6', 4),
('legend', 'Legend', 'Legendary status achieved!', 5000, '👑', 'epic', '#f59e0b', 5),
('champion', 'Champion', 'Ultimate champion!', 10000, '🏆', 'legendary', '#ef4444', 6),
('diamond', 'Diamond', 'Diamond tier player', 15000, '💎', 'legendary', '#06b6d4', 7),
('master', 'Master', 'True master of DINO18', 25000, '🔥', 'legendary', '#dc2626', 8);

-- Create function to handle daily login task
CREATE OR REPLACE FUNCTION public.handle_daily_login(user_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert or update daily login progress
  INSERT INTO public.user_daily_progress (user_id, task_key, progress_value, is_completed, completed_at)
  VALUES (user_id_param, 'daily_login', 1, true, now())
  ON CONFLICT (user_id, task_key, task_date) 
  DO NOTHING;
  
  -- Initialize user coins if not exists
  INSERT INTO public.user_coins (user_id, balance, total_earned)
  VALUES (user_id_param, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

-- Create function to update watch time progress
CREATE OR REPLACE FUNCTION public.update_watch_progress(user_id_param UUID, duration_seconds INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  task_record RECORD;
BEGIN
  -- Update progress for all watch time tasks
  FOR task_record IN 
    SELECT task_key, target_value, reward_coins 
    FROM public.daily_tasks 
    WHERE task_type = 'watch_time' AND is_active = true
  LOOP
    -- Insert or update progress
    INSERT INTO public.user_daily_progress (user_id, task_key, progress_value, is_completed, completed_at)
    VALUES (
      user_id_param, 
      task_record.task_key, 
      LEAST(duration_seconds, task_record.target_value),
      duration_seconds >= task_record.target_value,
      CASE WHEN duration_seconds >= task_record.target_value THEN now() ELSE NULL END
    )
    ON CONFLICT (user_id, task_key, task_date) 
    DO UPDATE SET 
      progress_value = LEAST(EXCLUDED.progress_value + user_daily_progress.progress_value, task_record.target_value),
      is_completed = (EXCLUDED.progress_value + user_daily_progress.progress_value) >= task_record.target_value,
      completed_at = CASE 
        WHEN (EXCLUDED.progress_value + user_daily_progress.progress_value) >= task_record.target_value 
        THEN COALESCE(user_daily_progress.completed_at, now()) 
        ELSE NULL 
      END;
  END LOOP;
END;
$$;

-- Create function to award coins for completed tasks
CREATE OR REPLACE FUNCTION public.award_task_coins()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  task_reward INTEGER;
BEGIN
  -- Only award coins when task is newly completed
  IF NEW.is_completed = true AND (OLD.is_completed IS NULL OR OLD.is_completed = false) THEN
    -- Get reward amount for this task
    SELECT reward_coins INTO task_reward
    FROM public.daily_tasks
    WHERE task_key = NEW.task_key AND is_active = true;
    
    IF task_reward IS NOT NULL THEN
      -- Award coins to user
      INSERT INTO public.user_coins (user_id, balance, total_earned)
      VALUES (NEW.user_id, task_reward, task_reward)
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        balance = user_coins.balance + task_reward,
        total_earned = user_coins.total_earned + task_reward,
        updated_at = now();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to award coins automatically
CREATE TRIGGER award_coins_on_task_completion
AFTER INSERT OR UPDATE ON public.user_daily_progress
FOR EACH ROW
EXECUTE FUNCTION public.award_task_coins();