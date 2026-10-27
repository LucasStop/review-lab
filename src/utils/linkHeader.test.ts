import assert from 'node:assert/strict';
import { test } from 'node:test';

import { parseLinkHeader } from './linkHeader.ts';

const HEADER =
  '<https://api.github.com/repositories/1/pulls?state=closed&per_page=20&page=2>; rel="next", ' +
  '<https://api.github.com/repositories/1/pulls?state=closed&per_page=20&page=45>; rel="last"';

test('reads next and last page numbers', () => {
  assert.deepEqual(parseLinkHeader(HEADER), { next: 2, last: 45 });
});

test('last page has prev and first but no next', () => {
  const header =
    '<https://api.github.com/x?page=1>; rel="first", <https://api.github.com/x?page=44>; rel="prev"';
  assert.deepEqual(parseLinkHeader(header), {});
});

test('absent or empty header means no pagination', () => {
  assert.deepEqual(parseLinkHeader(undefined), {});
  assert.deepEqual(parseLinkHeader(''), {});
});

test('malformed header does not throw', () => {
  assert.deepEqual(parseLinkHeader('<<<; rel=next'), {});
  assert.deepEqual(parseLinkHeader('<https://a.test/?page=abc>; rel="next"'), {});
});

test('a Link without a valid page number gives no page', () => {
  assert.deepEqual(parseLinkHeader('<https://a.test/x>; rel="next"'), {});
  assert.deepEqual(parseLinkHeader('<https://a.test/x?page=1.5>; rel="next"'), {});
  assert.deepEqual(parseLinkHeader('<https://a.test/x?page=0>; rel="last"'), {});
});
