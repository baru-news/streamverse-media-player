import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useWatchTime = (videoId?: string) => {
  const { user } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [watchTime, setWatchTime] = useState(0);
  const startTimeRef = useRef<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<Date>(new Date());

  // Start tracking watch time
  const startWatchTime = async () => {
    if (!user || !videoId) return;

    try {
      const { data: session, error } = await supabase
        .from('user_watch_sessions')
        .insert({
          user_id: user.id,
          video_id: videoId,
          session_start: new Date().toISOString(),
          watch_duration: 0
        })
        .select()
        .single();

      if (error) throw error;

      setSessionId(session.id);
      startTimeRef.current = new Date();
      lastUpdateRef.current = new Date();

      // Update watch time every 10 seconds
      intervalRef.current = setInterval(() => {
        updateWatchTime();
      }, 10000);

    } catch (error) {
      console.error('Error starting watch session:', error);
    }
  };

  // Update watch time in database
  const updateWatchTime = async () => {
    if (!sessionId || !startTimeRef.current || !user) return;

    const now = new Date();
    const currentWatchTime = Math.floor((now.getTime() - startTimeRef.current.getTime()) / 1000);
    
    setWatchTime(currentWatchTime);

    try {
      // Update session duration
      await supabase
        .from('user_watch_sessions')
        .update({
          watch_duration: currentWatchTime,
          session_end: now.toISOString()
        })
        .eq('id', sessionId);

      // Update task progress every 30 seconds to avoid too many calls
      if (now.getTime() - lastUpdateRef.current.getTime() >= 30000) {
        await supabase.rpc('update_watch_progress', {
          user_id_param: user.id,
          duration_seconds: currentWatchTime
        });
        lastUpdateRef.current = now;
      }

    } catch (error) {
      console.error('Error updating watch time:', error);
    }
  };

  // Stop tracking watch time
  const stopWatchTime = async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (sessionId && startTimeRef.current && user) {
      const finalWatchTime = Math.floor((new Date().getTime() - startTimeRef.current.getTime()) / 1000);
      
      try {
        // Final update
        await supabase
          .from('user_watch_sessions')
          .update({
            watch_duration: finalWatchTime,
            session_end: new Date().toISOString(),
            is_completed: true
          })
          .eq('id', sessionId);

        // Final progress update
        await supabase.rpc('update_watch_progress', {
          user_id_param: user.id,
          duration_seconds: finalWatchTime
        });

      } catch (error) {
        console.error('Error stopping watch session:', error);
      }
    }

    // Reset state
    setSessionId(null);
    setWatchTime(0);
    startTimeRef.current = null;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Auto-start tracking when video and user are available
  useEffect(() => {
    if (user && videoId && !sessionId) {
      startWatchTime();
    }

    return () => {
      if (sessionId) {
        stopWatchTime();
      }
    };
  }, [user, videoId]);

  // Format watch time for display
  const formatWatchTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return {
    watchTime,
    formatWatchTime,
    startWatchTime,
    stopWatchTime,
    isTracking: !!sessionId
  };
};