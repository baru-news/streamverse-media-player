import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDailyTasks } from '@/hooks/useDailyTasks';
import { useDailyTaskCountdown } from '@/hooks/useDailyTaskCountdown';
import { useSpinWheel } from '@/hooks/useSpinWheel';
import { CheckCircle, Clock, Target, Coins, Timer, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';

export const DailyTasksCard = () => {
  const { 
    tasks, 
    loading, 
    canClaim,
    claimKittyKey,
    getCompletedTasksCount, 
    getTotalTasksCount, 
    refreshTasks 
  } = useDailyTasks();
  const { getFormattedCountdown, getProgressPercentage, isResetting } = useDailyTaskCountdown();
  const { canSpin } = useSpinWheel();

  // Refresh tasks when countdown reaches zero (reset time)
  useEffect(() => {
    if (isResetting) {
      const timer = setTimeout(() => {
        refreshTasks();
      }, 2000); // Wait 2 seconds to ensure reset is complete
      
      return () => clearTimeout(timer);
    }
  }, [isResetting, refreshTasks]);

  const formatTaskType = (type: string) => {
    switch (type) {
      case 'login': return 'Harian';
      case 'watch_time': return 'Waktu Tonton';
      case 'community': return 'Komunitas';
      case 'share': return 'Berbagi';
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
            Tugas Harian
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

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Tugas Harian
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
              <span>Penyelesaian tugas</span>
              <span>{Math.round((completedCount / Math.max(totalCount, 1)) * 100)}%</span>
            </div>
            <Progress 
              value={(completedCount / Math.max(totalCount, 1)) * 100} 
              className="h-1.5"
            />
          </div>
          
          {/* Kitty Key Claim Section */}
          {getTotalTasksCount() > 0 && (
            <div className={cn(
              "mt-4 p-4 border rounded-lg transition-all duration-300",
              getCompletedTasksCount() === getTotalTasksCount() 
                ? "bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200" 
                : "bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200"
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gift className={cn(
                    "w-5 h-5 transition-colors",
                    getCompletedTasksCount() === getTotalTasksCount() 
                      ? "text-yellow-600" 
                      : "text-gray-400"
                  )} />
                  <div>
                    <h3 className={cn(
                      "font-bold transition-colors",
                      getCompletedTasksCount() === getTotalTasksCount() 
                        ? "text-yellow-800" 
                        : "text-gray-600"
                    )}>
                      Bonus Kitty Key! 🗝️
                    </h3>
                    <p className={cn(
                      "text-sm transition-colors",
                      getCompletedTasksCount() === getTotalTasksCount() 
                        ? "text-yellow-700" 
                        : "text-gray-500"
                    )}>
                      {getCompletedTasksCount() === getTotalTasksCount() 
                        ? "Semua tugas selesai, klaim Kitty Key sekarang!"
                        : `Selesaikan ${getTotalTasksCount() - getCompletedTasksCount()} tugas lagi untuk mengklaim`
                      }
                    </p>
                  </div>
                </div>
                <Button
                  onClick={claimKittyKey}
                  disabled={getCompletedTasksCount() !== getTotalTasksCount() || !canClaim}
                  className={cn(
                    "font-bold px-4 py-2 rounded-lg shadow-lg transition-all",
                    getCompletedTasksCount() === getTotalTasksCount() && canClaim
                      ? "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  )}
                >
                  {getCompletedTasksCount() === getTotalTasksCount() ? (
                    canClaim ? (
                      <>
                        <Gift className="w-4 h-4 mr-2" />
                        Claim 🗝️
                      </>
                    ) : (
                      'Sudah Diklaim'
                    )
                  ) : (
                    <>
                      <Gift className="w-4 h-4 mr-2 opacity-50" />
                      Belum Siap
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground mt-2 text-center">
            Semua tugas akan reset pada jam 00:00 WIB (tengah malam)
          </p>
        </div>

        {/* Spin Wheel Status */}
        {allTasksCompleted && (
          <div className="mt-3 p-3 bg-gradient-to-r from-pink-50 to-pink-100 border border-pink-200 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-pink-600">🎀</span>
              {canSpin ? (
                <span className="text-pink-700 font-medium animate-pulse">Roda beruntung tersedia! Kumpulkan Kitty Key! 🎡</span>
              ) : (
                <span className="text-pink-600">Kumpulkan Kitty Key untuk bermain roda beruntung! 🌸</span>
              )}
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[200px] sm:h-[300px] md:h-[400px] p-4 touch-pan-y">
          <div className="space-y-4 pb-4">
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
                      {task.progress?.is_completed ? "Selesai" : "Menunggu"}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progres</span>
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
                <p className="text-sm">Tidak ada tugas harian tersedia</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};