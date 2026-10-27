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

test('C38: an error turns into AppError and retry goes back to loading and fetches again', async () => {
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

test('C38: unmounting aborts the signal and the late result does not become state', async () => {
  const gate = deferred<string>();
  let received: AbortSignal | undefined;
  const fetcher = jest.fn<Fetcher<string>>((signal) => {
    received = signal;
    return gate.promise;
  });
  const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  const { unmount } = await renderHook(() => useFetch(fetcher));

  expect(received?.aborted).toBe(false);
  await unmount();
  expect(received?.aborted).toBe(true);

  await act(async () => gate.resolve('late'));
  expect(errorSpy).not.toHaveBeenCalled();
  errorSpy.mockRestore();
});

test('C38: swapping the fetcher goes back to loading and ignores the old one even if it resolves last', async () => {
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

  await act(async () => oldGate.resolve('old'));
  expect(result.current.status).toBe('data');
  expect(result.current.data).toBe('new');
});
