-- Add welcome_bonus_claimed field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN welcome_bonus_claimed BOOLEAN NOT NULL DEFAULT false;

-- Create function to award welcome bonus
CREATE OR REPLACE FUNCTION public.award_welcome_bonus(user_id_param uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    profile_record RECORD;
    newbie_badge_exists BOOLEAN;
BEGIN
    -- Check if user exists and hasn't claimed bonus yet
    SELECT * INTO profile_record
    FROM public.profiles
    WHERE id = user_id_param 
    AND profile_complete = true 
    AND welcome_bonus_claimed = false;
    
    IF profile_record IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not eligible for welcome bonus');
    END IF;
    
    -- Check if Newbie badge exists in badge store
    SELECT EXISTS (
        SELECT 1 FROM public.badge_store 
        WHERE badge_key = 'newbie' AND is_active = true
    ) INTO newbie_badge_exists;
    
    IF NOT newbie_badge_exists THEN
        RETURN jsonb_build_object('success', false, 'error', 'Newbie badge not found in store');
    END IF;
    
    -- Award Newbie badge (free, no coin cost)
    INSERT INTO public.user_badges (user_id, badge_key, is_active)
    VALUES (user_id_param, 'newbie', true)
    ON CONFLICT (user_id, badge_key) 
    DO UPDATE SET is_active = true;
    
    -- Award 5 Kitty Keys
    INSERT INTO public.user_kitty_keys (user_id, balance, total_earned)
    VALUES (user_id_param, 5, 5)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      balance = user_kitty_keys.balance + 5,
      total_earned = user_kitty_keys.total_earned + 5,
      updated_at = now();
    
    -- Mark welcome bonus as claimed
    UPDATE public.profiles
    SET welcome_bonus_claimed = true, updated_at = now()
    WHERE id = user_id_param;
    
    -- Log the bonus award
    INSERT INTO public.upload_logs (user_id, filename, success, upload_type, error_message)
    VALUES (user_id_param, 'welcome_bonus', true, 'welcome_bonus', 'Welcome bonus awarded: Newbie badge + 5 Kitty Keys');
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Welcome bonus awarded successfully!',
        'awarded_badge', 'newbie',
        'awarded_keys', 5
    );
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error
        INSERT INTO public.upload_logs (user_id, filename, success, upload_type, error_message)
        VALUES (user_id_param, 'welcome_bonus', false, 'welcome_bonus', 'Failed to award welcome bonus: ' || SQLERRM);
        
        RETURN jsonb_build_object('success', false, 'error', 'Failed to award welcome bonus: ' || SQLERRM);
END;
$function$;