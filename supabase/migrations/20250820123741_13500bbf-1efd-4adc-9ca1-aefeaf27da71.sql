-- Remove the daily favorite task and watch 2 hours task
UPDATE daily_tasks 
SET is_active = false 
WHERE task_key IN ('daily_favorite', 'watch_2hours');