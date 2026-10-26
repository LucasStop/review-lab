import { useCallback, useEffect, useRef, useState } from 'react';

import { storage } from '../services/appStorage';
import { userKey } from '../services/storage';

// Lista por usuário no AsyncStorage. `hydrated` só vira true depois da leitura: a tela mostra
// loader até lá, nunca uma lista zerada (C26). Dado corrompido abre vazio (C25).
export function usePersistedList<T>(
  userId: string,
  name: string,
  isValid: (value: unknown) => boolean,
) {
  const [items, setItems] = useState<T[]>([]);
  const [hydrated, setHydrated] = useState(false);
  // Última lista gravada: duas mudanças seguidas não podem partir da mesma lista velha.
  const latest = useRef<T[]>([]);
  const key = userKey(userId, name);

  useEffect(() => {
    let alive = true;
    storage.read<T[]>(key, [], isValid).then((stored) => {
      if (!alive) return;
      latest.current = stored;
      setItems(stored);
      setHydrated(true);
    });
    return () => {
      alive = false;
    };
  }, [key, isValid]);

  const update = useCallback(
    (change: (current: T[]) => T[] | null) => {
      const next = change(latest.current);
      if (!next) return false;
      latest.current = next;
      setItems(next);
      // Falha de disco não derruba a tela: o estado em memória segue valendo na sessão.
      storage.write(key, next).catch(() => {});
      return true;
    },
    [key],
  );

  return { items, hydrated, update };
}
