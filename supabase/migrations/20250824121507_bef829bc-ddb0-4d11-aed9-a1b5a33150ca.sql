-- Phase 1: Database Schema Updates for 3-Slot Badge System

-- 1. Add new columns to user_badges table
ALTER TABLE public.user_badges 
ADD COLUMN badge_slot INTEGER,
ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;

-- 2. Update existing badges to slot 1 (telegram premium) for migration
UPDATE public.user_badges 
SET badge_slot = 1 
WHERE badge_key = 'premium_subscriber';

-- 3. Drop old unique constraint and add new one
ALTER TABLE public.user_badges 
DROP CONSTRAINT IF EXISTS user_badges_user_id_badge_key_key;

ALTER TABLE public.user_badges 
ADD CONSTRAINT user_badges_user_id_badge_slot_key UNIQUE (user_id, badge_slot);

-- 4. Replace old premium_subscriber badge with new telegram and streaming badges
DELETE FROM public.badge_store WHERE badge_key = 'premium_subscriber';

-- Insert new premium badges
INSERT INTO public.badge_store (
  badge_key, 
  name, 
  description, 
  price_coins, 
  icon, 
  rarity, 
  color, 
  is_active, 
  sort_order
) VALUES 
(
  'telegram_subscriber',
  'Telegram Premium',
  'Exclusive access to premium Telegram group',
  0,
  '🔷',
  'legendary',
  '#0088CC',
  true,
  1
),
(
  'streaming_subscriber', 
  'Streaming Premium',
  'Ad-free streaming experience',
  0,
  '🎬', 
  'epic',
  '#FF6B35',
  true,
  2
);

-- 5. Update existing premium_subscriber badges to telegram_subscriber
UPDATE public.user_badges 
SET badge_key = 'telegram_subscriber'
WHERE badge_key = 'premium_subscriber';

-- 6. Create function to cleanup expired streaming badges
CREATE OR REPLACE FUNCTION public.cleanup_expired_streaming_badges()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Remove expired streaming badges
  DELETE FROM public.user_badges 
  WHERE badge_slot = 2 
    AND expires_at IS NOT NULL 
    AND expires_at < now();
END;
$$;

-- 7. Update handle_premium_badge_assignment function for 3-slot system
CREATE OR REPLACE FUNCTION public.handle_premium_badge_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Clean up expired badges first
    PERFORM public.cleanup_expired_streaming_badges();
    
    IF NEW.is_active = true AND (NEW.end_date IS NULL OR NEW.end_date > now()) THEN
        -- Assign appropriate badge based on subscription type
        IF NEW.subscription_type = 'lifetime' OR NEW.subscription_type LIKE '%telegram%' THEN
            -- Telegram Premium Badge (Slot 1, Permanent)
            INSERT INTO public.user_badges (user_id, badge_key, badge_slot, is_active, expires_at)
            VALUES (NEW.user_id, 'telegram_subscriber', 1, true, NULL)
            ON CONFLICT (user_id, badge_slot) 
            DO UPDATE SET 
                badge_key = 'telegram_subscriber',
                is_active = true,
                expires_at = NULL;
        ELSE
            -- Streaming Premium Badge (Slot 2, Temporary)
            INSERT INTO public.user_badges (user_id, badge_key, badge_slot, is_active, expires_at)
            VALUES (NEW.user_id, 'streaming_subscriber', 2, true, NEW.end_date)
            ON CONFLICT (user_id, badge_slot) 
            DO UPDATE SET 
                badge_key = 'streaming_subscriber',
                is_active = true,
                expires_at = NEW.end_date;
        END IF;
        
        -- Assign premium role
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.user_id, 'premium'::app_role)
        ON CONFLICT (user_id) DO NOTHING;
    ELSE
        -- Deactivate appropriate badge based on subscription type
        IF NEW.subscription_type = 'lifetime' OR NEW.subscription_type LIKE '%telegram%' THEN
            -- Remove telegram badge (slot 1)
            DELETE FROM public.user_badges 
            WHERE user_id = NEW.user_id AND badge_slot = 1;
        ELSE
            -- Remove streaming badge (slot 2) 
            DELETE FROM public.user_badges 
            WHERE user_id = NEW.user_id AND badge_slot = 2;
        END IF;
        
        -- Check if user has any active premium subscriptions left
        IF NOT EXISTS (
            SELECT 1 FROM public.premium_subscriptions 
            WHERE user_id = NEW.user_id 
              AND is_active = true 
              AND (end_date IS NULL OR end_date > now())
        ) THEN
            -- Remove premium role if no active subscriptions
            DELETE FROM public.user_roles 
            WHERE user_id = NEW.user_id AND role = 'premium'::app_role;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;