-- Fix security warnings by setting search_path for functions
ALTER FUNCTION public.handle_daily_login(uuid) SET search_path = public;
ALTER FUNCTION public.update_watch_progress(uuid, integer) SET search_path = public;  
ALTER FUNCTION public.award_task_coins() SET search_path = public;