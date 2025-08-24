-- Function to check if chat is premium group with auto-upload enabled
CREATE OR REPLACE FUNCTION public.is_premium_group_with_autoupload(chat_id_param BIGINT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.premium_groups 
    WHERE chat_id = chat_id_param 
    AND auto_upload_enabled = true
  );
END;
$function$;