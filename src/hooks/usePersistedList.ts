import { useCallback, useEffect, useRef, useState } from 'react';

import { storage } from '../services/appStorage';
import { userKey } from '../services/storage';

// Lista por usuário no AsyncStorage. `hydrated` só vira true depois da leitura: o
// `HydrationGate` do RootNavigator mostra loader até lá, nunca uma lista zerada (C26). Dado
// corrompido abre vazio (C25).
//
// Antes de hidratar, e depois de uma leitura que falhou, `update` recusa: gravar partindo de
// uma lista vazia apagaria o dado bom que está no disco. A lista só vale para a chave que a
// carregou, então trocar o usuário nunca mostra nem grava a lista do anterior.
export function usePersistedList<T>(
  userId: string,
  name: string,
  isValid: (value: unknown) => boolean,
) {
  const key = userKey(userId, name);
  const [loaded, setLoaded] = useState<{ key: string; items: T[] } | null>(null);
  // Última lista gravada: duas mudanças seguidas não podem partir da mesma lista velha.
  const latest = useRef<{ key: string; items: T[]; writable: boolean } | null>(null);

  useEffect(() => {
    let alive = true;
    const done = (items: T[], writable: boolean) => {
      if (!alive) return;
      latest.current = { key, items, writable };
      setLoaded({ key, items });
    };
    storage.load<T[]>(key, [], isValid).then(
      (stored) => done(stored, true),
      () => done([], false),
    );
    return () => {
      alive = false;
    };
  }, [key, isValid]);

  const hydrated = loaded?.key === key;
  const items = hydrated ? loaded.items : [];

  const update = useCallback(
    (change: (current: T[]) => T[] | null) => {
      const current = latest.current;
      if (!current || current.key !== key || !current.writable) return false;
      const next = change(current.items);
      if (!next) return false;
      latest.current = { ...current, items: next };
      setLoaded({ key, items: next });
      // Falha de disco não derruba a tela: o estado em memória segue valendo na sessão.
      storage.write(key, next).catch(() => {});
      return true;
    },
    [key],
  );

  return { items, hydrated, update };
}
