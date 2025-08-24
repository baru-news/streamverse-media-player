-- Function to check if user is admin via telegram
CREATE OR REPLACE FUNCTION public.is_telegram_admin(telegram_user_id_param BIGINT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.admin_telegram_users atu
    JOIN public.user_roles ur ON atu.user_id = ur.user_id
    WHERE atu.telegram_user_id = telegram_user_id_param 
    AND atu.is_active = true
    AND ur.role = 'admin'::app_role
  );
END;
$function$;