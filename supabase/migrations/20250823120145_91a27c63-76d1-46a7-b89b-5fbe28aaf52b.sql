-- Also update the handle_new_user function to store username in lowercase
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
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
$$;