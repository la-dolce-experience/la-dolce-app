import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../../../lib/supabase';
import { checkIsAdmin } from '../../../services/adminService';

export type AuthStatus = 'loading' | 'signedOut' | 'notAdmin' | 'admin' | 'error';

interface AuthContextValue {
  status: AuthStatus;
  session: Session | null;
  /** true quando a sessão veio de um link de redefinição de senha. */
  recovery: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [recovery, setRecovery] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    let active = true;

    async function resolve(next: Session | null) {
      if (!active) return;
      setSession(next);
      if (!next) {
        setStatus('signedOut');
        return;
      }
      try {
        // A autorização real é feita pelo banco (RLS); aqui só decidimos qual tela mostrar.
        const admin = await checkIsAdmin();
        if (active) setStatus(admin ? 'admin' : 'notAdmin');
      } catch {
        if (active) setStatus('error');
      }
    }

    supabase.auth.getSession().then(({ data }) => resolve(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
      if (event === 'SIGNED_OUT') setRecovery(false);
      // Evita chamar o Supabase dentro do callback (recomendação da biblioteca).
      setTimeout(() => resolve(next), 0);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut();
    setRecovery(false);
  }, []);

  return <AuthContext.Provider value={{ status, session, recovery, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
