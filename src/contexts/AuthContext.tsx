import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { auth } from '../services/appAuth';
import type { AuthResult } from '../services/credentials';

export type User = { id: string };

type AuthValue = {
  user: User | null;
  // Falso até a leitura da sessão terminar: o RootNavigator mostra ActivityIndicator, nunca
  // o Login por engano.
  hydrated: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  // Senha errada devolve o erro e mantém a sessão; certa apaga a conta e derruba a sessão.
  deleteAccount: (password: string) => Promise<AuthResult>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let alive = true;
    auth
      .restore()
      .then((id) => alive && id && setUser({ id }))
      .catch(() => {})
      .finally(() => alive && setHydrated(true));
    return () => {
      alive = false;
    };
  }, []);

  const enter = useCallback(async (result: AuthResult) => {
    if (result.ok) setUser({ id: result.userId });
    return result;
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => enter(await auth.signIn(email, password)),
    [enter],
  );
  const signUp = useCallback(
    async (email: string, password: string) => enter(await auth.signUp(email, password)),
    [enter],
  );
  const signOut = useCallback(async () => {
    try {
      await auth.signOut();
    } finally {
      setUser(null);
    }
  }, []);

  const userId = user?.id;
  const deleteAccount = useCallback(
    async (password: string): Promise<AuthResult> => {
      if (!userId) return { ok: false, reason: 'invalid-credentials' };
      const result = await auth.deleteAccount(userId, password);
      if (result.ok) setUser(null);
      return result;
    },
    [userId],
  );

  const value = useMemo(
    () => ({ user, hydrated, signIn, signUp, signOut, deleteAccount }),
    [user, hydrated, signIn, signUp, signOut, deleteAccount],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth precisa estar dentro de AuthProvider');
  return value;
}
