import assert from 'node:assert/strict';
import { test } from 'node:test';

import { toSummary } from './pullRequest.ts';

const base = {
  number: 7,
  title: 'Fix crash',
  state: 'closed' as const,
  created_at: '2026-01-01T00:00:00Z',
  merged_at: null,
  html_url: 'https://github.com/o/r/pull/7',
};

test('maps number, title, author and avatar', () => {
  const summary = toSummary({
    ...base,
    user: { login: 'ana', avatar_url: 'https://a.test/a.png' },
  });
  assert.deepEqual(summary, {
    number: 7,
    title: 'Fix crash',
    author: 'ana',
    avatarUrl: 'https://a.test/a.png',
  });
});

test('deleted author and missing avatar do not break the card', () => {
  assert.deepEqual(toSummary({ ...base, user: null }), {
    number: 7,
    title: 'Fix crash',
    author: 'ghost',
    avatarUrl: undefined,
  });
  assert.equal(toSummary({ ...base, user: { login: 'ana', avatar_url: '' } }).avatarUrl, undefined);
});
