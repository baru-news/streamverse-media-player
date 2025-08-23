-- Insert telegram bot username setting if it doesn't exist
INSERT INTO public.website_settings (setting_key, setting_value, setting_type)
VALUES ('telegram_bot_username', 'Dino18Premium_Bot', 'text')
ON CONFLICT (setting_key) 
DO UPDATE SET setting_value = 'Dino18Premium_Bot';