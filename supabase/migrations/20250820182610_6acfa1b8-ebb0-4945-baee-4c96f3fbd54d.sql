-- Remove the old can_user_spin_today function since we now use Kitty Key system
DROP FUNCTION IF EXISTS public.can_user_spin_today(uuid);