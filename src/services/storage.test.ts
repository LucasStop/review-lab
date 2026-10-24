import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createStorage, userKey } from './storage.ts';

function setup(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  const storage = createStorage({
    get: async (key) => data.get(key) ?? null,
    set: async (key, value) => void data.set(key, value),
    remove: async (key) => void data.delete(key),
  });
  return { data, storage };
}

test('keys carry the rl prefix and the user id', () => {
  assert.equal(userKey('abc', 'favorites'), 'rl.abc.favorites');
  assert.notEqual(userKey('abc', 'favorites'), userKey('def', 'favorites'));
});

test('write then read returns the same value', async () => {
  const { storage } = setup();
  await storage.write('rl.u.studied', { 7: 4 });
  assert.deepEqual(await storage.read('rl.u.studied', {}), { 7: 4 });
});

test('missing key returns the fallback', async () => {
  const { storage } = setup();
  assert.deepEqual(await storage.read('rl.u.favorites', []), []);
});

test('corrupted JSON returns the fallback without throwing', async () => {
  const { storage } = setup({ 'rl.u.favorites': '{"quebrado":' });
  assert.deepEqual(await storage.read('rl.u.favorites', []), []);
});

test('a value rejected by the validator returns the fallback', async () => {
  const { storage } = setup({ 'rl.u.favorites': '{"nao":"e lista"}' });
  assert.deepEqual(await storage.read('rl.u.favorites', [], Array.isArray), []);
});

test('a kv that throws on read returns the fallback', async () => {
  const storage = createStorage({
    get: async () => {
      throw new Error('disco cheio');
    },
    set: async () => {},
    remove: async () => {},
  });
  assert.deepEqual(await storage.read('rl.u.favorites', [] as string[]), []);
});
