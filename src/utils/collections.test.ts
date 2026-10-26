import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  isFavoriteList,
  isStudiedList,
  toggleFavorite,
  withoutStudied,
  withStudied,
} from './collections.ts';

const pr = (number: number, extra: Record<string, unknown> = {}) => ({
  number,
  title: `t${number}`,
  author: 'ana',
  ...extra,
});

test('toggleFavorite adds a PR at the top and removes it on the second toggle', () => {
  const once = toggleFavorite([pr(1)], pr(2));
  assert.deepEqual(
    once.map((p) => p.number),
    [2, 1],
  );
  assert.deepEqual(
    toggleFavorite(once, pr(2)).map((p) => p.number),
    [1],
  );
});

test('toggleFavorite keeps only the snapshot fields', () => {
  const [saved] = toggleFavorite([], {
    ...pr(1),
    avatarUrl: 'https://a.test/a.png',
    extra: 1,
  } as never);
  assert.deepEqual(saved, {
    number: 1,
    title: 't1',
    author: 'ana',
    avatarUrl: 'https://a.test/a.png',
  });
});

test('withStudied refuses a rating outside 1 to 5 or fractional', () => {
  for (const bad of [0, 6, -1, 2.5, Number.NaN]) assert.equal(withStudied([], pr(1), bad), null);
});

test('withStudied adds, then changes the rating of the same PR without duplicating', () => {
  const first = withStudied([], pr(1), 3)!;
  const second = withStudied(first, pr(1), 5)!;
  assert.deepEqual(second, [{ number: 1, title: 't1', author: 'ana', rating: 5 }]);
});

test('withoutStudied removes only that PR', () => {
  const list = withStudied(withStudied([], pr(1), 3)!, pr(2), 4)!;
  assert.deepEqual(
    withoutStudied(list, 1).map((p) => p.number),
    [2],
  );
});

test('C25: validators reject corrupted data and accept good data', () => {
  assert.equal(isFavoriteList([pr(1)]), true);
  assert.equal(isFavoriteList([]), true);
  assert.equal(isFavoriteList({}), false);
  assert.equal(isFavoriteList([{ number: '1' }]), false);
  assert.equal(isStudiedList([{ ...pr(1), rating: 4 }]), true);
  assert.equal(isStudiedList([{ ...pr(1), rating: 9 }]), false);
  assert.equal(isStudiedList([pr(1)]), false);
});

test('validators reject non-positive or fractional numbers and duplicates', () => {
  assert.equal(isFavoriteList([pr(0)]), false);
  assert.equal(isFavoriteList([pr(-3)]), false);
  assert.equal(isFavoriteList([pr(1.5)]), false);
  assert.equal(isFavoriteList([pr(1), pr(1)]), false);
  assert.equal(
    isStudiedList([
      { ...pr(1), rating: 3 },
      { ...pr(1), rating: 4 },
    ]),
    false,
  );
});
