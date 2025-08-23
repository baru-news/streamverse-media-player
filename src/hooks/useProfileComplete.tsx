import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useProfileComplete = () => {
  const { user, loading: authLoading } = useAuth();
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkProfileComplete = async () => {
      if (!user) {
        setProfileComplete(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('profile_complete, username')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error checking profile completion:', error);
          setProfileComplete(true); // Default to complete to avoid blocking
          return;
        }

        // Consider profile complete if the field is true AND username exists
        const isComplete = Boolean(data.profile_complete && data.username);
        setProfileComplete(isComplete);
      } catch (error) {
        console.error('Error in profile completion check:', error);
        setProfileComplete(true); // Default to complete to avoid blocking
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      checkProfileComplete();
    }
  }, [user, authLoading]);

  return {
    profileComplete,
    loading: loading || authLoading,
    refetch: () => {
      if (user) {
        setLoading(true);
        // Re-trigger the effect by updating a dependency
      }
    }
  };
};