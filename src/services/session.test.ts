import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createAuth } from './session.ts';

function setup() {
  const data = new Map<string, string>();
  const calls: string[] = [];
  const credentials = {
    register: async (email: string) =>
      email === 'taken@x.com'
        ? ({ ok: false, reason: 'email-taken' } as const)
        : ({ ok: true, userId: 'u1' } as const),
    login: async (_email: string, password: string) =>
      password === 'certa123'
        ? ({ ok: true, userId: 'u1' } as const)
        : ({ ok: false, reason: 'invalid-credentials' } as const),
  };
  const auth = createAuth({
    credentials,
    kv: {
      get: async (key) => data.get(key) ?? null,
      set: async (key, value) => void (calls.push(`set ${key}`), data.set(key, value)),
      remove: async (key) => void (calls.push(`remove ${key}`), data.delete(key)),
    },
  });
  return { auth, data, calls };
}

test('restore returns null when there is no session', async () => {
  assert.equal(await setup().auth.restore(), null);
});

test('signIn stores the session and restore brings the user back', async () => {
  const { auth, data } = setup();
  assert.deepEqual(await auth.signIn('a@x.com', 'certa123'), { ok: true, userId: 'u1' });
  assert.equal(data.get('rl.session'), 'u1');
  assert.equal(await auth.restore(), 'u1');
});

test('a failed signIn leaves no session', async () => {
  const { auth, data } = setup();
  assert.deepEqual(await auth.signIn('a@x.com', 'errada'), {
    ok: false,
    reason: 'invalid-credentials',
  });
  assert.equal(data.size, 0);
});

test('signUp logs the new user in; a duplicate email does not', async () => {
  const { auth, data } = setup();
  assert.equal((await auth.signUp('taken@x.com', 'certa123')).ok, false);
  assert.equal(data.size, 0);
  assert.equal((await auth.signUp('new@x.com', 'certa123')).ok, true);
  assert.equal(data.get('rl.session'), 'u1');
});

test('signOut deletes the session', async () => {
  const { auth, data } = setup();
  await auth.signIn('a@x.com', 'certa123');
  await auth.signOut();
  assert.equal(data.has('rl.session'), false);
  assert.equal(await auth.restore(), null);
});
