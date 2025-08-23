-- Update the approve_premium_request function to integrate with Telegram
CREATE OR REPLACE FUNCTION public.approve_premium_request(
  request_id uuid, 
  admin_notes_param text DEFAULT NULL::text,
  premium_group_id bigint DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    request_record RECORD;
    admin_role app_role;
    telegram_result jsonb;
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
        payment_info
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
        )
    );
    
    -- Return success with telegram integration info
    RETURN jsonb_build_object(
        'success', true, 
        'message', 'Premium request approved successfully',
        'user_id', request_record.user_id,
        'telegram_username', request_record.telegram_username,
        'premium_group_id', premium_group_id
    );
END;
$$;