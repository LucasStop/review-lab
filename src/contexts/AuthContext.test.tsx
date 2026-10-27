import { beforeEach, expect, jest, test } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import type { AuthResult } from '../services/credentials';
import type { Session } from '../services/session';
import { AuthProvider, useAuth } from './AuthContext';

const mockAuth = {
  restore: jest.fn<() => Promise<Session | null>>(),
  signIn: jest.fn<(email: string, password: string) => Promise<AuthResult>>(),
  signUp: jest.fn<(email: string, password: string) => Promise<AuthResult>>(),
  signOut: jest.fn<() => Promise<void>>(),
  deleteAccount: jest.fn<(userId: string, password: string) => Promise<AuthResult>>(),
};
jest.mock('../services/appAuth', () => ({
  get auth() {
    return mockAuth;
  },
}));

const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>;

async function signedIn() {
  mockAuth.restore.mockResolvedValue({ userId: 'u1', email: 'ana@exemplo.com' });
  const hook = await renderHook(() => useAuth(), { wrapper });
  await waitFor(() =>
    expect(hook.result.current.user).toEqual({ id: 'u1', email: 'ana@exemplo.com' }),
  );
  return hook;
}

beforeEach(() => {
  Object.values(mockAuth).forEach((fn) => fn.mockReset());
});

test('C59: a wrong password keeps the session and returns the login error', async () => {
  const { result } = await signedIn();
  mockAuth.deleteAccount.mockResolvedValue({ ok: false, reason: 'invalid-credentials' });

  let outcome: AuthResult | undefined;
  await act(async () => {
    outcome = await result.current.deleteAccount('errada123');
  });

  expect(outcome).toEqual({ ok: false, reason: 'invalid-credentials' });
  expect(mockAuth.deleteAccount).toHaveBeenCalledWith('u1', 'errada123');
  expect(result.current.user).toEqual({ id: 'u1', email: 'ana@exemplo.com' });
});

test('C60: the right password deletes the account and drops the session', async () => {
  const { result } = await signedIn();
  mockAuth.deleteAccount.mockResolvedValue({ ok: true, userId: 'u1' });

  await act(async () => {
    await result.current.deleteAccount('certa123');
  });

  expect(result.current.user).toBeNull();
});
