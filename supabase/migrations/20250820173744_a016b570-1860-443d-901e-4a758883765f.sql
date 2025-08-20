-- Create user_kitty_keys table to store kitty keys like coins
CREATE TABLE public.user_kitty_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  balance INTEGER NOT NULL DEFAULT 0,
  total_earned INTEGER NOT NULL DEFAULT 0,
  total_spent INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_kitty_keys ENABLE ROW LEVEL SECURITY;

-- Create policies for kitty keys
CREATE POLICY "Users can view their own kitty keys" 
  ON public.user_kitty_keys 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own kitty key record" 
  ON public.user_kitty_keys 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own kitty keys" 
  ON public.user_kitty_keys 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all kitty keys" 
  ON public.user_kitty_keys 
  FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_kitty_keys_updated_at
  BEFORE UPDATE ON public.user_kitty_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to check if user can claim kitty key today
CREATE OR REPLACE FUNCTION public.can_user_claim_kitty_key_today(user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    today_date DATE := CURRENT_DATE;
    total_tasks INTEGER;
    completed_tasks INTEGER;
    already_claimed BOOLEAN;
BEGIN
    -- Check if user already claimed kitty key today
    SELECT EXISTS (
        SELECT 1 FROM public.user_daily_progress 
        WHERE user_id = user_id_param 
        AND task_date = today_date 
        AND task_key = 'kitty_key_claimed'
        AND is_completed = true
    ) INTO already_claimed;
    
    IF already_claimed THEN
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
    
    RETURN (completed_tasks = total_tasks AND total_tasks > 0);
END;
$$;

-- Create function to claim kitty key
CREATE OR REPLACE FUNCTION public.claim_kitty_key(user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    can_claim BOOLEAN;
BEGIN
    -- Check if user can claim
    SELECT public.can_user_claim_kitty_key_today(user_id_param) INTO can_claim;
    
    IF NOT can_claim THEN
        RETURN FALSE;
    END IF;
    
    -- Mark as claimed in daily progress
    INSERT INTO public.user_daily_progress (user_id, task_key, progress_value, is_completed, completed_at, task_date)
    VALUES (user_id_param, 'kitty_key_claimed', 1, true, now(), CURRENT_DATE)
    ON CONFLICT (user_id, task_key, task_date) 
    DO NOTHING;
    
    -- Award kitty key to user
    INSERT INTO public.user_kitty_keys (user_id, balance, total_earned)
    VALUES (user_id_param, 1, 1)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      balance = user_kitty_keys.balance + 1,
      total_earned = user_kitty_keys.total_earned + 1,
      updated_at = now();
    
    RETURN TRUE;
END;
$$;

-- Update can_user_spin_today function to check kitty keys instead
CREATE OR REPLACE FUNCTION public.can_user_spin_today(user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    today_date DATE := CURRENT_DATE;
    spin_count INTEGER;
    kitty_key_balance INTEGER;
BEGIN
    -- Check if user already spun today
    SELECT COUNT(*) INTO spin_count
    FROM public.user_spin_attempts
    WHERE user_id = user_id_param AND spin_date = today_date;
    
    IF spin_count > 0 THEN
        RETURN FALSE;
    END IF;
    
    -- Check if user has kitty keys
    SELECT COALESCE(balance, 0) INTO kitty_key_balance
    FROM public.user_kitty_keys
    WHERE user_id = user_id_param;
    
    RETURN (kitty_key_balance > 0);
END;
$$;