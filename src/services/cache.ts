import type { createStorage } from './storage.ts';

type Storage = ReturnType<typeof createStorage>;

type Entry<T> = { value: T; at: number; etag?: string };
export type Fetched<T> = { value: T; etag?: string } | 'not-modified';
export type CacheOptions = { ttlMs: number; force?: boolean };

const INDEX = 'rl.cache.index';
const isEntry = (v: unknown) => typeof v === 'object' && v !== null && 'value' in v && 'at' in v;
const isList = (v: unknown) => Array.isArray(v);

// Cache em storage por chave: TTL, etag (304 não gasta o limite da API), cópia vencida como
// reserva quando a rede falha e teto de entradas (descarta a mais antiga).
export function createCache({
  storage,
  now = Date.now,
  maxEntries = 50,
}: {
  storage: Storage;
  now?: () => number;
  maxEntries?: number;
}) {
  // Dois save concorrentes leriam o mesmo índice e o último gravaria por cima: a chave perdida
  // nunca sairia do storage. A fila serializa; uma falha não trava os próximos.
  let queue: Promise<unknown> = Promise.resolve();

  function save<T>(key: string, entry: Entry<T>) {
    const run = queue.then(async () => {
      await storage.write(`rl.cache.${key}`, entry);
      const index = (await storage.read<string[]>(INDEX, [], isList)).filter((k) => k !== key);
      index.push(key);
      while (index.length > maxEntries) await storage.remove(`rl.cache.${index.shift()}`);
      await storage.write(INDEX, index);
    });
    queue = run.catch(() => {});
    return run;
  }

  async function get<T>(
    key: string,
    { ttlMs, force = false }: CacheOptions,
    fetch: (etag?: string) => Promise<Fetched<T>>,
  ): Promise<T> {
    const entry = await storage.read<Entry<T> | null>(`rl.cache.${key}`, null, isEntry);
    if (entry && !force && now() - entry.at < ttlMs) return entry.value;

    let result: Fetched<T>;
    try {
      result = await fetch(entry?.etag);
    } catch (error) {
      if (entry) return entry.value;
      throw error;
    }

    if (result === 'not-modified') {
      if (!entry) throw new Error('304 sem cópia em cache');
      await save(key, { ...entry, at: now() }).catch(() => {});
      return entry.value;
    }
    // Falha ao gravar não pode descartar um dado que acabou de chegar.
    await save(key, { value: result.value, at: now(), etag: result.etag }).catch(() => {});
    return result.value;
  }

  return { get };
}
