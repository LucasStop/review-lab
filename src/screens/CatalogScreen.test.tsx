import { beforeEach, expect, jest, test } from '@jest/globals';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import type { PullRequestPage, PullRequestSummary } from '../types/github';
import { AppError } from '../utils/appError';
import { CatalogScreen } from './CatalogScreen';

const mockList =
  jest.fn<(page: number, signal?: AbortSignal, refresh?: boolean) => Promise<PullRequestPage>>();
jest.mock('../services/github', () => ({
  listPullRequests: (...args: [number, AbortSignal | undefined, boolean | undefined]) =>
    mockList(...args),
}));

const pr = (number: number): PullRequestSummary => ({
  number,
  title: `PR ${number}`,
  author: 'ana',
});
const page = (numbers: number[], hasNext: boolean): PullRequestPage => ({
  items: numbers.map(pr),
  hasNext,
});

const Stack = createNativeStackNavigator();
const Empty = () => null;

async function renderCatalog() {
  await render(
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Catalog" component={CatalogScreen as never} />
        <Stack.Screen name="Detail" component={Empty} />
      </Stack.Navigator>
    </NavigationContainer>,
  );
}

async function reachEnd() {
  const list = screen.getByTestId('catalog.list');
  await act(async () => {
    list.props.onEndReached?.({ distanceFromEnd: 0 });
  });
}

beforeEach(() => {
  mockList.mockReset();
});

test('C36: shows the ActivityIndicator on the first load, then page 1 as cards', async () => {
  let release: (p: PullRequestPage) => void = () => {};
  mockList.mockReturnValue(new Promise((resolve) => (release = resolve)));
  await renderCatalog();

  expect(screen.getByTestId('loading')).toBeTruthy();
  await act(async () => release(page([3, 2, 1], true)));
  expect(screen.getByTestId('catalog.card.0')).toBeTruthy();
  expect(mockList).toHaveBeenCalledWith(1, undefined, false);
  expect(screen.getByText('PR 3')).toBeTruthy();
  expect(screen.queryByTestId('loading')).toBeNull();
});

test('C11 and C14: reaching the end appends the next page without duplicating a PR', async () => {
  mockList.mockResolvedValueOnce(page([3, 2], true)).mockResolvedValueOnce(page([2, 1], false));
  await renderCatalog();
  await screen.findByTestId('catalog.card.0');

  await reachEnd();

  await waitFor(() => expect(screen.getAllByText(/^PR \d$/)).toHaveLength(3));
  expect(mockList).toHaveBeenLastCalledWith(2, undefined, false);
  expect(screen.getAllByText('PR 2')).toHaveLength(1);
});

test('C36: shows the footer loader while the next page is loading', async () => {
  let release: (p: PullRequestPage) => void = () => {};
  mockList
    .mockResolvedValueOnce(page([2], true))
    .mockReturnValueOnce(new Promise((resolve) => (release = resolve)));
  await renderCatalog();
  await screen.findByTestId('catalog.card.0');

  await reachEnd();
  expect(screen.getByTestId('catalog.footer-loader')).toBeTruthy();

  await act(async () => release(page([1], false)));
  expect(screen.queryByTestId('catalog.footer-loader')).toBeNull();
});

test('C12: without a next page it stops asking', async () => {
  mockList.mockResolvedValue(page([2, 1], false));
  await renderCatalog();
  await screen.findByTestId('catalog.card.0');

  await reachEnd();
  await reachEnd();

  expect(mockList).toHaveBeenCalledTimes(1);
});

test('does not fire two requests for the same page while one is in flight', async () => {
  mockList.mockResolvedValueOnce(page([2], true)).mockReturnValueOnce(new Promise(() => {}));
  await renderCatalog();
  await screen.findByTestId('catalog.card.0');

  await reachEnd();
  await reachEnd();

  expect(mockList).toHaveBeenCalledTimes(2);
});

test('C13: pull-to-refresh reloads page 1 ignoring the cache TTL', async () => {
  mockList.mockResolvedValueOnce(page([2, 1], true)).mockResolvedValueOnce(page([9, 2], true));
  await renderCatalog();
  await screen.findByTestId('catalog.card.0');

  await act(async () => {
    screen.getByTestId('catalog.list').props.onRefresh();
  });

  expect(mockList).toHaveBeenLastCalledWith(1, undefined, true);
  expect(await screen.findByText('PR 9')).toBeTruthy();
  expect(screen.queryByText('PR 1')).toBeNull();
});

test('C52: an empty catalog shows the empty state', async () => {
  mockList.mockResolvedValue(page([], false));
  await renderCatalog();

  expect(await screen.findByTestId('catalog.empty')).toBeTruthy();
  expect(screen.getByText('Nenhum PR encontrado')).toBeTruthy();
});

test('a failure on the first page shows the error with retry, which loads again', async () => {
  mockList
    .mockRejectedValueOnce(new AppError('network', 'Sem conexão. Confira a internet.'))
    .mockResolvedValueOnce(page([1], false));
  await renderCatalog();

  expect(await screen.findByText('Sem conexão. Confira a internet.')).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('Tentar novamente'));
  expect(await screen.findByTestId('catalog.card.0')).toBeTruthy();
});

test('a failure on page 2 keeps the list and shows the error in the footer', async () => {
  mockList
    .mockResolvedValueOnce(page([2], true))
    .mockRejectedValueOnce(new AppError('network', 'Sem conexão. Confira a internet.'))
    .mockResolvedValueOnce(page([1], false));
  await renderCatalog();
  await screen.findByTestId('catalog.card.0');

  await reachEnd();
  expect(await screen.findByTestId('catalog.footer-error')).toBeTruthy();
  expect(screen.getByText('PR 2')).toBeTruthy();

  await fireEvent.press(screen.getByLabelText('Tentar novamente'));
  expect(await screen.findByText('PR 1')).toBeTruthy();
  expect(screen.queryByTestId('catalog.footer-error')).toBeNull();
});

test('a failed pull-to-refresh keeps the list and its retry reloads page 1, not page 2', async () => {
  mockList
    .mockResolvedValueOnce(page([2, 1], true))
    .mockRejectedValueOnce(new AppError('network', 'Sem conexão. Confira a internet.'))
    .mockResolvedValueOnce(page([9, 2], true));
  await renderCatalog();
  await screen.findByTestId('catalog.card.0');

  await act(async () => {
    screen.getByTestId('catalog.list').props.onRefresh();
  });
  expect(await screen.findByTestId('catalog.footer-error')).toBeTruthy();
  expect(screen.getByText('PR 1')).toBeTruthy();

  await fireEvent.press(screen.getByLabelText('Tentar novamente'));
  expect(await screen.findByText('PR 9')).toBeTruthy();
  expect(mockList).toHaveBeenLastCalledWith(1, undefined, true);
});
