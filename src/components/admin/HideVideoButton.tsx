import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useVideoStatus } from "@/hooks/useVideoStatus";

interface HideVideoButtonProps {
  videoId: string;
  currentStatus: string;
  onStatusChange?: () => void;
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "lg";
}

const HideVideoButton = ({ 
  videoId, 
  currentStatus, 
  onStatusChange,
  variant = "ghost",
  size = "sm"
}: HideVideoButtonProps) => {
  const { toggleVideoStatus, isLoading } = useVideoStatus();
  
  const isVisible = currentStatus === 'active';
  
  const handleToggle = async () => {
    const success = await toggleVideoStatus(videoId, currentStatus);
    if (success && onStatusChange) {
      onStatusChange();
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleToggle}
            variant={variant}
            size={size}
            disabled={isLoading}
            className="p-1"
          >
            {isVisible ? (
              <Eye className="w-3 h-3" />
            ) : (
              <EyeOff className="w-3 h-3" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isVisible ? "Sembunyikan video" : "Tampilkan video"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default HideVideoButton;