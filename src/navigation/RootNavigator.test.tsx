import { beforeEach, expect, jest, test } from '@jest/globals';
import { NavigationContainer } from '@react-navigation/native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { AuthProvider } from '../contexts/AuthContext';
import type { AuthResult } from '../services/credentials';
import { RootNavigator } from './RootNavigator';

const mockAuth = {
  restore: jest.fn<() => Promise<string | null>>(),
  signIn: jest.fn<(email: string, password: string) => Promise<AuthResult>>(),
  signUp: jest.fn<(email: string, password: string) => Promise<AuthResult>>(),
  signOut: jest.fn<() => Promise<void>>(),
  deleteAccount: jest.fn<(userId: string, password: string) => Promise<AuthResult>>(),
};
// Getter: a fábrica roda no hoist, antes do `const mockAuth` existir.
jest.mock('../services/appAuth', () => ({
  get auth() {
    return mockAuth;
  },
}));

async function renderApp() {
  await render(
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>,
  );
}

beforeEach(() => {
  Object.values(mockAuth).forEach((fn) => fn.mockReset());
  mockAuth.signOut.mockResolvedValue();
});

test('C51: without a session the app opens on the login and never reaches the AppStack', async () => {
  mockAuth.restore.mockResolvedValue(null);
  await renderApp();

  expect(await screen.findByTestId('login.screen')).toBeTruthy();
  expect(screen.queryByTestId('catalog.logout')).toBeNull();
});

test('shows only the ActivityIndicator while the session is being read, never the login', async () => {
  mockAuth.restore.mockReturnValue(new Promise(() => {}));
  await renderApp();

  expect(screen.getByTestId('loading')).toBeTruthy();
  expect(screen.queryByTestId('login.screen')).toBeNull();
});

test('C06: a stored session opens the catalog directly', async () => {
  mockAuth.restore.mockResolvedValue('u1');
  await renderApp();

  expect(await screen.findByTestId('catalog.logout')).toBeTruthy();
  expect(screen.queryByTestId('login.screen')).toBeNull();
});

test('C07: logging out clears the session and shows the login without navigate()', async () => {
  mockAuth.restore.mockResolvedValue('u1');
  await renderApp();

  await fireEvent.press(await screen.findByTestId('catalog.logout'));
  expect(mockAuth.signOut).toHaveBeenCalledTimes(1);
  expect(await screen.findByTestId('login.screen')).toBeTruthy();
  expect(screen.queryByTestId('catalog.logout')).toBeNull();
});

test('logging out still shows the login when clearing the stored session fails', async () => {
  mockAuth.restore.mockResolvedValue('u1');
  mockAuth.signOut.mockRejectedValue(new Error('storage down'));
  await renderApp();

  await fireEvent.press(await screen.findByTestId('catalog.logout'));
  expect(await screen.findByTestId('login.screen')).toBeTruthy();
});

test('a successful sign-in swaps the login for the catalog', async () => {
  mockAuth.restore.mockResolvedValue(null);
  mockAuth.signIn.mockResolvedValue({ ok: true, userId: 'u1' });
  await renderApp();

  await fireEvent.changeText(await screen.findByTestId('login.email'), 'ana@exemplo.com');
  await fireEvent.changeText(screen.getByTestId('login.password'), 'segredo123');
  await fireEvent.press(screen.getByTestId('login.submit'));

  expect(await screen.findByTestId('catalog.logout')).toBeTruthy();
  expect(screen.queryByTestId('login.screen')).toBeNull();
});
