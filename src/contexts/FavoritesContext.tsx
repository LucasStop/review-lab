import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';

import { usePersistedList } from '../hooks/usePersistedList';
import type { PullRequestSummary } from '../types/github';
import { isFavoriteList, toggleFavorite } from '../utils/collections';

type FavoritesValue = {
  favorites: PullRequestSummary[];
  hydrated: boolean;
  isFavorite: (number: number) => boolean;
  toggle: (pr: PullRequestSummary) => void;
};

const FavoritesContext = createContext<FavoritesValue | null>(null);

// `userId` vem do RootNavigator, que remonta o provider a cada troca de usuário: os dados de
// um usuário nunca ficam na memória do próximo.
export function FavoritesProvider({ userId, children }: { userId: string; children: ReactNode }) {
  const { items, hydrated, update } = usePersistedList<PullRequestSummary>(
    userId,
    'favorites',
    isFavoriteList,
  );

  const toggle = useCallback(
    (pr: PullRequestSummary) => void update((current) => toggleFavorite(current, pr)),
    [update],
  );
  const isFavorite = useCallback(
    (number: number) => items.some((item) => item.number === number),
    [items],
  );

  const value = useMemo(
    () => ({ favorites: items, hydrated, isFavorite, toggle }),
    [items, hydrated, isFavorite, toggle],
  );
  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesValue {
  const value = useContext(FavoritesContext);
  if (!value) throw new Error('useFavorites precisa estar dentro de FavoritesProvider');
  return value;
}
