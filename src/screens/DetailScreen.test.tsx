import { beforeEach, expect, jest, test } from '@jest/globals';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Linking } from 'react-native';

import type { PullRequestDetailView } from '../types/github';
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

async function renderDetail() {
  await render(
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Detail"
          component={DetailScreen as never}
          initialParams={{ number: 7 }}
          options={{ title: 'PR #7' }}
        />
      </Stack.Navigator>
    </NavigationContainer>,
  );
}

beforeEach(() => {
  mockGet.mockReset();
  jest.restoreAllMocks();
});

test('C36: shows the loader while the detail loads', async () => {
  mockGet.mockReturnValue(new Promise(() => {}));
  await renderDetail();

  expect(screen.getByTestId('loading')).toBeTruthy();
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

test('C26: an error offers "Tentar novamente" and retries the same PR', async () => {
  mockGet.mockRejectedValueOnce(new AppError('network', 'Sem conexão'));
  mockGet.mockResolvedValueOnce(detail());
  await renderDetail();

  expect(await screen.findByTestId('detail.error')).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('Tentar novamente'));
  await act(async () => {});
  expect(await screen.findByTestId('detail.title')).toBeTruthy();
  expect(mockGet).toHaveBeenCalledTimes(2);
});
