-- Add telegram_username column to premium_subscription_requests table
ALTER TABLE public.premium_subscription_requests 
ADD COLUMN telegram_username text;

-- Add index for better performance on telegram username lookups
CREATE INDEX idx_premium_requests_telegram_username 
ON public.premium_subscription_requests(telegram_username) 
WHERE telegram_username IS NOT NULL;