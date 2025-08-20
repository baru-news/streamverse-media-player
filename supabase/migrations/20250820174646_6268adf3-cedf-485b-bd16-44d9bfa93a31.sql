-- Update the watch 1 hour task to share task
UPDATE public.daily_tasks 
SET 
  task_key = 'daily_share',
  title = 'Bagikan Video',
  description = 'Bagikan video ke media sosial',
  task_type = 'share',
  target_value = 1,
  reward_coins = 75
WHERE task_key = 'watch_60min';

-- Update other task titles to Indonesian
UPDATE public.daily_tasks 
SET 
  title = 'Masuk Harian',
  description = 'Masuk ke akun Anda'
WHERE task_key = 'daily_login';

UPDATE public.daily_tasks 
SET 
  title = 'Sukai Video',
  description = 'Sukai sebuah video'
WHERE task_key = 'daily_like';

UPDATE public.daily_tasks 
SET 
  title = 'Berikan Komentar',
  description = 'Komentari sebuah video'
WHERE task_key = 'daily_comment';

UPDATE public.daily_tasks 
SET 
  title = 'Tonton 10 Menit',
  description = 'Tonton video selama 10 menit'
WHERE task_key = 'watch_10min';

UPDATE public.daily_tasks 
SET 
  title = 'Tonton 30 Menit',
  description = 'Tonton video selama 30 menit'
WHERE task_key = 'watch_30min';