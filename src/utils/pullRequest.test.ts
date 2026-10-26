import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildSearchQuery, toDetail, toSummary } from './pullRequest.ts';

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

test('toDetail sanitizes body_html into blocks and keeps the stats', () => {
  const detail = toDetail({
    ...base,
    user: { login: 'ana', avatar_url: 'https://a.test/a.png' },
    body_html: '<p>Corrige <strong>bug</strong></p><script>alert(1)</script>',
    comments: 2,
    review_comments: 3,
    changed_files: 4,
    additions: 10,
    deletions: 5,
  });
  assert.equal(detail.number, 7);
  assert.equal(detail.author, 'ana');
  assert.equal(detail.htmlUrl, 'https://github.com/o/r/pull/7');
  assert.equal(detail.reviewComments, 3);
  assert.deepEqual(detail.blocks, [
    { type: 'paragraph', content: [{ text: 'Corrige ' }, { text: 'bug', bold: true }] },
  ]);
});

test('toDetail with no description gives an empty list, not an error', () => {
  const detail = toDetail({
    ...base,
    user: null,
    body_html: null,
    comments: 0,
    review_comments: 0,
    changed_files: 0,
    additions: 0,
    deletions: 0,
  });
  assert.deepEqual(detail.blocks, []);
  assert.equal(detail.author, 'ghost');
});

test('buildSearchQuery scopes the search to PRs of the configured repo', () => {
  assert.equal(buildSearchQuery('o/r', '  crash  '), 'type:pr repo:o/r crash');
});

test('buildSearchQuery returns nothing for an empty term', () => {
  assert.equal(buildSearchQuery('o/r', ''), undefined);
  assert.equal(buildSearchQuery('o/r', '   '), undefined);
});

test('buildSearchQuery neutralizes qualifiers typed by the user', () => {
  assert.equal(
    buildSearchQuery('o/r', 'repo:evil/x is:issue'),
    'type:pr repo:o/r repo evil/x is issue',
  );
  assert.equal(buildSearchQuery('o/r', ':::'), undefined);
});

test('buildSearchQuery turns the boolean operators typed by the user into plain words', () => {
  // Mais de 5 AND, OR ou NOT dá 422 no GitHub; em minúscula viram palavras comuns.
  assert.equal(
    buildSearchQuery('o/r', 'a AND b OR c NOT d AND e AND f AND g'),
    'type:pr repo:o/r a and b or c not d and e and f and g',
  );
});
