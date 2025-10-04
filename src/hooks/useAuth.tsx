import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Ensures a profile row exists for the current user and backfills totals
  const ensureProfileExists = async (u: User) => {
    try {
      const { data: existing, error: existingError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', u.id)
        .maybeSingle();

      if (existingError) throw existingError;

      if (!existing) {
        // Backfill totals from existing emissions
        const { data: emissions, error: emissionsError } = await supabase
          .from('carbon_emissions')
          .select('carbon_amount, green_points_earned')
          .eq('user_id', u.id);

        if (emissionsError) throw emissionsError;

        const totals = (emissions || []).reduce(
          (acc, e: any) => {
            acc.carbon += Number(e.carbon_amount || 0);
            acc.points += Number(e.green_points_earned || 0);
            return acc;
          },
          { carbon: 0, points: 0 }
        );

        await supabase.from('profiles').insert({
          user_id: u.id,
          display_name: (u.user_metadata as any)?.display_name || (u.email ? String(u.email).split('@')[0] : 'User'),
          show_on_leaderboard: true,
          total_carbon_footprint: totals.carbon,
          total_green_points: totals.points,
        });
      }
    } catch (err) {
      // Silently ignore to not block app load
      console.warn('ensureProfileExists skipped:', err);
    }
  };

  useEffect(() => {
    const handleSession = async (sess: Session | null) => {
      setSession(sess);
      const u = sess?.user ?? null;
      setUser(u);
      if (u) {
        await ensureProfileExists(u);
      }
      setLoading(false);
    };

    // Auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      handleSession(sess);
    });

    // Initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
