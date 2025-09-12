import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export type Profile = {
  id: string;
  username: string;
  role: 'member' | 'leader';
  approved: boolean;
};

type Ctx = {
  session: import('@supabase/supabase-js').Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signUp: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isLeader: boolean;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<Ctx | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const value = useAuthStore();
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): Ctx {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

function emailFromUsername(username: string) {
  // Use a valid public TLD to satisfy Supabase email validation.
  // Recommend disabling "Email confirmations" in Supabase if you don't own this domain.
  return `${username}@example.com`;
}

function useAuthStore(): Ctx {
  const [session, setSession] = useState<import('@supabase/supabase-js').Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (!s) setProfile(null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    refreshProfile();
  }, [session?.user.id]);

  const refreshProfile = async () => {
    const user = session?.user;
    if (!user) return;
    const { data } = await supabase.from('profiles').select('id, username, role, approved').eq('id', user.id).maybeSingle();
    if (data) setProfile(data as Profile);
  };

  const signIn = async (username: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email: emailFromUsername(username), password });
    if (error) throw error;
    // Ensure profile exists for older accounts or manual inserts
    await ensureProfile(username);
  };

  const signUp = async (username: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email: emailFromUsername(username), password });
    if (error) throw error;
    const user = data.user;
    if (user) {
      await supabase.from('profiles').upsert({ id: user.id, username }, { onConflict: 'id', ignoreDuplicates: true });
      await refreshProfile();
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut({ scope: 'global' });
    } catch (err: any) {
      if ((err as any)?.code !== 'session_not_found') {
        // eslint-disable-next-line no-console
        console.warn('signOut(global) failed, falling back to local', err);
      }
    } finally {
      await supabase.auth.signOut({ scope: 'local' });
      setProfile(null);
      // Listener will null session, but clear eagerly for UX
      setSession(null);
    }
  };

  const isLeader = profile?.role === 'leader';

  return { session, profile, loading, signIn, signUp, signOut, isLeader, refreshProfile };
}

async function ensureProfile(username: string) {
  const { data: sess } = await supabase.auth.getUser();
  const uid = sess.user?.id;
  if (!uid) return;
  const { data } = await supabase.from('profiles').select('id').eq('id', uid).maybeSingle();
  if (!data) {
    await supabase.from('profiles').upsert({ id: uid, username }, { onConflict: 'id', ignoreDuplicates: true });
  }
}
