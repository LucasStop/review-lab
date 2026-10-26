import { useCallback, useEffect, useRef, useState } from 'react';

import { listPullRequests } from '../services/github';
import type { PullRequestSummary } from '../types/github';
import { toAppError, type AppError } from '../utils/appError';
import { mergePage } from '../utils/mergePage';

type State = {
  items: PullRequestSummary[];
  hasNext: boolean;
  // `loading` só na carga inicial; depois o erro de uma página nova não derruba a lista.
  status: 'loading' | 'ready' | 'error';
  error?: AppError;
  moreError?: AppError;
  loadingMore: boolean;
  refreshing: boolean;
};

const INITIAL: State = {
  items: [],
  hasNext: false,
  status: 'loading',
  loadingMore: false,
  refreshing: false,
};

export function usePullRequestList() {
  const [state, setState] = useState<State>(INITIAL);
  const page = useRef(0);
  const busy = useRef(false);
  const alive = useRef(true);
  // Última operação que falhou: o "Tentar novamente" do rodapé repete essa, seja página 2 ou refresh.
  const failed = useRef<{ next: number; refresh: boolean }>({ next: 2, refresh: false });

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  // Só busca e aplica o resultado (setState dentro do `.then`): a carga inicial roda daqui no
  // efeito. Quem precisa marcar "carregando mais" ou "atualizando" faz isso em `start`.
  const request = useCallback((next: number, refresh: boolean) => {
    busy.current = true;
    return listPullRequests(next, undefined, refresh)
      .then(
        (result) => {
          if (!alive.current) return;
          page.current = next;
          setState((s) => ({
            ...s,
            items: next === 1 ? result.items : mergePage(s.items, result.items),
            hasNext: result.hasNext,
            status: 'ready',
            error: undefined,
            moreError: undefined,
            loadingMore: false,
            refreshing: false,
          }));
        },
        (error) => {
          if (!alive.current) return;
          failed.current = { next, refresh };
          const appError = toAppError(error);
          setState((s) =>
            next === 1 && s.items.length === 0
              ? { ...s, status: 'error', error: appError, loadingMore: false, refreshing: false }
              : { ...s, moreError: appError, loadingMore: false, refreshing: false },
          );
        },
      )
      .finally(() => {
        busy.current = false;
      });
  }, []);

  const start = useCallback(
    (next: number, refresh: boolean, mark: (s: State) => State) => {
      if (busy.current) return;
      setState(mark);
      void request(next, refresh);
    },
    [request],
  );

  const loadFirst = useCallback(
    () => start(1, false, (s) => ({ ...s, status: 'loading', error: undefined })),
    [start],
  );

  // O estado inicial já é `loading`.
  useEffect(() => {
    // StrictMode roda o efeito duas vezes em dev: o segundo não gasta outra requisição.
    if (!busy.current) void request(1, false);
  }, [request]);

  const loadMore = useCallback(() => {
    if (!state.hasNext || state.status !== 'ready' || state.moreError) return;
    start(page.current + 1, false, (s) => ({ ...s, loadingMore: true }));
  }, [start, state.hasNext, state.status, state.moreError]);

  const retryMore = useCallback(
    () =>
      start(failed.current.next, failed.current.refresh, (s) => ({
        ...s,
        loadingMore: !failed.current.refresh,
        refreshing: failed.current.refresh,
        moreError: undefined,
      })),
    [start],
  );

  const refresh = useCallback(
    () => start(1, true, (s) => ({ ...s, refreshing: true, moreError: undefined })),
    [start],
  );

  return { ...state, loadFirst, loadMore, retryMore, refresh };
}
