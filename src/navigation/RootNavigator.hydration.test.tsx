import { beforeEach, expect, jest, test } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer, type InitialState } from '@react-navigation/native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { AuthProvider } from '../contexts/AuthContext';
import type { AuthResult } from '../services/credentials';
import type { PullRequestDetailView, PullRequestPage } from '../types/github';
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

const mockList = jest.fn<() => Promise<PullRequestPage>>();
const mockGet = jest.fn<() => Promise<PullRequestDetailView>>();
jest.mock('../services/github', () => ({
  listPullRequests: () => mockList(),
  getPullRequest: () => mockGet(),
}));

const saved = { number: 7, title: 'Saved parser fix', author: 'ana' };

// Segura a leitura de favoritos e estudados até o teste chamar `release`; o resto do
// AsyncStorage responde na hora. O mock do AsyncStorage já é um jest.fn, então o spy é ele
// mesmo: ler pelo `getItem` original entraria em loop, e o `multiGet` lê o mesmo armazenamento.
function holdLists({ fail = false } = {}) {
  const read = async (key: string) => (await AsyncStorage.multiGet([key]))[0][1];
  let open: () => void = () => {};
  const gate = new Promise<void>((resolve) => (open = resolve));
  jest.spyOn(AsyncStorage, 'getItem').mockImplementation(async (key: string) => {
    if (!/\.(favorites|studied)$/.test(key)) return read(key);
    await gate;
    if (fail) throw new Error('disk down');
    return read(key);
  });
  return () => act(async () => open());
}

async function renderApp(initialState?: InitialState) {
  await render(
    <AuthProvider>
      <NavigationContainer initialState={initialState}>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>,
  );
}

beforeEach(async () => {
  Object.values(mockAuth).forEach((fn) => fn.mockReset());
  mockAuth.restore.mockResolvedValue('u1');
  mockList.mockResolvedValue({
    items: [{ number: 1, title: 'Remote PR', author: 'bia' }],
    hasNext: false,
  });
  mockGet.mockResolvedValue({
    ...saved,
    htmlUrl: 'https://github.com/o/r/pull/7',
    merged: true,
    comments: 0,
    reviewComments: 0,
    changedFiles: 1,
    additions: 1,
    deletions: 0,
    blocks: [],
  });
  await AsyncStorage.clear();
  await AsyncStorage.setItem('rl.u1.favorites', JSON.stringify([saved]));
  await AsyncStorage.setItem('rl.u1.studied', JSON.stringify([{ ...saved, rating: 5 }]));
});

test('C26: Salvos never shows the empty state while favorites load, then lists the saved PR', async () => {
  const release = holdLists();
  await renderApp();

  expect(screen.getByTestId('loading')).toBeTruthy();
  // Sem o Catálogo montado não há chip para chegar ao vazio de Salvos.
  expect(screen.queryByTestId('catalog.filter.saved')).toBeNull();
  expect(screen.queryByTestId('catalog.empty')).toBeNull();

  await release();
  await fireEvent.press(await screen.findByTestId('catalog.filter.saved'));
  expect(await screen.findByText('Saved parser fix')).toBeTruthy();
  expect(screen.queryByTestId('catalog.empty')).toBeNull();
});

test('C26: the detail buttons never show off while the lists load', async () => {
  const release = holdLists();
  await renderApp({
    routes: [{ name: 'Catalog' }, { name: 'Detail', params: { number: 7 } }],
  });

  expect(screen.getByTestId('loading')).toBeTruthy();
  expect(screen.queryByTestId('detail.save')).toBeNull();
  expect(screen.queryByTestId('detail.studied')).toBeNull();

  await release();
  expect((await screen.findByTestId('detail.save')).props.accessibilityState).toMatchObject({
    selected: true,
  });
  expect(screen.getByTestId('detail.studied').props.accessibilityState).toMatchObject({
    selected: true,
  });
  expect(screen.getByTestId('detail.rating')).toBeTruthy();
});

test('C26: a failed read lets the gate open on the empty state instead of hanging', async () => {
  const release = holdLists({ fail: true });
  await renderApp();

  expect(screen.getByTestId('loading')).toBeTruthy();

  await release();
  await fireEvent.press(await screen.findByTestId('catalog.filter.saved'));
  expect(await screen.findByText('Você ainda não salvou nenhum PR')).toBeTruthy();
});
