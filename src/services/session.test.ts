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
    verify: async (userId: string, password: string) =>
      userId === 'u1' && password === 'certa123'
        ? ({ ok: true, userId } as const)
        : ({ ok: false, reason: 'invalid-credentials' } as const),
    remove: async (userId: string) => void calls.push(`remove-credential ${userId}`),
  };
  const userData = new Map<string, string>([
    ['rl.u1.favorites', '[1]'],
    ['rl.u1.studied', '[2]'],
    ['rl.u2.favorites', '[3]'],
  ]);
  const auth = createAuth({
    credentials,
    removeUserData: async (userId) => {
      for (const key of [...userData.keys()]) {
        if (key.startsWith(`rl.${userId}.`)) userData.delete(key);
      }
    },
    kv: {
      get: async (key) => data.get(key) ?? null,
      set: async (key, value) => void (calls.push(`set ${key}`), data.set(key, value)),
      remove: async (key) => void (calls.push(`remove ${key}`), data.delete(key)),
    },
  });
  return { auth, data, calls, userData };
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

test('C59: deleteAccount with a wrong password deletes nothing', async () => {
  const { auth, data, calls, userData } = setup();
  await auth.signIn('a@x.com', 'certa123');
  const result = await auth.deleteAccount('u1', 'errada123');
  assert.deepEqual(result, { ok: false, reason: 'invalid-credentials' });
  assert.equal(data.get('rl.session'), 'u1');
  assert.equal(userData.size, 3);
  assert.equal(calls.filter((c) => c.startsWith('remove')).length, 0);
});

test('C60: deleteAccount with the right password removes credential, session and user data', async () => {
  const { auth, data, calls, userData } = setup();
  await auth.signIn('a@x.com', 'certa123');
  assert.deepEqual(await auth.deleteAccount('u1', 'certa123'), { ok: true, userId: 'u1' });
  assert.equal(await auth.restore(), null);
  assert.equal(data.has('rl.session'), false);
  assert.ok(calls.includes('remove-credential u1'));
  assert.equal(userData.has('rl.u1.favorites'), false);
  assert.equal(userData.has('rl.u1.studied'), false);
});

test('C61: deleteAccount leaves another user data alone', async () => {
  const { auth, userData } = setup();
  await auth.deleteAccount('u1', 'certa123');
  assert.equal(userData.get('rl.u2.favorites'), '[3]');
});

test('deleteAccount removes the session before the credential, so a failure keeps the account enterable', async () => {
  const { auth, calls } = setup();
  await auth.signIn('a@x.com', 'certa123');
  await auth.deleteAccount('u1', 'certa123');
  const removals = calls.filter((c) => c.startsWith('remove'));
  assert.deepEqual(removals, ['remove rl.session', 'remove-credential u1']);
});
