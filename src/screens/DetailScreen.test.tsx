import { beforeEach, expect, jest, test } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Linking, StyleSheet } from 'react-native';

import type { PullRequestDetailView } from '../types/github';
import { FavoritesProvider } from '../contexts/FavoritesContext';
import { StudiedProvider } from '../contexts/StudiedContext';
import { touch } from '../theme';
import { AppError } from '../utils/appError';
import { DetailScreen } from './DetailScreen';

const mockGet =
  jest.fn<(n: number, signal?: AbortSignal, refresh?: boolean) => Promise<PullRequestDetailView>>();
jest.mock('../services/github', () => ({
  getPullRequest: (...args: [number, AbortSignal | undefined]) => mockGet(...args),
}));

const detail = (over: Partial<PullRequestDetailView> = {}): PullRequestDetailView => ({
  number: 7,
  title: 'Fix the parser',
  author: 'ana',
  htmlUrl: 'https://github.com/o/r/pull/7',
  merged: true,
  comments: 2,
  reviewComments: 3,
  changedFiles: 4,
  additions: 10,
  deletions: 5,
  blocks: [
    {
      type: 'paragraph',
      content: [{ text: 'Veja ' }, { text: 'aqui', href: 'https://example.com/x' }],
    },
  ],
  ...over,
});

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();

