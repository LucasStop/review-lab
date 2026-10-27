import { expect, jest, test } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { AppError } from '../utils/appError';
import { useFetch } from './useFetch';

type Fetcher<T> = (signal: AbortSignal) => Promise<T>;

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

type Gate = ReturnType<typeof deferred<string>>;

test('C38: starts loading and then delivers the data', async () => {
  const gate = deferred<string>();
  const fetcher = jest.fn<Fetcher<string>>(() => gate.promise);
  const { result } = await renderHook(() => useFetch(fetcher));

  expect(result.current.status).toBe('loading');
  expect(result.current.data).toBeUndefined();

  await act(async () => gate.resolve('pr'));

  expect(result.current.status).toBe('data');
  expect(result.current.data).toBe('pr');
});

test('C37 and C38: an error turns into AppError and retry goes back to loading and fetches again', async () => {
  const first = deferred<string>();
  const second = deferred<string>();
  const fetcher = jest
    .fn<Fetcher<string>>()
    .mockReturnValueOnce(first.promise)
    .mockReturnValueOnce(second.promise);
  const { result } = await renderHook(() => useFetch(fetcher));

  await act(async () => first.reject({ code: 'ERR_NETWORK', request: {} }));
  expect(result.current.status).toBe('error');
  expect(result.current.error).toBeInstanceOf(AppError);
  expect(fetcher).toHaveBeenCalledTimes(1);

  await act(async () => result.current.retry());
  expect(result.current.status).toBe('loading');
  expect(fetcher).toHaveBeenCalledTimes(2);

  await act(async () => second.resolve('pr'));
  expect(result.current.status).toBe('data');
  expect(result.current.data).toBe('pr');
});

test('C38: unmounting aborts the signal', async () => {
  let received: AbortSignal | undefined;
  const fetcher = jest.fn<Fetcher<string>>((signal) => {
    received = signal;
    return deferred<string>().promise;
  });
  const { unmount } = await renderHook(() => useFetch(fetcher));

  expect(received?.aborted).toBe(false);
  await unmount();
  expect(received?.aborted).toBe(true);
});

test('C38: swapping the fetcher after data goes back to loading until the new one answers', async () => {
  const newGate = deferred<string>();
  const oldFetcher = jest.fn<Fetcher<string>>(() => Promise.resolve('old'));
  const newFetcher = jest.fn<Fetcher<string>>(() => newGate.promise);
  const { result, rerender } = await renderHook(
    ({ fetcher }: { fetcher: Fetcher<string> }) => useFetch(fetcher),
    { initialProps: { fetcher: oldFetcher } },
  );
  await waitFor(() => expect(result.current.data).toBe('old'));

  await rerender({ fetcher: newFetcher });
  expect(result.current.status).toBe('loading');
  expect(result.current.data).toBeUndefined();

  await act(async () => newGate.resolve('new'));
  expect(result.current.data).toBe('new');
});

// O abort do axios chega como rejeição: os dois desfechos do fetcher velho são ignorados.
test.each([
  { outcome: 'resolves', settle: (gate: Gate) => gate.resolve('old') },
  { outcome: 'rejects', settle: (gate: Gate) => gate.reject(new Error('canceled')) },
])('C38: after a swap the old fetcher is ignored when it $outcome last', async ({ settle }) => {
  const oldGate = deferred<string>();
  const newGate = deferred<string>();
  const oldFetcher = jest.fn<Fetcher<string>>(() => oldGate.promise);
  const newFetcher = jest.fn<Fetcher<string>>(() => newGate.promise);
  const { result, rerender } = await renderHook(
    ({ fetcher }: { fetcher: Fetcher<string> }) => useFetch(fetcher),
    { initialProps: { fetcher: oldFetcher } },
  );

  await rerender({ fetcher: newFetcher });
  expect(result.current.status).toBe('loading');
  expect(newFetcher).toHaveBeenCalledTimes(1);

  await act(async () => newGate.resolve('new'));
  await waitFor(() => expect(result.current.data).toBe('new'));

  await act(async () => settle(oldGate));
  expect(result.current.status).toBe('data');
  expect(result.current.data).toBe('new');
});
