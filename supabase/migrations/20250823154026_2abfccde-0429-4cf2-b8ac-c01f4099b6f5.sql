-- Add 'premium' role to the app_role enum
ALTER TYPE app_role ADD VALUE 'premium';

-- Create premium_subscriptions table
CREATE TABLE public.premium_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_type TEXT NOT NULL DEFAULT 'monthly',
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  payment_info JSONB DEFAULT '{}',
  telegram_username TEXT,
  telegram_user_id BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on premium_subscriptions
ALTER TABLE public.premium_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for premium_subscriptions
CREATE POLICY "Users can view their own subscription" 
ON public.premium_subscriptions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription" 
ON public.premium_subscriptions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription" 
ON public.premium_subscriptions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all subscriptions" 
ON public.premium_subscriptions 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add premium badge to badge_store
INSERT INTO public.badge_store (
  badge_key,
  name,
  description,
  icon,
  rarity,
  color,
  price_coins,
  is_active,
  sort_order
) VALUES (
  'premium_subscriber',
  'Premium Member',
  'Exclusive premium subscriber badge with special benefits',
  '👑',
  'premium',
  '#FFD700',
  0,
  true,
  -1
);

-- Create function to check premium status
CREATE OR REPLACE FUNCTION public.check_user_premium_status(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.premium_subscriptions 
    WHERE user_id = user_id_param 
    AND is_active = true 
    AND (end_date IS NULL OR end_date > now())
  );
END;
$$;

-- Enhanced claim_kitty_key function with premium 2x bonus
CREATE OR REPLACE FUNCTION public.claim_kitty_key(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    can_claim BOOLEAN;
    is_premium BOOLEAN;
    keys_to_award INTEGER := 1;
BEGIN
    -- Check if user can claim
    SELECT public.can_user_claim_kitty_key_today(user_id_param) INTO can_claim;
    
    IF NOT can_claim THEN
        RETURN FALSE;
    END IF;
    
    -- Check if user is premium for 2x bonus
    SELECT public.check_user_premium_status(user_id_param) INTO is_premium;
    
    IF is_premium THEN
        keys_to_award := 2;
    END IF;
    
    -- Mark as claimed in daily progress
    INSERT INTO public.user_daily_progress (user_id, task_key, progress_value, is_completed, completed_at, task_date)
    VALUES (user_id_param, 'kitty_key_claimed', 1, true, now(), CURRENT_DATE)
    ON CONFLICT (user_id, task_key, task_date) 
    DO NOTHING;
    
    -- Award kitty keys to user (1x for regular, 2x for premium)
    INSERT INTO public.user_kitty_keys (user_id, balance, total_earned)
    VALUES (user_id_param, keys_to_award, keys_to_award)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      balance = user_kitty_keys.balance + keys_to_award,
      total_earned = user_kitty_keys.total_earned + keys_to_award,
      updated_at = now();
    
    RETURN TRUE;
END;
$$;

-- Function to handle premium badge assignment
CREATE OR REPLACE FUNCTION public.handle_premium_badge_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    IF NEW.is_active = true AND (NEW.end_date IS NULL OR NEW.end_date > now()) THEN
        -- Assign premium badge
        INSERT INTO public.user_badges (user_id, badge_key, is_active)
        VALUES (NEW.user_id, 'premium_subscriber', true)
        ON CONFLICT (user_id, badge_key) 
        DO UPDATE SET is_active = true;
        
        -- Assign premium role
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.user_id, 'premium'::app_role)
        ON CONFLICT (user_id) DO NOTHING;
    ELSE
        -- Deactivate premium badge
        UPDATE public.user_badges 
        SET is_active = false 
        WHERE user_id = NEW.user_id AND badge_key = 'premium_subscriber';
        
        -- Remove premium role
        DELETE FROM public.user_roles 
        WHERE user_id = NEW.user_id AND role = 'premium'::app_role;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger for premium badge assignment
CREATE TRIGGER premium_badge_assignment_trigger
    AFTER INSERT OR UPDATE ON public.premium_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_premium_badge_assignment();

-- Add trigger for updated_at
CREATE TRIGGER update_premium_subscriptions_updated_at
    BEFORE UPDATE ON public.premium_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();