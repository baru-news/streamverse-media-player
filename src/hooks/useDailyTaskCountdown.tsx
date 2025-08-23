import { useState, useEffect } from 'react';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

interface CountdownTime {
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
}

const JAKARTA_TIMEZONE = 'Asia/Jakarta';

export const useDailyTaskCountdown = () => {
  const [timeLeft, setTimeLeft] = useState<CountdownTime>({ hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 });

  const calculateTimeUntilMidnightWIB = (): CountdownTime => {
    try {
      const now = new Date();
      
      // Get current time in Jakarta timezone
      const wibTime = toZonedTime(now, JAKARTA_TIMEZONE);
      
      // Get next midnight in Jakarta timezone
      const nextMidnightWIB = new Date(wibTime);
      nextMidnightWIB.setDate(wibTime.getDate() + 1);
      nextMidnightWIB.setHours(0, 0, 0, 0);
      
      // Calculate time difference
      const timeDiff = nextMidnightWIB.getTime() - wibTime.getTime();
      
      if (timeDiff <= 0) {
        return { hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 };
      }
      
      const totalSeconds = Math.floor(timeDiff / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      
      return { hours, minutes, seconds, totalSeconds };
    } catch (error) {
      console.error('Error calculating countdown:', error);
      return { hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 };
    }
  };

  useEffect(() => {
    const updateCountdown = () => {
      setTimeLeft(calculateTimeUntilMidnightWIB());
    };

    // Update immediately
    updateCountdown();

    // Update every second
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (time: number): string => {
    return time.toString().padStart(2, '0');
  };

  const getFormattedCountdown = (): string => {
    if (timeLeft.totalSeconds === 0) {
      return "Tasks Reset!";
    }
    
    return `${formatTime(timeLeft.hours)}:${formatTime(timeLeft.minutes)}:${formatTime(timeLeft.seconds)}`;
  };

  const getProgressPercentage = (): number => {
    const totalSecondsInDay = 24 * 60 * 60;
    const secondsPassed = totalSecondsInDay - timeLeft.totalSeconds;
    return Math.max(0, Math.min(100, (secondsPassed / totalSecondsInDay) * 100));
  };

  return {
    timeLeft,
    getFormattedCountdown,
    getProgressPercentage,
    isResetting: timeLeft.totalSeconds === 0
  };
};