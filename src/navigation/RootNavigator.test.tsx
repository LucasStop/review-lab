import { beforeEach, expect, jest, test } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { fireEvent, render, screen, within } from '@testing-library/react-native';
import { createHash } from 'node:crypto';

import { AuthProvider } from '../contexts/AuthContext';
import { createCredentials, type AuthResult } from '../services/credentials';
import { createAuth, type Session } from '../services/session';
import { removeUserKeys } from '../services/storage';
import { RootNavigator } from './RootNavigator';

const mockAuth = {
  restore: jest.fn<() => Promise<Session | null>>(),
  signIn: jest.fn<(email: string, password: string) => Promise<AuthResult>>(),
  signUp: jest.fn<(email: string, password: string) => Promise<AuthResult>>(),
  signOut: jest.fn<() => Promise<void>>(),
  deleteAccount: jest.fn<(userId: string, password: string) => Promise<AuthResult>>(),
};
// Os testes de integração trocam o mock pelo createAuth de verdade, com SecureStore em memória.
let mockRealAuth: ReturnType<typeof createAuth> | null = null;
// Getter: a fábrica roda no hoist, antes do `const mockAuth` existir.
jest.mock('../services/appAuth', () => ({
  get auth() {
    return mockRealAuth ?? mockAuth;
  },
}));

// O Catálogo real traz rede e parser de HTML; aqui só importa qual pilha aparece.
jest.mock('../screens/CatalogScreen', () => ({ CatalogScreen: () => null }));
jest.mock('../screens/DetailScreen', () => ({ DetailScreen: () => null }));

async function renderApp() {
  await render(
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>,
  );
}

// Mesma ligação do appAuth.ts, sem módulo nativo: SHA-256 do node e o mock do AsyncStorage.
function withRealAuth() {
  const secure = new Map<string, string>();
  const kv = {
    get: async (key: string) => secure.get(key) ?? null,
    set: async (key: string, value: string) => void secure.set(key, value),
    remove: async (key: string) => void secure.delete(key),
  };
  const credentials = createCredentials({
    kv,
    sha256: async (text) => createHash('sha256').update(text).digest('hex'),
    randomSalt: async () => 'salt',
  });
  mockRealAuth = createAuth({
    credentials,
    kv,
    removeUserData: (userId) => removeUserKeys(userId, AsyncStorage),
  });
  return { secure, auth: mockRealAuth, credentials };
}

const pr = (number: number) => ({ number, title: `t${number}`, author: 'ana' });

async function seedLists(userId: string) {
  await AsyncStorage.setItem(`rl.${userId}.favorites`, JSON.stringify([pr(1)]));
  await AsyncStorage.setItem(`rl.${userId}.studied`, JSON.stringify([{ ...pr(2), rating: 4 }]));
}

async function openProfile() {
  await fireEvent.press(await screen.findByTestId('catalog.profile'));
  await screen.findByTestId('profile.email');
}

async function logOutFromProfile() {
  await openProfile();
  await fireEvent.press(screen.getByTestId('profile.logout'));
  await fireEvent.press(screen.getByTestId('profile.confirm'));
}

async function fillForm(id: 'login' | 'signup', email: string, password: string) {
  await fireEvent.changeText(await screen.findByTestId(`${id}.email`), email);
  await fireEvent.changeText(screen.getByTestId(`${id}.password`), password);
  await fireEvent.press(screen.getByTestId(`${id}.submit`));
}

beforeEach(async () => {
  mockRealAuth = null;
  await AsyncStorage.clear();
  Object.values(mockAuth).forEach((fn) => fn.mockReset());
  mockAuth.signOut.mockResolvedValue();
});

test('C51: without a session the app opens on the login and never reaches the AppStack', async () => {
  mockAuth.restore.mockResolvedValue(null);
  await renderApp();

  expect(await screen.findByTestId('login.screen')).toBeTruthy();
  expect(screen.queryByTestId('catalog.profile')).toBeNull();
});

test('shows only the ActivityIndicator while the session is being read, never the login', async () => {
  mockAuth.restore.mockReturnValue(new Promise(() => {}));
  await renderApp();

  expect(screen.getByTestId('loading')).toBeTruthy();
  expect(screen.queryByTestId('login.screen')).toBeNull();
});

test('C06: a stored session opens the catalog directly', async () => {
  mockAuth.restore.mockResolvedValue({ userId: 'u1', email: 'ana@exemplo.com' });
  await renderApp();

  expect(await screen.findByTestId('catalog.profile')).toBeTruthy();
  expect(screen.queryByTestId('login.screen')).toBeNull();
});

test('C07: logging out from the Profile clears the session and shows the login without navigate()', async () => {
  mockAuth.restore.mockResolvedValue({ userId: 'u1', email: 'ana@exemplo.com' });
  await renderApp();

  await logOutFromProfile();
  expect(mockAuth.signOut).toHaveBeenCalledTimes(1);
  expect(await screen.findByTestId('login.screen')).toBeTruthy();
  expect(screen.queryByTestId('catalog.profile')).toBeNull();
});

