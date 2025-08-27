-- PHASE 1: SIMPLE TELEGRAM BOT DATA CLEANUP
-- Clear all telegram-related data to start fresh

-- 1. Clear telegram uploads
TRUNCATE TABLE public.telegram_uploads RESTART IDENTITY CASCADE;

-- 2. Clear telegram link codes  
TRUNCATE TABLE public.telegram_link_codes RESTART IDENTITY CASCADE;

-- 3. Clear admin telegram users
TRUNCATE TABLE public.admin_telegram_users RESTART IDENTITY CASCADE;

-- 4. Clear premium groups
TRUNCATE TABLE public.premium_groups RESTART IDENTITY CASCADE;

-- 5. Clear telegram invitations
TRUNCATE TABLE public.telegram_invitations RESTART IDENTITY CASCADE;

-- 6. Reset telegram fields in profiles
UPDATE public.profiles 
SET telegram_user_id = NULL, 
    telegram_username = NULL, 
    telegram_chat_id = NULL
WHERE telegram_user_id IS NOT NULL OR telegram_username IS NOT NULL OR telegram_chat_id IS NOT NULL;

-- 7. Clear any pending upload failures related to telegram
DELETE FROM public.upload_failures 
WHERE upload_type LIKE '%telegram%' OR error_details::text LIKE '%telegram%';