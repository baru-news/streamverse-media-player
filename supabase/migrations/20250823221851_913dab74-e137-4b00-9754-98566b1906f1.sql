-- Add enhanced validation for approve_premium_request function
CREATE OR REPLACE FUNCTION public.approve_premium_request(request_id uuid, admin_notes_param text DEFAULT NULL::text, premium_group_id bigint DEFAULT NULL::bigint)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    request_record RECORD;
    admin_role app_role;
    user_profile RECORD;
BEGIN
    -- Check if current user is admin
    SELECT role INTO admin_role
    FROM public.user_roles 
    WHERE user_id = auth.uid();
    
    IF admin_role != 'admin' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Admin access required');
    END IF;
    
    -- Get the request details
    SELECT * INTO request_record
    FROM public.premium_subscription_requests
    WHERE id = request_id AND status = 'pending';
    
    IF request_record IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Request not found or already processed');
    END IF;
    
    -- Get user profile with Telegram data validation
    SELECT * INTO user_profile
    FROM public.profiles
    WHERE id = request_record.user_id;
    
    IF user_profile IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User profile not found');
    END IF;
    
    -- Enhanced Telegram validation - require both telegram_user_id and telegram_username
    IF user_profile.telegram_user_id IS NULL OR user_profile.telegram_username IS NULL THEN
        RETURN jsonb_build_object(
            'success', false, 
            'error', 'User must link their Telegram account before premium approval. Missing Telegram data in profile.'
        );
    END IF;
    
    -- Update request status
    UPDATE public.premium_subscription_requests
    SET 
        status = 'approved',
        admin_notes = admin_notes_param,
        admin_user_id = auth.uid(),
        processed_at = now(),
        updated_at = now()
    WHERE id = request_id;
    
    -- Create premium subscription
    INSERT INTO public.premium_subscriptions (
        user_id,
        subscription_type,
        start_date,
        end_date,
        is_active,
        payment_info,
        telegram_username,
        telegram_user_id
    ) VALUES (
        request_record.user_id,
        request_record.subscription_type,
        now(),
        NULL, -- Lifetime subscription
        true,
        jsonb_build_object(
            'trakteer_transaction_id', request_record.trakteer_transaction_id,
            'amount', request_record.amount,
            'approved_by', auth.uid(),
            'request_id', request_id
        ),
        user_profile.telegram_username,
        user_profile.telegram_user_id
    );
    
    -- Return success with validated telegram integration info
    RETURN jsonb_build_object(
        'success', true, 
        'message', 'Premium request approved successfully with validated Telegram account',
        'user_id', request_record.user_id,
        'telegram_username', user_profile.telegram_username,
        'telegram_user_id', user_profile.telegram_user_id,
        'premium_group_id', premium_group_id
    );
END;
$function$;