import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdBlockerAlertProps {
  className?: string;
}

export const AdBlockerAlert: React.FC<AdBlockerAlertProps> = ({ className }) => {
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if user has previously dismissed the alert
    const dismissed = localStorage.getItem('adblocker-alert-dismissed');
    if (dismissed) {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('adblocker-alert-dismissed', 'true');
  };

  if (isDismissed) return null;

  return (
    <Alert className={cn("mb-4 border-orange-200 bg-orange-50 text-orange-800", className)}>
      <AlertTriangle className="h-4 w-4" />
      <div className="flex items-center justify-between w-full">
        <AlertDescription className="flex-1 pr-2">
          <strong>Perhatian:</strong> Sebagian gambar mungkin tidak muncul karena ekstensi ad-blocker. 
          Mohon matikan ad-blocker Anda untuk pengalaman penuh di situs ini.
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