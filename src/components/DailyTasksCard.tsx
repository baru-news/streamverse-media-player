import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useDailyTasks } from '@/hooks/useDailyTasks';
import { CheckCircle, Clock, Target, Coins } from 'lucide-react';
import { cn } from '@/lib/utils';

export const DailyTasksCard = () => {
  const { tasks, loading, getCompletedTasksCount, getTotalTasksCount } = useDailyTasks();

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