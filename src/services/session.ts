import type { AuthResult } from './credentials.ts';

type SessionKV = {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<void>;
  remove: (key: string) => Promise<void>;
};

type Credentials = {
  register: (email: string, password: string) => Promise<AuthResult>;
  login: (email: string, password: string) => Promise<AuthResult>;
};

const KEY = 'rl.session';

// Sessão é só o userId no SecureStore. Logout apaga a chave; quem decide a tela é o estado do
// AuthContext, nunca um navigate('Login').
export function createAuth({ credentials, kv }: { credentials: Credentials; kv: SessionKV }) {
  const open = async (result: AuthResult) => {
    if (result.ok) await kv.set(KEY, result.userId);
    return result;
  };

  return {
    restore: () => kv.get(KEY),
    signIn: async (email: string, password: string) =>
      open(await credentials.login(email, password)),
    signUp: async (email: string, password: string) =>
      open(await credentials.register(email, password)),
    signOut: () => kv.remove(KEY),
  };
}
