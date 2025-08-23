import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, username?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const checkAdminRole = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .single();
      
      setIsAdmin(!!data);
    } catch (error) {
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            checkAdminRole(session.user.id);
          }, 0);
        } else {
          setIsAdmin(false);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        checkAdminRole(session.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, username?: string) => {
    try {
      // Check if username already exists in profiles table (if provided)
      if (username && username.trim()) {
        const { data: existingUsername } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', username.trim())
          .maybeSingle();
          
        if (existingUsername) {
          toast.error('Username sudah digunakan. Silakan pilih username lain.');
          return { error: { message: 'Username sudah digunakan' } };
        }
      }

      // Check if email already exists by checking profiles table
      const { data: existingEmail } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();
        
      if (existingEmail) {
        toast.error('Email sudah terdaftar. Silakan gunakan email lain atau login.');
        return { error: { message: 'Email sudah terdaftar' } };
      }
      
      // Proceed with signup
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            username: username || ''
          }
        }
      });

      // Check if user was created but needs confirmation
      if (data?.user && !data?.session && !error) {
        // User needs to confirm email
        return { error: null };
      }

      // Check if user already exists (Supabase sometimes returns this in data.user)
      if (data?.user && data?.user?.email_confirmed_at && !data?.session) {
        toast.error('Email sudah terdaftar. Silakan gunakan email lain atau login.');
        return { error: { message: 'Email sudah terdaftar' } };
      }

      if (error) {
        // Handle specific signup errors
        if (error.message.includes('User already registered') || 
            error.message.includes('already been registered') ||
            error.message.includes('duplicate') ||
            error.message.includes('already exists')) {
          toast.error('Email sudah terdaftar. Silakan gunakan email lain atau login.');
        } else if (error.message.includes('email')) {
          toast.error('Email sudah terdaftar. Silakan gunakan email lain atau login.');
        } else {
          toast.error(error.message);
        }
        return { error };
      }

      // Return success without showing toast here
      return { error: null };
      
    } catch (err) {
      console.error('Signup error:', err);
      toast.error('Terjadi kesalahan saat mendaftarkan akun');
      return { error: err };
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Berhasil masuk!');
    }

    return { error };
  };

  const signOut = async () => {
    try {
      // Clear local state first to ensure immediate UI update
      setUser(null);
      setSession(null);
      setIsAdmin(false);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Logout error:', error);
        // Still show success message as local state is cleared
        toast.success('Berhasil keluar');
      } else {
        toast.success('Berhasil keluar');
      }
    } catch (error) {
      console.error('Unexpected logout error:', error);
      toast.success('Berhasil keluar');
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signUp,
      signIn,
      signOut,
      isAdmin
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};