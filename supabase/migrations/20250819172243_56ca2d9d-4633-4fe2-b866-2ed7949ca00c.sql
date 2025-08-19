-- Create a manual admin setup helper
-- Note: You'll need to register manually first, then we'll make that account admin

-- First, let's see what users exist and their roles
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Check if there are any existing admin users
    SELECT user_id INTO admin_user_id 
    FROM public.user_roles 
    WHERE role = 'admin'::app_role 
    LIMIT 1;
    
    IF admin_user_id IS NOT NULL THEN
        RAISE NOTICE 'Admin user already exists with ID: %', admin_user_id;
    ELSE
        RAISE NOTICE 'No admin user found. Please register an account first, then run the admin assignment.';
    END IF;
END $$;

-- Create a function to make any user admin (to be used after manual registration)
CREATE OR REPLACE FUNCTION public.make_user_admin(user_email TEXT)
RETURNS BOOLEAN AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;