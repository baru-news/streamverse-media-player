import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfileComplete } from '@/hooks/useProfileComplete';
import { Loader2 } from 'lucide-react';

interface ProfileCompleteGuardProps {
  children: React.ReactNode;
}

const ProfileCompleteGuard = ({ children }: ProfileCompleteGuardProps) => {
  const { user, loading: authLoading } = useAuth();
  const { profileComplete, loading: profileLoading } = useProfileComplete();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Skip redirect if we're already on the complete profile page
    if (location.pathname === '/complete-profile') {
      return;
    }

    // Only redirect authenticated users with incomplete profiles
    if (!authLoading && !profileLoading && user && profileComplete === false) {
      navigate('/complete-profile', { replace: true });
    }
  }, [user, profileComplete, authLoading, profileLoading, navigate, location.pathname]);

  // Show loading while checking auth and profile status
  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // If user is authenticated but profile is incomplete and we're not on complete-profile page
  if (user && profileComplete === false && location.pathname !== '/complete-profile') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
};

export default ProfileCompleteGuard;