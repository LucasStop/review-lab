// JSON em chave-valor com leitura segura. O armazenamento entra por parâmetro, para rodar nos
// testes sem módulo nativo; a ligação com o AsyncStorage fica em appStorage.ts.

export type KV = {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<void>;
  remove: (key: string) => Promise<void>;
};

export const userKey = (userId: string, name: string) => `rl.${userId}.${name}`;

// Apaga só as chaves `rl.<userId>.*`. O ponto final do prefixo impede casar com outro userId.
export async function removeUserKeys(
  userId: string,
  kv: {
    getAllKeys: () => Promise<readonly string[]>;
    multiRemove: (keys: string[]) => Promise<void>;
  },
) {
  const prefix = `rl.${userId}.`;
  await kv.multiRemove((await kv.getAllKeys()).filter((key) => key.startsWith(prefix)));
}

export function createStorage(kv: KV) {
  // Dado corrompido, de outra versão ou disco com erro vira o valor padrão: o app abre vazio
  // em vez de travar na hidratação (RF06).
  async function read<T>(key: string, fallback: T, isValid?: (value: unknown) => boolean) {
    try {
      const raw = await kv.get(key);
      if (raw === null) return fallback;
      const value: unknown = JSON.parse(raw);
      return !isValid || isValid(value) ? (value as T) : fallback;
    } catch {
      return fallback;
    }
  }

  const write = (key: string, value: unknown) => kv.set(key, JSON.stringify(value));

  return { read, write, remove: kv.remove };
}