test('logging out still shows the login when clearing the stored session fails', async () => {
  mockAuth.restore.mockResolvedValue({ userId: 'u1', email: 'ana@exemplo.com' });
  mockAuth.signOut.mockRejectedValue(new Error('storage down'));
  await renderApp();

  await logOutFromProfile();
  expect(await screen.findByTestId('login.screen')).toBeTruthy();
});

test('a successful sign-in swaps the login for the catalog', async () => {
  mockAuth.restore.mockResolvedValue(null);
  mockAuth.signIn.mockResolvedValue({ ok: true, userId: 'u1' });
  await renderApp();

  await fireEvent.changeText(await screen.findByTestId('login.email'), 'ana@exemplo.com');
  await fireEvent.changeText(screen.getByTestId('login.password'), 'segredo123');
  await fireEvent.press(screen.getByTestId('login.submit'));

  expect(await screen.findByTestId('catalog.profile')).toBeTruthy();
  expect(screen.queryByTestId('login.screen')).toBeNull();
});

test('C58: confirming logout clears only the session; saved and studied come back on the next login', async () => {
  const { secure, auth, credentials } = withRealAuth();
  const registered = await credentials.register('ana@exemplo.com', 'segredo123');
  if (!registered.ok) throw new Error('cadastro falhou');
  await seedLists(registered.userId);
  await auth.signIn('ana@exemplo.com', 'segredo123');
  await renderApp();

  await logOutFromProfile();
  await screen.findByTestId('login.screen');
  expect(secure.has('rl.session')).toBe(false);
  expect(secure.has(`rl.cred.${registered.userId}`)).toBe(true);
  expect(await AsyncStorage.getItem(`rl.${registered.userId}.favorites`)).not.toBeNull();

  await fillForm('login', 'ana@exemplo.com', 'segredo123');
  await openProfile();
  expect(await within(screen.getByTestId('profile.avg')).findByText('4,0')).toBeTruthy();
  expect(screen.getByTestId('profile.saved-count')).toHaveTextContent('1salvos');
  expect(screen.getByTestId('profile.studied-count')).toHaveTextContent('1estudados');

  // C05: depois do cadastro e de dois logins, o e-mail só existe na sessão do SecureStore.
  const stored = await AsyncStorage.multiGet(await AsyncStorage.getAllKeys());
  const credentialEntries = [...secure].filter(([key]) => key.startsWith('rl.cred.'));
  for (const [key, value] of [...stored, ...credentialEntries]) {
    expect(`${key} ${value}`).not.toContain('ana@exemplo.com');
  }
  expect(credentialEntries).toHaveLength(1);
});

test('C60, C61: deleting the account removes only its data, goes to the login and the email can sign up again', async () => {
  const { secure, auth, credentials } = withRealAuth();
  const ana = await credentials.register('ana@exemplo.com', 'segredo123');
  const bia = await credentials.register('bia@exemplo.com', 'segredo456');
  if (!ana.ok || !bia.ok) throw new Error('cadastro falhou');
  await seedLists(ana.userId);
  await seedLists(bia.userId);
  await auth.signIn('ana@exemplo.com', 'segredo123');
  await renderApp();

  await openProfile();
  await fireEvent.press(screen.getByTestId('profile.delete'));
  await fireEvent.changeText(screen.getByTestId('profile.password'), 'segredo123');
  await fireEvent.press(screen.getByTestId('profile.confirm'));

  // C60: credencial, sessão e as chaves rl.<userId>.* somem, e o app volta ao Login.
  expect(await screen.findByTestId('login.screen')).toBeTruthy();
  expect(secure.has('rl.session')).toBe(false);
  expect(secure.has(`rl.cred.${ana.userId}`)).toBe(false);
  expect(await AsyncStorage.getItem(`rl.${ana.userId}.favorites`)).toBeNull();
  expect(await AsyncStorage.getItem(`rl.${ana.userId}.studied`)).toBeNull();

  // C61: a outra conta do aparelho fica intacta.
  expect(secure.has(`rl.cred.${bia.userId}`)).toBe(true);
  expect(await AsyncStorage.getItem(`rl.${bia.userId}.favorites`)).not.toBeNull();
  expect(await AsyncStorage.getItem(`rl.${bia.userId}.studied`)).not.toBeNull();

  // C61: o mesmo e-mail cadastra de novo e começa vazio.
  await fireEvent.press(screen.getByTestId('login.signup'));
  await fillForm('signup', 'ana@exemplo.com', 'nova1234');
  await openProfile();
  expect(screen.getByTestId('profile.email')).toHaveTextContent('ana@exemplo.com');
  expect(screen.getByTestId('profile.saved-count')).toHaveTextContent('0salvos');
});
