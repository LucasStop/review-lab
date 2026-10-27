import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createAuth, parseSession } from './session.ts';

// O parseSession só aceita o hash de 64 hex que o credentials gera como userId.
const U1 = 'b'.repeat(64);

function setup() {
  const data = new Map<string, string>();
  const calls: string[] = [];
  const credentials = {
    register: async (email: string) =>
      email === 'taken@x.com'
        ? ({ ok: false, reason: 'email-taken' } as const)
        : ({ ok: true, userId: U1 } as const),
    login: async (_email: string, password: string) =>
      password === 'certa123'
        ? ({ ok: true, userId: U1 } as const)
        : ({ ok: false, reason: 'invalid-credentials' } as const),
    verify: async (userId: string, password: string) =>
      userId === U1 && password === 'certa123'
        ? ({ ok: true, userId } as const)
        : ({ ok: false, reason: 'invalid-credentials' } as const),
    remove: async (userId: string) => void calls.push(`remove-credential ${userId}`),
  };
  const userData = new Map<string, string>([
    [`rl.${U1}.favorites`, '[1]'],
    [`rl.${U1}.studied`, '[2]'],
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

test('signIn stores the session with the normalized email and restore brings the user back', async () => {
  const { auth, data } = setup();
  assert.deepEqual(await auth.signIn(' Ana@X.com ', 'certa123'), { ok: true, userId: U1 });
  assert.deepEqual(JSON.parse(data.get('rl.session')!), { userId: U1, email: 'ana@x.com' });
  assert.deepEqual(await auth.restore(), { userId: U1, email: 'ana@x.com' });
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
  assert.equal((await auth.signUp('New@x.com', 'certa123')).ok, true);
  assert.deepEqual(await auth.restore(), { userId: U1, email: 'new@x.com' });
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
  const result = await auth.deleteAccount(U1, 'errada123');
  assert.deepEqual(result, { ok: false, reason: 'invalid-credentials' });
  assert.equal((await auth.restore())?.userId, U1);
  assert.ok(data.has('rl.session'));
  assert.equal(userData.size, 3);
  assert.equal(calls.filter((c) => c.startsWith('remove')).length, 0);
});

test('C60: deleteAccount with the right password removes credential, session and user data', async () => {
  const { auth, data, calls, userData } = setup();
  await auth.signIn('a@x.com', 'certa123');
  assert.deepEqual(await auth.deleteAccount(U1, 'certa123'), { ok: true, userId: U1 });
  assert.equal(await auth.restore(), null);
  assert.equal(data.has('rl.session'), false);
  assert.ok(calls.includes(`remove-credential ${U1}`));
  assert.equal(userData.has(`rl.${U1}.favorites`), false);
  assert.equal(userData.has(`rl.${U1}.studied`), false);
});

test('C61: deleteAccount leaves another user data alone', async () => {
  const { auth, userData } = setup();
  await auth.deleteAccount(U1, 'certa123');
  assert.equal(userData.get('rl.u2.favorites'), '[3]');
});

test('deleteAccount removes the session before the credential, so a failure keeps the account enterable', async () => {
  const { auth, calls } = setup();
  await auth.signIn('a@x.com', 'certa123');
  await auth.deleteAccount(U1, 'certa123');
  const removals = calls.filter((c) => c.startsWith('remove'));
  assert.deepEqual(removals, ['remove rl.session', `remove-credential ${U1}`]);
});

const OLD_ID = 'a'.repeat(64);

test('parseSession reads the new JSON format', () => {
  assert.deepEqual(parseSession(JSON.stringify({ userId: OLD_ID, email: 'a@x.com' })), {
    userId: OLD_ID,
    email: 'a@x.com',
  });
});

test('parseSession keeps a session stored in the old format (only the userId), without email', () => {
  assert.deepEqual(parseSession(OLD_ID), { userId: OLD_ID });
  // Só dígitos: o JSON.parse devolveria um número e a sessão sumiria.
  const digits = '1'.repeat(64);
  assert.deepEqual(parseSession(digits), { userId: digits });
});

test('parseSession turns corrupted or unknown values into no session', () => {
  for (const raw of ['{"userId":', '12345', '"texto"', 'null', '[]', '{}', '{"email":"a@x.com"}']) {
    assert.equal(parseSession(raw), null, raw);
  }
  assert.equal(parseSession('{"userId":42}'), null);
  // O userId vira parte das chaves `rl.<userId>.*` e `rl.cred.<userId>`: só o hash de 64 hex vale.
  assert.equal(parseSession(JSON.stringify({ userId: '../x', email: 'a@x.com' })), null);
  assert.equal(parseSession(JSON.stringify({ userId: 'abc' })), null);
  assert.equal(parseSession(JSON.stringify({ userId: 'a'.repeat(63) })), null);
  assert.equal(parseSession(null), null);
});

test('restore reads a session from the old format', async () => {
  const { auth, data } = setup();
  data.set('rl.session', OLD_ID);
  assert.deepEqual(await auth.restore(), { userId: OLD_ID });
});
