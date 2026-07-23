import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const raw = localStorage.getItem('ghina-snack-user');
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('ghina-snack-token'));
  const [loading, setLoading] = useState(true);

  const logout = () => {
    void supabase.auth.signOut();
    localStorage.removeItem('ghina-snack-token');
    localStorage.removeItem('ghina-snack-user');
    setUser(null);
    setToken(null);
  };

  const refreshUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const sessionUser = session.user;
        const authUser: AuthUser = {
          id: sessionUser.id,
          name: sessionUser.user_metadata?.name || 'User',
          email: sessionUser.email || '',
          role: sessionUser.user_metadata?.role || 'ADMIN',
        };
        localStorage.setItem('ghina-snack-token', session.access_token);
        localStorage.setItem('ghina-snack-user', JSON.stringify(authUser));
        setUser(authUser);
        setToken(session.access_token);
      } else {
        localStorage.removeItem('ghina-snack-token');
        localStorage.removeItem('ghina-snack-user');
        setUser(null);
        setToken(null);
      }
    } catch (err) {
      console.error('Error refreshing session:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setToken(null);
        localStorage.removeItem('ghina-snack-token');
        localStorage.removeItem('ghina-snack-user');
      } else if (session?.user) {
        const sessionUser = session.user;
        const authUser: AuthUser = {
          id: sessionUser.id,
          name: sessionUser.user_metadata?.name || 'User',
          email: sessionUser.email || '',
          role: sessionUser.user_metadata?.role || 'ADMIN',
        };
        setUser(authUser);
        setToken(session.access_token);
        localStorage.setItem('ghina-snack-token', session.access_token);
        localStorage.setItem('ghina-snack-user', JSON.stringify(authUser));
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      login: async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        if (data.user) {
          const sessionUser = data.user;
          const authUser: AuthUser = {
            id: sessionUser.id,
            name: sessionUser.user_metadata?.name || 'User',
            email: sessionUser.email || email,
            role: sessionUser.user_metadata?.role || 'ADMIN',
          };

          // Sync profile to public.users table
          await supabase.from('users').upsert({
            id: authUser.id,
            name: authUser.name,
            email: authUser.email,
            role: authUser.role,
            passwordHash: '',
            updatedAt: new Date().toISOString(),
          }, { onConflict: 'email' });

          setUser(authUser);
          setToken(data.session?.access_token || null);
          localStorage.setItem('ghina-snack-token', data.session?.access_token || '');
          localStorage.setItem('ghina-snack-user', JSON.stringify(authUser));
        }
      },
      logout,
      refreshUser,
    }),
    [loading, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
