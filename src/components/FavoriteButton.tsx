import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  videoId: string;
  variant?: 'default' | 'minimal';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

const FavoriteButton = ({ 
  videoId, 
  variant = 'default', 
  size = 'default',
  className 
}: FavoriteButtonProps) => {
  const { user } = useAuth();
  const { isFavorite, toggleFavorite, loading } = useFavorites();
  
  const isUserFavorite = isFavorite(videoId);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      return;
    }

    await toggleFavorite(videoId);
  };

  if (variant === 'minimal') {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={handleToggleFavorite}
        disabled={loading || !user}
        className={cn(
          "h-8 w-8 rounded-full transition-all duration-200",
          isUserFavorite 
            ? "text-red-500 hover:text-red-600 hover:bg-red-50" 
            : "text-muted-foreground hover:text-red-500 hover:bg-red-50",
          !user && "opacity-50 cursor-not-allowed",
          className
        )}
      >
        <Heart 
          className={cn(
            "h-4 w-4 transition-all duration-200",
            isUserFavorite && "fill-current"
          )} 
        />
      </Button>
    );
  }

  return (
    <Button
      variant={isUserFavorite ? "default" : "outline"}
      size={size}
      onClick={handleToggleFavorite}
      disabled={loading || !user}
      className={cn(
        "transition-all duration-200 flex-shrink-0",
        size === "sm" ? "h-9 px-3 text-xs sm:text-sm" : "text-xs sm:text-sm px-2 sm:px-4 h-8 sm:h-10",
        isUserFavorite 
          ? "bg-red-500 hover:bg-red-600 text-background border-red-500" 
          : "hover:border-red-500 hover:text-red-500",
        !user && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <Heart 
        className={cn(
          "w-4 h-4 mr-1 sm:mr-2 transition-all duration-200",
          isUserFavorite && "fill-current"
        )} 
      />
      <span className="hidden sm:inline">
        {isUserFavorite ? 'Hapus Favorit' : 'Tambah Favorit'}
      </span>
      <span className="sm:hidden">
        {isUserFavorite ? 'Hapus' : 'Favorit'}
      </span>
    </Button>
  );
};

export default FavoriteButton;