-- Create edge function for user deletion with proper cleanup
-- This function will be called by admins to delete user accounts

CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    current_user_role app_role;
    cleanup_result jsonb;
    tables_cleaned TEXT[] := '{}';
    records_deleted INTEGER := 0;
    temp_count INTEGER;
BEGIN
    -- Check if current user is admin
    SELECT role INTO current_user_role
    FROM public.user_roles 
    WHERE user_id = auth.uid();
    
    IF current_user_role != 'admin' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Admin access required');
    END IF;
    
    -- Prevent deletion of admin users
    SELECT role INTO current_user_role
    FROM public.user_roles 
    WHERE user_id = target_user_id;
    
    IF current_user_role = 'admin' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cannot delete admin users');
    END IF;
    
    -- Check if user exists
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = target_user_id) THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;
    
    -- Start cleanup process
    -- Delete user_daily_progress
    DELETE FROM public.user_daily_progress WHERE user_id = target_user_id;
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    IF temp_count > 0 THEN
        tables_cleaned := array_append(tables_cleaned, 'user_daily_progress');
        records_deleted := records_deleted + temp_count;
    END IF;
    
    -- Delete user_spin_attempts
    DELETE FROM public.user_spin_attempts WHERE user_id = target_user_id;
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    IF temp_count > 0 THEN
        tables_cleaned := array_append(tables_cleaned, 'user_spin_attempts');
        records_deleted := records_deleted + temp_count;
    END IF;
    
    -- Delete user_watch_sessions
    DELETE FROM public.user_watch_sessions WHERE user_id = target_user_id;
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    IF temp_count > 0 THEN
        tables_cleaned := array_append(tables_cleaned, 'user_watch_sessions');
        records_deleted := records_deleted + temp_count;
    END IF;
    
    -- Delete user_subscriptions
    DELETE FROM public.user_subscriptions WHERE subscriber_id = target_user_id;
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    IF temp_count > 0 THEN
        tables_cleaned := array_append(tables_cleaned, 'user_subscriptions');
        records_deleted := records_deleted + temp_count;
    END IF;
    
    -- Delete video_favorites
    DELETE FROM public.video_favorites WHERE user_id = target_user_id;
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    IF temp_count > 0 THEN
        tables_cleaned := array_append(tables_cleaned, 'video_favorites');
        records_deleted := records_deleted + temp_count;
    END IF;
    
    -- Delete video_likes
    DELETE FROM public.video_likes WHERE user_id = target_user_id;
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    IF temp_count > 0 THEN
        tables_cleaned := array_append(tables_cleaned, 'video_likes');
        records_deleted := records_deleted + temp_count;
    END IF;
    
    -- Delete video_comments
    DELETE FROM public.video_comments WHERE user_id = target_user_id;
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    IF temp_count > 0 THEN
        tables_cleaned := array_append(tables_cleaned, 'video_comments');
        records_deleted := records_deleted + temp_count;
    END IF;
    
    -- Delete user_badges
    DELETE FROM public.user_badges WHERE user_id = target_user_id;
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    IF temp_count > 0 THEN
        tables_cleaned := array_append(tables_cleaned, 'user_badges');
        records_deleted := records_deleted + temp_count;
    END IF;
    
    -- Delete user_kitty_keys
    DELETE FROM public.user_kitty_keys WHERE user_id = target_user_id;
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    IF temp_count > 0 THEN
        tables_cleaned := array_append(tables_cleaned, 'user_kitty_keys');
        records_deleted := records_deleted + temp_count;
    END IF;
    
    -- Delete user_coins
    DELETE FROM public.user_coins WHERE user_id = target_user_id;
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    IF temp_count > 0 THEN
        tables_cleaned := array_append(tables_cleaned, 'user_coins');
        records_deleted := records_deleted + temp_count;
    END IF;
    
    -- Delete upload_logs
    DELETE FROM public.upload_logs WHERE user_id = target_user_id;
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    IF temp_count > 0 THEN
        tables_cleaned := array_append(tables_cleaned, 'upload_logs');
        records_deleted := records_deleted + temp_count;
    END IF;
    
    -- Delete user_roles
    DELETE FROM public.user_roles WHERE user_id = target_user_id;
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    IF temp_count > 0 THEN
        tables_cleaned := array_append(tables_cleaned, 'user_roles');
        records_deleted := records_deleted + temp_count;
    END IF;
    
    -- Finally delete profile (this will cascade to other references)
    DELETE FROM public.profiles WHERE id = target_user_id;
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    IF temp_count > 0 THEN
        tables_cleaned := array_append(tables_cleaned, 'profiles');
        records_deleted := records_deleted + temp_count;
    END IF;
    
    -- Log the deletion
    INSERT INTO public.upload_logs (user_id, filename, success, upload_type, error_message)
    VALUES (auth.uid(), 'user_deletion', true, 'admin_action', 
            'Deleted user ' || target_user_id || ' - cleaned ' || records_deleted || ' records');
    
    cleanup_result := jsonb_build_object(
        'success', true,
        'message', 'User account deleted successfully',
        'tables_cleaned', tables_cleaned,
        'records_deleted', records_deleted,
        'deleted_user_id', target_user_id
    );
    
    RETURN cleanup_result;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error
        INSERT INTO public.upload_logs (user_id, filename, success, upload_type, error_message)
        VALUES (auth.uid(), 'user_deletion', false, 'admin_action', 
                'Failed to delete user ' || target_user_id || ': ' || SQLERRM);
        
        RETURN jsonb_build_object(
            'success', false, 
            'error', 'Deletion failed: ' || SQLERRM
        );
END;
$$;

-- Grant execute permission to authenticated users (RLS will handle admin check)
GRANT EXECUTE ON FUNCTION public.admin_delete_user(UUID) TO authenticated;