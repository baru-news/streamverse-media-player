-- Add Telegram fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN telegram_user_id BIGINT,
ADD COLUMN telegram_chat_id BIGINT,
ADD COLUMN telegram_username TEXT;

-- Create telegram_invitations table to track invitations
CREATE TABLE public.telegram_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  telegram_user_id BIGINT NOT NULL,
  chat_id BIGINT NOT NULL,
  invitation_status TEXT NOT NULL DEFAULT 'pending' CHECK (invitation_status IN ('pending', 'sent', 'joined', 'failed')),
  invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  joined_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on telegram_invitations
ALTER TABLE public.telegram_invitations ENABLE ROW LEVEL SECURITY;

-- Create policies for telegram_invitations
CREATE POLICY "Admins can manage telegram invitations"
ON public.telegram_invitations
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own telegram invitations"
ON public.telegram_invitations
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Add trigger for updated_at
CREATE TRIGGER update_telegram_invitations_updated_at
BEFORE UPDATE ON public.telegram_invitations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to invite user to telegram group
CREATE OR REPLACE FUNCTION public.invite_user_to_telegram(
  user_id_param UUID,
  telegram_user_id_param BIGINT,
  chat_id_param BIGINT
) 
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_role app_role;
BEGIN
  -- Check if current user is admin
  SELECT role INTO admin_role
  FROM public.user_roles 
  WHERE user_id = auth.uid();
  
  IF admin_role != 'admin' THEN
    RETURN FALSE;
  END IF;
  
  -- Insert invitation record
  INSERT INTO public.telegram_invitations (
    user_id,
    telegram_user_id,
    chat_id,
    invitation_status
  ) VALUES (
    user_id_param,
    telegram_user_id_param,
    chat_id_param,
    'pending'
  );
  
  RETURN TRUE;
END;
$$;