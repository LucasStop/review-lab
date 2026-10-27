import { useCallback, useEffect, useRef, useState } from 'react';

import { storage } from '../services/appStorage';
import { userKey } from '../services/storage';

// Valor por usuário no AsyncStorage. `hydrated` só vira true depois da leitura: o
// `HydrationGate` do RootNavigator mostra loader até lá, nunca um valor zerado (C26). Dado
// corrompido abre no `initial` (C25).
//
// Antes de hidratar, e depois de uma leitura que falhou, `update` recusa: gravar partindo do
// `initial` apagaria o dado bom que está no disco. O valor só vale para a chave que o carregou,
// então trocar o usuário nunca mostra nem grava o valor do anterior. `initial` e `isValid`
// estão nas deps da leitura, então precisam ser estáveis (constante ou função de módulo).
export function usePersistedValue<T>(
  userId: string,
  name: string,
  initial: T,
  isValid: (value: unknown) => boolean,
) {
  const key = userKey(userId, name);
  const [loaded, setLoaded] = useState<{ key: string; value: T } | null>(null);
  // Último valor gravado: duas mudanças seguidas não podem partir do mesmo valor velho.
  const latest = useRef<{ key: string; value: T; writable: boolean } | null>(null);

  useEffect(() => {
    let alive = true;
    const done = (value: T, writable: boolean) => {
      if (!alive) return;
      latest.current = { key, value, writable };
      setLoaded({ key, value });
    };
    storage.load<T>(key, initial, isValid).then(
      (stored) => done(stored, true),
      () => done(initial, false),
    );
    return () => {
      alive = false;
    };
  }, [key, initial, isValid]);

  const hydrated = loaded?.key === key;
  const value = hydrated ? loaded.value : initial;

  const update = useCallback(
    (change: (current: T) => T | null) => {
      const current = latest.current;
      if (!current || current.key !== key || !current.writable) return false;
      const next = change(current.value);
      if (next === null) return false;
      latest.current = { ...current, value: next };
      setLoaded({ key, value: next });
      // Falha de disco não derruba a tela: o estado em memória segue valendo na sessão.
      storage.write(key, next).catch(() => {});
      return true;
    },
    [key],
  );

  return { value, hydrated, update };
}

const EMPTY: never[] = [];

export function usePersistedList<T>(
  userId: string,
  name: string,
  isValid: (value: unknown) => boolean,
) {
  const { value, hydrated, update } = usePersistedValue<T[]>(userId, name, EMPTY, isValid);
  return { items: value, hydrated, update };
}
