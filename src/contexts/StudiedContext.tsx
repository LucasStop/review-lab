import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';

import { usePersistedList } from '../hooks/usePersistedList';
import type { PullRequestSummary } from '../types/github';
import {
  isStudiedList,
  withoutStudied,
  withStudied,
  type StudiedEntry,
} from '../utils/collections';

type StudiedValue = {
  studied: StudiedEntry[];
  hydrated: boolean;
  // Devolve false e não grava quando a nota não é um inteiro de 1 a 5.
  markStudied: (pr: PullRequestSummary, rating: number) => boolean;
  unmark: (number: number) => void;
  getRating: (number: number) => number | undefined;
};

const StudiedContext = createContext<StudiedValue | null>(null);

export function StudiedProvider({ userId, children }: { userId: string; children: ReactNode }) {
  const { items, hydrated, update } = usePersistedList<StudiedEntry>(
    userId,
    'studied',
    isStudiedList,
  );

  const markStudied = useCallback(
    (pr: PullRequestSummary, rating: number) =>
      update((current) => withStudied(current, pr, rating)),
    [update],
  );
  const unmark = useCallback(
    (number: number) => void update((current) => withoutStudied(current, number)),
    [update],
  );
  const getRating = useCallback(
    (number: number) => items.find((item) => item.number === number)?.rating,
    [items],
  );

  const value = useMemo(
    () => ({ studied: items, hydrated, markStudied, unmark, getRating }),
    [items, hydrated, markStudied, unmark, getRating],
  );
  return <StudiedContext.Provider value={value}>{children}</StudiedContext.Provider>;
}

export function useStudied(): StudiedValue {
  const value = useContext(StudiedContext);
  if (!value) throw new Error('useStudied precisa estar dentro de StudiedProvider');
  return value;
}
