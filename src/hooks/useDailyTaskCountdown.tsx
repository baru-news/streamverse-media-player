import { useState, useEffect } from 'react';

interface CountdownTime {
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
}

export const useDailyTaskCountdown = () => {
  const [timeLeft, setTimeLeft] = useState<CountdownTime>({ hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 });

  const calculateTimeUntilMidnightWIB = (): CountdownTime => {
    const now = new Date();
    
    // Create WIB time (UTC+7) - simple and direct approach
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const wibTime = new Date(utcTime + (7 * 60 * 60 * 1000));
    
    // Get next midnight WIB
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