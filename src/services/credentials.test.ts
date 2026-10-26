import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';

import { createCredentials, hashPassword } from './credentials.ts';

const sha256 = async (text: string) => createHash('sha256').update(text).digest('hex');

function setup() {
  const store = new Map<string, string>();
  let counter = 0;
  const credentials = createCredentials({
    kv: {
      get: async (key) => store.get(key) ?? null,
      set: async (key, value) => void store.set(key, value),
      remove: async (key) => void store.delete(key),
    },
    sha256,
    randomSalt: async () => `salt-${counter++}`,
  });
  return { store, credentials };
}

test('same salt and password give the same hash', async () => {
  assert.equal(
    await hashPassword('segredo1', 's', 3, sha256),
    await hashPassword('segredo1', 's', 3, sha256),
  );
});

test('different salts give different hashes', async () => {
  assert.notEqual(
    await hashPassword('segredo1', 'a', 3, sha256),
    await hashPassword('segredo1', 'b', 3, sha256),
  );
});

test('different passwords give different hashes', async () => {
  assert.notEqual(
    await hashPassword('segredo1', 's', 3, sha256),
    await hashPassword('segredo2', 's', 3, sha256),
  );
});

test('register then login with the right password', async () => {
  const { credentials } = setup();
  const reg = await credentials.register('Ana@Exemplo.com', 'segredo1');
  assert.equal(reg.ok, true);
  const login = await credentials.login('ana@exemplo.com', 'segredo1');
  assert.deepEqual(login, reg);
});

test('wrong password is refused', async () => {
  const { credentials } = setup();
  await credentials.register('ana@exemplo.com', 'segredo1');
  assert.deepEqual(await credentials.login('ana@exemplo.com', 'errada123'), {
    ok: false,
    reason: 'invalid-credentials',
  });
});

test('unknown email gets the same refusal as a wrong password', async () => {
  const { credentials } = setup();
  assert.deepEqual(await credentials.login('ninguem@exemplo.com', 'segredo1'), {
    ok: false,
    reason: 'invalid-credentials',
  });
});

test('duplicate email is refused, even with different case or spaces', async () => {
  const { credentials } = setup();
  await credentials.register('ana@exemplo.com', 'segredo1');
  assert.deepEqual(await credentials.register('  ANA@exemplo.com ', 'outra123'), {
    ok: false,
    reason: 'email-taken',
  });
});

test('password and plain email never reach the store', async () => {
  const { credentials, store } = setup();
  await credentials.register('ana@exemplo.com', 'segredo1');
  const dump = JSON.stringify([...store.entries()]);
  assert.ok(!dump.includes('segredo1'));
  assert.ok(!dump.includes('ana@exemplo.com'));
});

test('invalid input is refused before touching the store', async () => {
  const { credentials, store } = setup();
  assert.deepEqual(await credentials.register('sem-arroba', 'segredo1'), {
    ok: false,
    reason: 'invalid-input',
  });
  assert.deepEqual(await credentials.register('ana@exemplo.com', '123'), {
    ok: false,
    reason: 'invalid-input',
  });
  assert.equal(store.size, 0);
});

test('verify checks the password for a userId and remove drops the credential', async () => {
  const { store, credentials } = setup();
  const registered = await credentials.register('a@x.com', 'segredo1');
  assert.equal(registered.ok, true);
  const userId = registered.ok ? registered.userId : '';
  assert.deepEqual(await credentials.verify(userId, 'segredo1'), { ok: true, userId });
  assert.deepEqual(await credentials.verify(userId, 'outra123'), {
    ok: false,
    reason: 'invalid-credentials',
  });
  await credentials.remove(userId);
  assert.equal(store.has(`rl.cred.${userId}`), false);
  assert.deepEqual(await credentials.register('a@x.com', 'segredo1'), { ok: true, userId });
});
