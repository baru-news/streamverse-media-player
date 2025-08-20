import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useDailyTasks } from '@/hooks/useDailyTasks';
import { useDailyTaskCountdown } from '@/hooks/useDailyTaskCountdown';
import { useSpinWheel } from '@/hooks/useSpinWheel';
import { CheckCircle, Clock, Target, Coins, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';

export const DailyTasksCard = () => {
  const { tasks, loading, getCompletedTasksCount, getTotalTasksCount, refreshTasks } = useDailyTasks();
  const { getFormattedCountdown, getProgressPercentage, isResetting } = useDailyTaskCountdown();
  const { canSpin, todayAttempts } = useSpinWheel();

  // Refresh tasks when countdown reaches zero (reset time)
  useEffect(() => {
    if (isResetting) {
      const timer = setTimeout(() => {
        refreshTasks();
      }, 1000); // Wait 1 second after reset to refresh
      
      return () => clearTimeout(timer);
    }
  }, [isResetting, refreshTasks]);

  const formatTaskType = (type: string) => {
    switch (type) {
      case 'login': return 'Daily';
      case 'watch_time': return 'Watch Time';
      case 'community': return 'Community';
      default: return type;
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h`;
  };

  const formatProgressText = (task: any) => {
    if (task.task_type === 'watch_time') {
      const current = task.progress?.progress_value || 0;
      const target = task.target_value;
      return `${formatDuration(current)} / ${formatDuration(target)}`;
    }
    
    const current = task.progress?.progress_value || 0;
    const target = task.target_value;
    return `${current} / ${target}`;
  };

  if (loading) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Daily Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded mb-2" />
                <div className="h-2 bg-muted rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const completedCount = getCompletedTasksCount();
  const totalCount = getTotalTasksCount();
  const allTasksCompleted = totalCount > 0 && completedCount === totalCount;
  const hasSpunToday = todayAttempts.length > 0;

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Daily Tasks
          </div>
          <Badge variant="outline" className="text-xs">
            {completedCount}/{totalCount}
          </Badge>
        </CardTitle>
        
        {/* Countdown Section */}
        <div className="mt-3 p-3 bg-muted/20 rounded-lg border border-border/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Reset dalam:</span>
            </div>
            <div className={cn(
              "text-sm font-mono font-bold px-2 py-1 rounded",
              isResetting 
                ? "text-green-400 bg-green-500/20" 
                : "text-primary bg-primary/10"
            )}>
              {getFormattedCountdown()}
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Task completion</span>
              <span>{Math.round((completedCount / Math.max(totalCount, 1)) * 100)}%</span>
            </div>
            <Progress 
              value={(completedCount / Math.max(totalCount, 1)) * 100} 
              className="h-1.5"
            />
          </div>
          
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Semua tugas akan reset pada jam 12:00 WIB
          </p>
        </div>

        {/* Spin Wheel Status */}
        {allTasksCompleted && (
          <div className="mt-3 p-3 bg-gradient-to-r from-pink-50 to-pink-100 border border-pink-200 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-pink-600">🎀</span>
              {hasSpunToday ? (
                <span className="text-pink-700 font-medium">Lucky wheel completed today! ✨</span>
              ) : canSpin ? (
                <span className="text-pink-700 font-medium animate-pulse">Lucky wheel unlocked! Click the wheel button! 🎡</span>
              ) : (
                <span className="text-pink-600">Lucky wheel available soon... 🌸</span>
              )}
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tasks.map((task) => (
            <div key={task.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {task.progress?.is_completed ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <Clock className="w-4 h-4 text-muted-foreground" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatTaskType(task.task_type)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-xs text-yellow-600">
                    <Coins className="w-3 h-3" />
                    {task.reward_coins}
                  </div>
                  <Badge 
                    variant={task.progress?.is_completed ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {task.progress?.is_completed ? "Complete" : "Pending"}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatProgressText(task)}</span>
                  <span>{Math.round(task.progress_percentage)}%</span>
                </div>
                <Progress 
                  value={task.progress_percentage} 
                  className={cn(
                    "h-2",
                    task.progress?.is_completed && "bg-green-200"
                  )}
                />
              </div>
            </div>
          ))}
          
          {tasks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No daily tasks available</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};