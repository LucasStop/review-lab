import type { AuthResult } from './credentials.ts';

type SessionKV = {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<void>;
  remove: (key: string) => Promise<void>;
};

type Credentials = {
  register: (email: string, password: string) => Promise<AuthResult>;
  login: (email: string, password: string) => Promise<AuthResult>;
  verify: (userId: string, password: string) => Promise<AuthResult>;
  remove: (userId: string) => Promise<void>;
};

const KEY = 'rl.session';

// Sessão é só o userId no SecureStore. Logout apaga a chave; quem decide a tela é o estado do
// AuthContext, nunca um navigate('Login').
export function createAuth({
  credentials,
  kv,
  removeUserData,
}: {
  credentials: Credentials;
  kv: SessionKV;
  // Apaga as chaves `rl.<userId>.*` (favoritos, estudados) só desse usuário.
  removeUserData: (userId: string) => Promise<void>;
}) {
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
    // Senha errada não apaga nada. A credencial sai por último: se algo falhar no meio, ela
    // continua lá e dá para entrar de novo e repetir a exclusão.
    deleteAccount: async (userId: string, password: string): Promise<AuthResult> => {
      const checked = await credentials.verify(userId, password);
      if (!checked.ok) return checked;
      await removeUserData(userId);
      await kv.remove(KEY);
      await credentials.remove(userId);
      return checked;
    },
  };
}
