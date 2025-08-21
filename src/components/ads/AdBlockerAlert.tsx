import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { X, AlertTriangle, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { detectAdBlocker } from '@/lib/image-utils';

interface AdBlockerAlertProps {
  className?: string;
}

export const AdBlockerAlert: React.FC<AdBlockerAlertProps> = ({ className }) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isAdBlockerDetected, setIsAdBlockerDetected] = useState(false);
  const [isDetecting, setIsDetecting] = useState(true);

  useEffect(() => {
    const checkAdBlocker = async () => {
      // Check if user has previously dismissed the alert
      const dismissed = localStorage.getItem('adblocker-alert-dismissed');
      if (dismissed) {
        setIsDismissed(true);
        setIsDetecting(false);
        return;
      }

      try {
        const detected = await detectAdBlocker();
        setIsAdBlockerDetected(detected);
      } catch (error) {
        console.warn('Ad-blocker detection failed:', error);
        // Assume not detected if check fails
        setIsAdBlockerDetected(false);
      } finally {
        setIsDetecting(false);
      }
    };

    // Delay detection slightly to avoid blocking initial page load
    const timer = setTimeout(checkAdBlocker, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('adblocker-alert-dismissed', 'true');
  };

  // Don't show if dismissed, still detecting, or no ad-blocker detected
  if (isDismissed || isDetecting || !isAdBlockerDetected) return null;

  return (
    <Alert className={cn("mb-4 border-orange-200 bg-orange-50 text-orange-800", className)}>
      <Shield className="h-4 w-4" />
      <div className="flex items-center justify-between w-full">
        <AlertDescription className="flex-1 pr-2">
          <strong>Ad-blocker Terdeteksi:</strong> Beberapa konten mungkin tidak muncul karena ekstensi ad-blocker aktif. 
          Untuk pengalaman penuh, silakan matikan ad-blocker atau tambahkan situs ini ke daftar pengecualian.
          <div className="text-xs mt-1 opacity-75">
            Ini membantu kami menyediakan konten gratis untuk Anda.
          </div>
        </AlertDescription>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="h-6 w-6 p-0 text-orange-600 hover:text-orange-800 hover:bg-orange-100"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  );
};