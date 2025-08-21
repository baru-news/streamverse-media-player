-- Create spin wheel rewards table
CREATE TABLE public.spin_wheel_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  coin_amount INTEGER NOT NULL,
  rarity TEXT NOT NULL DEFAULT 'common', -- common, rare, epic, legendary
  probability DECIMAL(5,2) NOT NULL DEFAULT 12.50, -- percentage out of 100
  color TEXT NOT NULL DEFAULT '#FFB6C1',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user spin attempts table
CREATE TABLE public.user_spin_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  reward_id UUID NOT NULL,
  coins_won INTEGER NOT NULL,
  spin_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create spin wheel settings table
CREATE TABLE public.spin_wheel_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  setting_type TEXT NOT NULL DEFAULT 'text',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.spin_wheel_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_spin_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spin_wheel_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for spin_wheel_rewards
CREATE POLICY "Anyone can view active rewards" 
ON public.spin_wheel_rewards 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage rewards" 
ON public.spin_wheel_rewards 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for user_spin_attempts
CREATE POLICY "Users can view their own spin attempts" 
ON public.user_spin_attempts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own spin attempts" 
ON public.user_spin_attempts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all spin attempts" 
ON public.user_spin_attempts 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for spin_wheel_settings
CREATE POLICY "Anyone can view spin wheel settings" 
ON public.spin_wheel_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage spin wheel settings" 
ON public.spin_wheel_settings 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add foreign key constraints
ALTER TABLE public.user_spin_attempts 
ADD CONSTRAINT fk_user_spin_attempts_reward_id 
FOREIGN KEY (reward_id) REFERENCES public.spin_wheel_rewards(id);

-- Create indexes for better performance
CREATE INDEX idx_user_spin_attempts_user_id ON public.user_spin_attempts(user_id);
CREATE INDEX idx_user_spin_attempts_spin_date ON public.user_spin_attempts(spin_date);
CREATE INDEX idx_spin_wheel_rewards_active ON public.spin_wheel_rewards(is_active);

-- Add trigger for updated_at
CREATE TRIGGER update_spin_wheel_rewards_updated_at
BEFORE UPDATE ON public.spin_wheel_rewards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_spin_wheel_settings_updated_at
BEFORE UPDATE ON public.spin_wheel_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default rewards (Hello Kitty themed)
INSERT INTO public.spin_wheel_rewards (name, coin_amount, rarity, probability, color, sort_order) VALUES
('Kitty Treat', 10, 'common', 25.00, '#FFB6C1', 1),
('Pink Bow', 25, 'common', 20.00, '#FF69B4', 2),
('Cute Paws', 50, 'common', 18.00, '#FFC0CB', 3),
('Sweet Heart', 100, 'rare', 15.00, '#FF1493', 4),
('Hello Gift', 250, 'rare', 10.00, '#C71585', 5),
('Kitty Crown', 500, 'epic', 7.00, '#8B008B', 6),
('Lucky Star', 1000, 'epic', 4.00, '#4B0082', 7),
('MEGA BONUS!', 2500, 'legendary', 1.00, '#FF0080', 8);

-- Insert default settings
INSERT INTO public.spin_wheel_settings (setting_key, setting_value, setting_type) VALUES
('is_enabled', 'true', 'boolean'),
('daily_spin_limit', '1', 'number'),
('require_all_tasks_complete', 'true', 'boolean');

-- Create function to check if user can spin today  
CREATE OR REPLACE FUNCTION public.can_user_spin_today(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    today_date DATE := CURRENT_DATE;
    spin_count INTEGER;
    all_tasks_completed BOOLEAN;
    total_tasks INTEGER;
    completed_tasks INTEGER;
BEGIN
    -- Check if user already spun today
    SELECT COUNT(*) INTO spin_count
    FROM public.user_spin_attempts
    WHERE user_id = user_id_param AND spin_date = today_date;
    
    IF spin_count > 0 THEN
        RETURN FALSE;
    END IF;
    
    -- Check if all daily tasks are completed
    SELECT COUNT(*) INTO total_tasks
    FROM public.daily_tasks
    WHERE is_active = true;
    
    SELECT COUNT(*) INTO completed_tasks
    FROM public.user_daily_progress udp
    JOIN public.daily_tasks dt ON udp.task_key = dt.task_key
    WHERE udp.user_id = user_id_param 
      AND udp.task_date = today_date 
      AND udp.is_completed = true
      AND dt.is_active = true;
    
    all_tasks_completed := (completed_tasks = total_tasks AND total_tasks > 0);
    
    RETURN all_tasks_completed;
END;
$$;