async function renderDetail() {
  await render(
    <FavoritesProvider userId="u1">
      <StudiedProvider userId="u1">
        <NavigationContainer ref={navRef}>
          <Stack.Navigator>
            <Stack.Screen
              name="Detail"
              component={DetailScreen as never}
              initialParams={{ number: 7 }}
              options={{ title: 'PR #7' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </StudiedProvider>
    </FavoritesProvider>,
  );
}

const stateOf = (label: string) => screen.getByLabelText(label).props.accessibilityState;

beforeEach(async () => {
  mockGet.mockReset();
  jest.restoreAllMocks();
  await AsyncStorage.clear();
});

test('C36: shows the loader while the detail loads', async () => {
  mockGet.mockReturnValue(new Promise(() => {}));
  await renderDetail();

  expect(screen.getByTestId('loading')).toBeTruthy();
  expect(screen.getByLabelText('Carregando')).toBe(screen.getByTestId('loading'));
  expect(mockGet).toHaveBeenCalledWith(7, expect.anything());
});

test('C16, C53: shows title, stats and body from the PR fetched by number', async () => {
  mockGet.mockResolvedValue(detail());
  await renderDetail();

  expect((await screen.findByTestId('detail.title')).props.children).toBe('Fix the parser');
  expect(screen.getByTestId('detail.stats')).toHaveTextContent(/5 comentários/);
  expect(screen.getByTestId('detail.stats')).toHaveTextContent(/4 arquivos/);
  expect(screen.getByTestId('detail.stats')).toHaveTextContent(/\+10/);
  expect(screen.getByTestId('detail.body')).toHaveTextContent('Veja aqui');
});

test('C16: one comment and one file are written in the singular', async () => {
  mockGet.mockResolvedValue(detail({ comments: 1, reviewComments: 0, changedFiles: 1 }));
  await renderDetail();

  expect(await screen.findByTestId('detail.stats')).toHaveTextContent(
    /^1 comentário · 1 arquivo ·/,
  );
});

test('C17: a PR without description shows "Sem descrição", not an error', async () => {
  mockGet.mockResolvedValue(detail({ blocks: [] }));
  await renderDetail();

  expect(await screen.findByText('Sem descrição')).toBeTruthy();
  expect(screen.queryByTestId('detail.error')).toBeNull();
});

test('C20: a link in the body opens through Linking', async () => {
  const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
  mockGet.mockResolvedValue(detail());
  await renderDetail();

  await fireEvent.press(await screen.findByText('aqui'));
  expect(open).toHaveBeenCalledWith('https://example.com/x');
});

test('C37: an error offers "Tentar novamente" and retries the same PR', async () => {
  mockGet.mockRejectedValueOnce(new AppError('network', 'Sem conexão'));
  mockGet.mockResolvedValueOnce(detail());
  await renderDetail();

  expect(await screen.findByTestId('detail.error')).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('Tentar novamente'));
  await act(async () => {});
  expect(await screen.findByTestId('detail.title')).toBeTruthy();
  expect(mockGet).toHaveBeenCalledTimes(2);
});

test('C53: the header shows "PR #n" while loading and the PR title once it arrives', async () => {
  let release: (d: PullRequestDetailView) => void = () => {};
  mockGet.mockReturnValue(new Promise((resolve) => (release = resolve)));
  await renderDetail();

  expect((navRef.getCurrentOptions() as { title?: string }).title).toBe('PR #7');
  await act(async () => release(detail()));
  expect((navRef.getCurrentOptions() as { title?: string }).title).toBe('Fix the parser');
});

test('C20: a link that is not http(s) is not tappable', async () => {
  const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
  open.mockClear();
  mockGet.mockResolvedValue(
    detail({
      blocks: [{ type: 'paragraph', content: [{ text: 'ruim', href: 'javascript:alert(1)' }] }],
    }),
  );
  await renderDetail();

  await fireEvent.press(await screen.findByText('ruim'));
  expect(open).not.toHaveBeenCalled();
});

test('C44: the save button reports its state and flips on press', async () => {
  mockGet.mockResolvedValue(detail());
  await renderDetail();

  const save = await screen.findByTestId('detail.save');
  expect(save.props.accessibilityState).toMatchObject({ selected: false });
  expect(screen.getByLabelText('Salvar para estudar')).toBeTruthy();

  await fireEvent.press(save);
  expect(screen.getByTestId('detail.save').props.accessibilityState).toMatchObject({
    selected: true,
  });
  expect(screen.getByLabelText('Salvo para estudar')).toBeTruthy();
});

test('C28: marking as studied stores rating 4, shows the stars and another star changes it', async () => {
  mockGet.mockResolvedValue(detail());
  await renderDetail();

  const studied = await screen.findByTestId('detail.studied');
  expect(studied.props.accessibilityState).toMatchObject({ selected: false });
  expect(screen.queryByTestId('detail.rating')).toBeNull();

  await fireEvent.press(studied);
  expect(screen.getByTestId('detail.studied').props.accessibilityState).toMatchObject({
    selected: true,
  });
  expect(screen.getByLabelText('Estudado')).toBeTruthy();
  expect(screen.getByText('Nota de utilidade')).toBeTruthy();
  expect(stateOf('Dar nota 4 de 5')).toMatchObject({ selected: true });

  await fireEvent.press(screen.getByLabelText('Dar nota 2 de 5'));
  expect(stateOf('Dar nota 2 de 5')).toMatchObject({ selected: true });
  expect(stateOf('Dar nota 4 de 5')).toMatchObject({ selected: false });
});

test('C28: reopening the detail shows the stored rating', async () => {
  mockGet.mockResolvedValue(detail());
  await renderDetail();
  await fireEvent.press(await screen.findByTestId('detail.studied'));
  await fireEvent.press(screen.getByLabelText('Dar nota 5 de 5'));
  await screen.unmount();

  // Os providers montam de novo: a nota só pode vir do AsyncStorage.
  await renderDetail();
  expect((await screen.findByTestId('detail.studied')).props.accessibilityState).toMatchObject({
    selected: true,
  });
  expect(stateOf('Dar nota 5 de 5')).toMatchObject({ selected: true });
});

test('C29: unmarking hides the rating and stays unmarked after reopening', async () => {
  mockGet.mockResolvedValue(detail());
  await renderDetail();
  await fireEvent.press(await screen.findByTestId('detail.studied'));
  await fireEvent.press(screen.getByTestId('detail.studied'));

  expect(screen.getByTestId('detail.studied').props.accessibilityState).toMatchObject({
    selected: false,
  });
  expect(screen.getByLabelText('Marcar como estudado')).toBeTruthy();
  expect(screen.queryByTestId('detail.rating')).toBeNull();

  await screen.unmount();
  await renderDetail();
  expect((await screen.findByTestId('detail.studied')).props.accessibilityState).toMatchObject({
    selected: false,
  });
  expect(screen.queryByTestId('detail.rating')).toBeNull();
});

test.each(['detail.save', 'detail.studied'])('C45: %s is at least 44x44', async (testID) => {
  mockGet.mockResolvedValue(detail());
  await renderDetail();

  const style = StyleSheet.flatten((await screen.findByTestId(testID)).props.style);
  expect(style.minWidth).toBeGreaterThanOrEqual(touch.min);
  expect(style.minHeight).toBeGreaterThanOrEqual(touch.min);
});
