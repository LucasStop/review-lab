import { useCallback, useEffect, useState } from 'react';

import { toAppError, type AppError } from '../utils/appError';

type State<T> =
  | { status: 'loading'; data: undefined; error: undefined }
  | { status: 'data'; data: T; error: undefined }
  | { status: 'error'; data: undefined; error: AppError };

export type UseFetch<T> = State<T> & { retry: () => void };

type Fetcher<T> = (signal: AbortSignal) => Promise<T>;

const LOADING = { status: 'loading', data: undefined, error: undefined } as const;

// `fetcher` precisa ser estável (useCallback): trocar o fetcher refaz a chamada. O resultado
// guarda de qual fetcher e tentativa veio; se não bate com os atuais, o estado derivado é
// "loading", sem precisar de setState síncrono no efeito.
export function useFetch<T>(fetcher: Fetcher<T>): UseFetch<T> {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{
    fetcher: Fetcher<T>;
    attempt: number;
    state: State<T>;
  } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const settle = (state: State<T>) => {
      if (!controller.signal.aborted) setResult({ fetcher, attempt, state });
    };

    fetcher(controller.signal).then(
      (data) => settle({ status: 'data', data, error: undefined }),
      (error) => settle({ status: 'error', data: undefined, error: toAppError(error) }),
    );

    return () => controller.abort();
  }, [fetcher, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  const current =
    result && result.fetcher === fetcher && result.attempt === attempt ? result.state : LOADING;

  return { ...current, retry };
}
