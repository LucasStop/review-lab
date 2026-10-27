import { beforeEach, expect, jest, test } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import type { PullRequestSummary } from '../types/github';
import { StudiedProvider, useStudied } from './StudiedContext';

const pr = (number: number): PullRequestSummary => ({
  number,
  title: `PR ${number}`,
  author: 'ana',
});

const as = (userId: string) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return <StudiedProvider userId={userId}>{children}</StudiedProvider>;
  };

async function open(userId = 'u1') {
  const hook = await renderHook(() => useStudied(), { wrapper: as(userId) });
  await waitFor(() => expect(hook.result.current.hydrated).toBe(true));
  return hook;
}

beforeEach(async () => {
  await AsyncStorage.clear();
});

test('C26: not hydrated and empty while storage is being read, then hydrated', async () => {
  let release: (value: string | null) => void = () => {};
  jest
    .spyOn(AsyncStorage, 'getItem')
    .mockReturnValueOnce(new Promise((resolve) => (release = resolve)));
  const hook = await renderHook(() => useStudied(), { wrapper: as('u1') });

  expect(hook.result.current.hydrated).toBe(false);
  expect(hook.result.current.studied).toEqual([]);

  await act(async () => release(JSON.stringify([{ ...pr(3), rating: 4 }])));
  expect(hook.result.current.hydrated).toBe(true);
  expect(hook.result.current.getRating(3)).toBe(4);
});

test('markStudied stores the rating and getRating returns it', async () => {
  const { result } = await open();
  await act(async () => void result.current.markStudied(pr(1), 4));
  expect(result.current.getRating(1)).toBe(4);
  expect(result.current.getRating(2)).toBeUndefined();
});

test('C29: changing the rating updates the list without duplicating', async () => {
  const { result } = await open();
  await act(async () => void result.current.markStudied(pr(1), 2));
  await act(async () => void result.current.markStudied(pr(1), 5));
  expect(result.current.studied).toHaveLength(1);
  expect(result.current.getRating(1)).toBe(5);
});

test('C29: unmark removes it from the list', async () => {
  const { result } = await open();
  await act(async () => void result.current.markStudied(pr(1), 3));
  await act(async () => result.current.unmark(1));
  expect(result.current.studied).toEqual([]);
});

test('a rating outside 1 to 5 is refused and nothing is saved', async () => {
  const { result } = await open();
  let accepted = true;
  await act(async () => {
    accepted = result.current.markStudied(pr(1), 6);
  });
  expect(accepted).toBe(false);
  expect(result.current.studied).toEqual([]);
  expect(await AsyncStorage.getItem('rl.u1.studied')).toBeNull();
});

test('C24: reopening keeps the studied list and C27: another user does not see it', async () => {
  const first = await open('u1');
  await act(async () => void first.result.current.markStudied(pr(9), 5));
  await first.unmount();

  const again = await open('u1');
  expect(again.result.current.getRating(9)).toBe(5);
  await again.unmount();

  const other = await open('u2');
  expect(other.result.current.studied).toEqual([]);
});

test('C25: corrupted data opens empty', async () => {
  await AsyncStorage.setItem('rl.u1.studied', JSON.stringify([{ ...pr(1), rating: 99 }]));
  const { result } = await open();
  expect(result.current.studied).toEqual([]);
});
