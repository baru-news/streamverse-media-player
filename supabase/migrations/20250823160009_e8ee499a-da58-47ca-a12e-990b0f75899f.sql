-- Create table for premium subscription requests
CREATE TABLE public.premium_subscription_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trakteer_transaction_id TEXT,
  payment_proof_url TEXT,
  amount DECIMAL(10,2) NOT NULL,
  subscription_type TEXT NOT NULL DEFAULT 'lifetime',
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  admin_user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.premium_subscription_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can insert their own requests" 
ON public.premium_subscription_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own requests" 
ON public.premium_subscription_requests 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending requests" 
ON public.premium_subscription_requests 
FOR UPDATE 
USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can manage all requests" 
ON public.premium_subscription_requests 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for timestamps
CREATE TRIGGER update_premium_requests_updated_at
BEFORE UPDATE ON public.premium_subscription_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for better performance
CREATE INDEX idx_premium_requests_status ON public.premium_subscription_requests(status);
CREATE INDEX idx_premium_requests_user_id ON public.premium_subscription_requests(user_id);

-- Create function to approve premium request
CREATE OR REPLACE FUNCTION public.approve_premium_request(request_id UUID, admin_notes_param TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    request_record RECORD;
    admin_role app_role;
BEGIN
    -- Check if current user is admin
    SELECT role INTO admin_role
    FROM public.user_roles 
    WHERE user_id = auth.uid();
    
    IF admin_role != 'admin' THEN
        RETURN FALSE;
    END IF;
    
    -- Get the request details
    SELECT * INTO request_record
    FROM public.premium_subscription_requests
    WHERE id = request_id AND status = 'pending';
    
    IF request_record IS NULL THEN
        RETURN FALSE;
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
    
    RETURN TRUE;
END;
$function$;

-- Create function to reject premium request
CREATE OR REPLACE FUNCTION public.reject_premium_request(request_id UUID, admin_notes_param TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
    
    -- Update request status
    UPDATE public.premium_subscription_requests
    SET 
        status = 'rejected',
        admin_notes = admin_notes_param,
        admin_user_id = auth.uid(),
        processed_at = now(),
        updated_at = now()
    WHERE id = request_id AND status = 'pending';
    
    RETURN FOUND;
END;
$function$;