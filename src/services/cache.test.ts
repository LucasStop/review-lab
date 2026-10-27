import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createCache } from './cache.ts';
import { createStorage } from './storage.ts';

const MIN = 60_000;

function setup(maxEntries = 50) {
  const data = new Map<string, string>();
  const storage = createStorage({
    get: async (key) => data.get(key) ?? null,
    set: async (key, value) => void data.set(key, value),
    remove: async (key) => void data.delete(key),
  });
  let time = 1_000_000;
  const cache = createCache({ storage, now: () => time, maxEntries });
  return { data, cache, advance: (ms: number) => void (time += ms) };
}

function counter<T>(value: T, etag?: string) {
  const calls: (string | undefined)[] = [];
  const fetch = async (sentEtag?: string) => {
    calls.push(sentEtag);
    return { value, etag };
  };
  return { calls, fetch };
}

test('a repeated call inside the TTL does not hit the network', async () => {
  const { cache } = setup();
  const f = counter('A');
  assert.equal(await cache.get('k', { ttlMs: 10 * MIN }, f.fetch), 'A');
  assert.equal(await cache.get('k', { ttlMs: 10 * MIN }, f.fetch), 'A');
  assert.equal(f.calls.length, 1);
});

test('after the TTL the network is used again', async () => {
  const { cache, advance } = setup();
  const f = counter('A');
  await cache.get('k', { ttlMs: 10 * MIN }, f.fetch);
  advance(10 * MIN + 1);
  await cache.get('k', { ttlMs: 10 * MIN }, f.fetch);
  assert.equal(f.calls.length, 2);
});

test('force ignores the TTL (pull-to-refresh)', async () => {
  const { cache } = setup();
  const f = counter('A');
  await cache.get('k', { ttlMs: 10 * MIN }, f.fetch);
  await cache.get('k', { ttlMs: 10 * MIN, force: true }, f.fetch);
  assert.equal(f.calls.length, 2);
});

test('an expired entry is the fallback when the network fails', async () => {
  const { cache, advance } = setup();
  await cache.get('k', { ttlMs: MIN }, counter('A').fetch);
  advance(2 * MIN);
  const value = await cache.get('k', { ttlMs: MIN }, async () => {
    throw new Error('offline');
  });
  assert.equal(value, 'A');
});

test('without any entry the failure is thrown', async () => {
  const { cache } = setup();
  await assert.rejects(
    cache.get('k', { ttlMs: MIN }, async () => {
      throw new Error('offline');
    }),
    /offline/,
  );
});

test('an etag is sent back and a 304 keeps the value and renews the age', async () => {
  const { cache, advance } = setup();
  await cache.get('k', { ttlMs: MIN }, counter('A', 'W/"1"').fetch);
  advance(2 * MIN);
  const sent: (string | undefined)[] = [];
  const value = await cache.get('k', { ttlMs: MIN }, async (etag) => {
    sent.push(etag);
    return 'not-modified';
  });
  assert.equal(value, 'A');
  assert.deepEqual(sent, ['W/"1"']);
  const f = counter('B');
  assert.equal(await cache.get('k', { ttlMs: MIN }, f.fetch), 'A');
  assert.equal(f.calls.length, 0);
});

test('the oldest entry is dropped when the cache is full', async () => {
  const { cache, data } = setup(2);
  for (const k of ['a', 'b', 'c']) await cache.get(k, { ttlMs: MIN }, counter(k).fetch);
  const f = counter('A2');
  assert.equal(await cache.get('a', { ttlMs: MIN }, f.fetch), 'A2');
  assert.equal(f.calls.length, 1);
  assert.ok(data.size <= 3, `index plus 2 entries, got ${data.size}`);
});

test('a corrupted entry is ignored', async () => {
  const { cache, data } = setup();
  await cache.get('k', { ttlMs: MIN }, counter('A').fetch);
  for (const key of data.keys()) if (key !== 'rl.cache.index') data.set(key, '{quebrado');
  const f = counter('B');
  assert.equal(await cache.get('k', { ttlMs: MIN }, f.fetch), 'B');
});

test('concurrent saves of different keys both end up in the index', async () => {
  const data = new Map<string, string>();
  const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 1));
  const storage = createStorage({
    get: async (key) => (await tick(), data.get(key) ?? null),
    set: async (key, value) => (await tick(), void data.set(key, value)),
    remove: async (key) => (await tick(), void data.delete(key)),
  });
  const cache = createCache({ storage, now: () => 1_000_000 });
  await Promise.all([
    cache.get('a', { ttlMs: MIN }, async () => ({ value: 'A' })),
    cache.get('b', { ttlMs: MIN }, async () => ({ value: 'B' })),
  ]);
  assert.deepEqual(JSON.parse(data.get('rl.cache.index')!).sort(), ['a', 'b']);
});
