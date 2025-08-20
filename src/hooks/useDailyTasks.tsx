import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface DailyTask {
  id: string;
  task_key: string;
  title: string;
  description: string | null;
  task_type: string;
  target_value: number;
  reward_coins: number;
  is_active: boolean;
}

interface TaskProgress {
  id: string;
  user_id: string;
  task_key: string;
  progress_value: number;
  is_completed: boolean;
  completed_at: string | null;
  task_date: string;
}

interface TaskWithProgress extends DailyTask {
  progress?: TaskProgress;
  progress_percentage: number;
}

export const useDailyTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTasks();
      
      // Subscribe to progress updates
      const channel = supabase
        .channel('task_progress_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_daily_progress',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            fetchTasks();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchTasks = async () => {
    if (!user) return;

    try {
      // Fetch all active daily tasks
      const { data: dailyTasks, error: tasksError } = await supabase
        .from('daily_tasks')
        .select('*')
        .eq('is_active', true)
        .order('task_type', { ascending: true })
        .order('target_value', { ascending: true });

      if (tasksError) throw tasksError;

      // Fetch today's progress for the user
      const today = new Date().toISOString().split('T')[0];
      const { data: progress, error: progressError } = await supabase
        .from('user_daily_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('task_date', today);

      if (progressError) throw progressError;

      // Combine tasks with progress
      const tasksWithProgress: TaskWithProgress[] = dailyTasks.map(task => {
        const taskProgress = progress?.find(p => p.task_key === task.task_key);
        const progressValue = taskProgress?.progress_value || 0;
        const progressPercentage = Math.min((progressValue / task.target_value) * 100, 100);

        return {
          ...task,
          progress: taskProgress,
          progress_percentage: progressPercentage
        };
      });

      setTasks(tasksWithProgress);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskProgress = async (taskKey: string, progressValue: number) => {
    if (!user) return;

    const task = tasks.find(t => t.task_key === taskKey);
    if (!task) return;

    try {
      // Check if task is already completed today
      const today = new Date().toISOString().split('T')[0];
      const { data: existingProgress } = await supabase
        .from('user_daily_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('task_key', taskKey)
        .eq('task_date', today)
        .maybeSingle();

      // If task is already completed, don't update to avoid duplicates
      if (existingProgress?.is_completed) {
        console.log(`Task ${taskKey} already completed today`);
        return;
      }

      const currentProgress = existingProgress?.progress_value || 0;
      const newProgress = Math.min(currentProgress + progressValue, task.target_value);
      const isCompleted = newProgress >= task.target_value;
      const wasAlreadyCompleted = existingProgress?.is_completed || false;
      
      const { error } = await supabase
        .from('user_daily_progress')
        .upsert({
          user_id: user.id,
          task_key: taskKey,
          progress_value: newProgress,
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null,
          task_date: today
        });

      if (error) {
        console.error('Error updating task progress:', error);
        return;
      }
      
      // Show completion message only if task was just completed (not already completed)
      if (isCompleted && !wasAlreadyCompleted) {
        toast.success(`Task completed! +${task.reward_coins} coins!`);
      }
      
      // Refresh tasks to get updated progress
      await fetchTasks();
    } catch (error) {
      console.error('Error updating task progress:', error);
    }
  };

  const completeTask = async (taskKey: string) => {
    if (!user) return;

    const task = tasks.find(t => t.task_key === taskKey);
    if (!task) return;

    try {
      const { error } = await supabase
        .from('user_daily_progress')
        .upsert({
          user_id: user.id,
          task_key: taskKey,
          progress_value: task.target_value,
          is_completed: true,
          completed_at: new Date().toISOString(),
          task_date: new Date().toISOString().split('T')[0]
        });

      if (error) throw error;
      
      toast.success(`Task completed! +${task.reward_coins} coins!`);
      await fetchTasks();
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const getCompletedTasksCount = () => {
    return tasks.filter(task => task.progress?.is_completed).length;
  };

  const getTotalTasksCount = () => {
    return tasks.length;
  };

  return {
    tasks,
    loading,
    updateTaskProgress,
    completeTask,
    refreshTasks: fetchTasks,
    getCompletedTasksCount,
    getTotalTasksCount
  };
};