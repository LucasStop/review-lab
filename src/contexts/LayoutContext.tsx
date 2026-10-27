import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';

import { usePersistedValue } from '../hooks/usePersistedList';

type Columns = 1 | 2;

type LayoutValue = {
  columns: Columns;
  hydrated: boolean;
  toggle: () => void;
};

const LayoutContext = createContext<LayoutValue | null>(null);

const isColumns = (value: unknown) => value === 1 || value === 2;

// Colunas do Catálogo, por usuário como favoritos e estudados. Sem escolha salva, ou com valor
// inválido no disco, abre em 2.
export function LayoutProvider({ userId, children }: { userId: string; children: ReactNode }) {
  const {
    value: columns,
    hydrated,
    update,
  } = usePersistedValue<Columns>(userId, 'layout', 2, isColumns);

  const toggle = useCallback(() => void update((current) => (current === 2 ? 1 : 2)), [update]);

  const value = useMemo(() => ({ columns, hydrated, toggle }), [columns, hydrated, toggle]);
  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
}

export function useLayout(): LayoutValue {
  const value = useContext(LayoutContext);
  if (!value) throw new Error('useLayout precisa estar dentro de LayoutProvider');
  return value;
}
