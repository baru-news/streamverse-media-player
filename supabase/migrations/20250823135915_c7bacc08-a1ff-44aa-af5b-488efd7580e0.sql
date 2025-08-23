-- Fix search path for existing functions to address security warning
CREATE OR REPLACE FUNCTION public.update_watch_progress(user_id_param uuid, duration_seconds integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.handle_daily_login(user_id_param uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.award_task_coins()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.can_user_claim_kitty_key_today(user_id_param uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.claim_kitty_key(user_id_param uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.make_user_admin(user_email text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    target_user_id UUID;
    existing_role app_role;
BEGIN
    -- Find user by email from profiles table
    SELECT id INTO target_user_id 
    FROM public.profiles 
    WHERE email = user_email;
    
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'User with email % not found', user_email;
        RETURN FALSE;
    END IF;
    
    -- Check current role
    SELECT role INTO existing_role 
    FROM public.user_roles 
    WHERE user_id = target_user_id;
    
    -- Update or insert admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'admin'::app_role)
    ON CONFLICT (user_id) 
    DO UPDATE SET role = 'admin'::app_role;
    
    RAISE NOTICE 'Successfully made user % an admin', user_email;
    RETURN TRUE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
 RETURNS app_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    CASE 
      WHEN NEW.raw_user_meta_data->>'username' != '' 
      THEN LOWER(COALESCE(NEW.raw_user_meta_data->>'username', ''))
      ELSE NULL
    END
  );
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$function$;