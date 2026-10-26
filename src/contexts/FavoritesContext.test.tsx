import { beforeEach, expect, jest, test } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import type { PullRequestSummary } from '../types/github';
import { FavoritesProvider, useFavorites } from './FavoritesContext';

const pr = (number: number): PullRequestSummary => ({
  number,
  title: `PR ${number}`,
  author: 'ana',
});

const as = (userId: string) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return <FavoritesProvider userId={userId}>{children}</FavoritesProvider>;
  };

let currentId = 'u1';
function SwitchWrapper({ children }: { children: ReactNode }) {
  return <FavoritesProvider userId={currentId}>{children}</FavoritesProvider>;
}

async function open(userId = 'u1') {
  const hook = await renderHook(() => useFavorites(), { wrapper: as(userId) });
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
  const hook = await renderHook(() => useFavorites(), { wrapper: as('u1') });

  expect(hook.result.current.hydrated).toBe(false);
  expect(hook.result.current.favorites).toEqual([]);

  await act(async () => release(JSON.stringify([pr(3)])));
  expect(hook.result.current.hydrated).toBe(true);
  expect(hook.result.current.favorites.map((p) => p.number)).toEqual([3]);
});

test('toggle adds and removes, and isFavorite follows', async () => {
  const { result } = await open();

  await act(async () => result.current.toggle(pr(1)));
  expect(result.current.isFavorite(1)).toBe(true);
  expect(result.current.favorites.map((p) => p.number)).toEqual([1]);

  await act(async () => result.current.toggle(pr(1)));
  expect(result.current.isFavorite(1)).toBe(false);
});

test('two toggles in a row do not lose the first (no stale list)', async () => {
  const { result } = await open();

  await act(async () => {
    result.current.toggle(pr(1));
    result.current.toggle(pr(2));
  });

  expect(result.current.favorites.map((p) => p.number)).toEqual([2, 1]);
});

test('C24: reopening the app keeps the favorites', async () => {
  const first = await open();
  await act(async () => first.result.current.toggle(pr(7)));
  await first.unmount();

  const second = await open();
  expect(second.result.current.favorites.map((p) => p.number)).toEqual([7]);
});

test('C27: another user on the same device sees none of them', async () => {
  const mine = await open('u1');
  await act(async () => mine.result.current.toggle(pr(7)));
  await mine.unmount();

  const other = await open('u2');
  expect(other.result.current.favorites).toEqual([]);
});

test('C25: corrupted JSON in storage opens empty without breaking', async () => {
  await AsyncStorage.setItem('rl.u1.favorites', '{not json');
  const { result } = await open();
  expect(result.current.favorites).toEqual([]);
});

test('C25: valid JSON of the wrong shape opens empty', async () => {
  await AsyncStorage.setItem('rl.u1.favorites', JSON.stringify([{ number: 'x' }]));
  const { result } = await open();
  expect(result.current.favorites).toEqual([]);
});

test('a toggle before hydration is refused and does not overwrite what is on disk', async () => {
  await AsyncStorage.setItem('rl.u1.favorites', JSON.stringify([pr(5)]));
  let release: (value: string | null) => void = () => {};
  jest
    .spyOn(AsyncStorage, 'getItem')
    .mockReturnValueOnce(new Promise((resolve) => (release = resolve)));
  const { result } = await renderHook(() => useFavorites(), { wrapper: as('u1') });

  await act(async () => result.current.toggle(pr(9)));
  expect(await AsyncStorage.getItem('rl.u1.favorites')).toBe(JSON.stringify([pr(5)]));

  await act(async () => release(JSON.stringify([pr(5)])));
  expect(result.current.favorites.map((p) => p.number)).toEqual([5]);
});

test('a failed disk read does not hydrate a writable empty list that would erase the data', async () => {
  await AsyncStorage.setItem('rl.u1.favorites', JSON.stringify([pr(5)]));
  jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('disk'));
  const { result } = await renderHook(() => useFavorites(), { wrapper: as('u1') });
  await waitFor(() => expect(result.current.hydrated).toBe(true));

  await act(async () => result.current.toggle(pr(9)));

  expect(await AsyncStorage.getItem('rl.u1.favorites')).toBe(JSON.stringify([pr(5)]));
});

test('C27: switching the user on the same tree shows nothing of the previous one', async () => {
  await AsyncStorage.setItem('rl.u1.favorites', JSON.stringify([pr(5)]));
  currentId = 'u1';
  const { result, rerender } = await renderHook(() => useFavorites(), { wrapper: SwitchWrapper });
  await waitFor(() => expect(result.current.favorites).toHaveLength(1));

  currentId = 'u2';
  await rerender({});
  expect(result.current.favorites).toEqual([]);
  await act(async () => result.current.toggle(pr(9)));
  expect(await AsyncStorage.getItem('rl.u2.favorites')).toBe(JSON.stringify([pr(9)]));
  expect(await AsyncStorage.getItem('rl.u1.favorites')).toBe(JSON.stringify([pr(5)]));
});
