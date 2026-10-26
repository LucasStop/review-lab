import assert from 'node:assert/strict';
import { test } from 'node:test';

import { mergePage } from './mergePage.ts';

const pr = (number: number) => ({ number, title: `t${number}`, author: 'a' });

test('C14: appends a new page in order', () => {
  assert.deepEqual(
    mergePage([pr(3), pr(2)], [pr(1)]).map((p) => p.number),
    [3, 2, 1],
  );
});

test('C14: drops numbers that are already in the list (page shifted by a new PR)', () => {
  assert.deepEqual(
    mergePage([pr(3), pr(2)], [pr(2), pr(1)]).map((p) => p.number),
    [3, 2, 1],
  );
});

test('C14: dedupes inside the incoming page too', () => {
  assert.deepEqual(
    mergePage([], [pr(1), pr(1)]).map((p) => p.number),
    [1],
  );
});
