-- Fix data inconsistency: mark tasks as completed if progress >= target
UPDATE user_daily_progress 
SET 
  is_completed = true,
  completed_at = COALESCE(completed_at, updated_at, created_at)
WHERE 
  is_completed = false 
  AND progress_value >= (
    SELECT target_value 
    FROM daily_tasks 
    WHERE daily_tasks.task_key = user_daily_progress.task_key 
    AND is_active = true
  );