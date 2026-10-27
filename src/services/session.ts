import { normalizeEmail, type AuthResult } from './credentials.ts';

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

// O e-mail só serve para o Perfil mostrar; fica aqui porque o SecureStore é cifrado.
export type Session = { userId: string; email?: string };

const isUserId = (value: unknown): value is string =>
  typeof value === 'string' && /^[0-9a-f]{64}$/.test(value);

// Aceita o formato antigo (#32, só o userId) e o JSON novo. O antigo é conferido no texto cru:
// um userId só com dígitos viraria número no JSON.parse. Qualquer outra coisa é "sem sessão".
export function parseSession(raw: string | null): Session | null {
  if (raw === null) return null;
  if (isUserId(raw)) return { userId: raw };
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null) return null;
    const { userId, email } = value as Record<string, unknown>;
    if (!isUserId(userId)) return null;
    return typeof email === 'string' ? { userId, email } : { userId };
  } catch {
    return null;
  }
}

// Sessão é o userId e o e-mail no SecureStore. Logout apaga a chave; quem decide a tela é o
// estado do AuthContext, nunca um navigate('Login').
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
  const open = async (result: AuthResult, email: string) => {
    if (result.ok) {
      const session: Session = { userId: result.userId, email: normalizeEmail(email) };
      await kv.set(KEY, JSON.stringify(session));
    }
    return result;
  };

  return {
    restore: async () => parseSession(await kv.get(KEY)),
    signIn: async (email: string, password: string) =>
      open(await credentials.login(email, password), email),
    signUp: async (email: string, password: string) =>
      open(await credentials.register(email, password), email),
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
