-- Add foreign key relationship between premium_subscription_requests and profiles
ALTER TABLE public.premium_subscription_requests 
ADD CONSTRAINT premium_subscription_requests_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;