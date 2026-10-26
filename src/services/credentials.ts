// Lógica pura de cadastro e login. Armazenamento, SHA-256 e salt entram por parâmetro, para
// rodar nos testes sem módulo nativo; a ligação com expo-crypto e expo-secure-store fica em
// secureCredentials.ts.

export type SecureKV = {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<void>;
  remove: (key: string) => Promise<void>;
};

export type Deps = {
  kv: SecureKV;
  sha256: (text: string) => Promise<string>;
  randomSalt: () => Promise<string>;
};

export type AuthResult =
  | { ok: true; userId: string }
  | { ok: false; reason: 'invalid-input' | 'email-taken' | 'invalid-credentials' };

// Piso aceito pelo ADR 0003: expo-crypto não expõe PBKDF2. Cada volta é uma chamada nativa.
const ITERATIONS = 2000;
const MIN_PASSWORD = 6;

export async function hashPassword(
  password: string,
  salt: string,
  iterations: number,
  sha256: Deps['sha256'],
): Promise<string> {
  let hash = await sha256(`${salt}:${password}`);
  for (let i = 1; i < iterations; i++) hash = await sha256(`${hash}:${salt}`);
  return hash;
}

function sameHash(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function createCredentials({ kv, sha256, randomSalt }: Deps) {
  const normalize = (email: string) => email.trim().toLowerCase();
  // SecureStore só aceita [A-Za-z0-9._-] em chave; o hash do e-mail também serve de userId
  // e evita e-mail em texto puro no storage.
  const userIdOf = (email: string) => sha256(normalize(email));

  async function register(email: string, password: string): Promise<AuthResult> {
    if (!normalize(email).includes('@') || password.length < MIN_PASSWORD) {
      return { ok: false, reason: 'invalid-input' };
    }
    const userId = await userIdOf(email);
    const key = `rl.cred.${userId}`;
    if (await kv.get(key)) return { ok: false, reason: 'email-taken' };

    const salt = await randomSalt();
    const hash = await hashPassword(password, salt, ITERATIONS, sha256);
    await kv.set(key, JSON.stringify({ salt, hash, iterations: ITERATIONS }));
    return { ok: true, userId };
  }

  async function verify(userId: string, password: string): Promise<AuthResult> {
    const raw = await kv.get(`rl.cred.${userId}`);
    const refused = { ok: false, reason: 'invalid-credentials' } as const;
    if (!raw) return refused;

    try {
      const { salt, hash, iterations } = JSON.parse(raw) as {
        salt: string;
        hash: string;
        iterations: number;
      };
      const attempt = await hashPassword(password, salt, iterations, sha256);
      return sameHash(attempt, hash) ? { ok: true, userId } : refused;
    } catch {
      return refused;
    }
  }

  async function login(email: string, password: string): Promise<AuthResult> {
    return verify(await userIdOf(email), password);
  }

  const remove = (userId: string) => kv.remove(`rl.cred.${userId}`);

  return { register, login, verify, remove };
}
