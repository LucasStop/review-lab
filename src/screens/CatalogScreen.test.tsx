import { beforeEach, expect, jest, test } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Dimensions, Keyboard, StyleSheet, Text } from 'react-native';

import type { PullRequestPage, PullRequestSummary } from '../types/github';
import { FavoritesProvider } from '../contexts/FavoritesContext';
import { LayoutProvider } from '../contexts/LayoutContext';
import { StudiedProvider } from '../contexts/StudiedContext';
import { spacing, touch } from '../theme';
import { AppError } from '../utils/appError';
import { CatalogScreen } from './CatalogScreen';

const mockList =
  jest.fn<(page: number, signal?: AbortSignal, refresh?: boolean) => Promise<PullRequestPage>>();
const mockSearch = jest.fn<(term: string, signal?: AbortSignal) => Promise<PullRequestSummary[]>>();
jest.mock('../services/github', () => ({
  listPullRequests: (...args: [number, AbortSignal | undefined, boolean | undefined]) =>
    mockList(...args),
  searchPullRequests: (...args: [string, AbortSignal | undefined]) => mockSearch(...args),
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
const studied = [
  { ...pr(5), rating: 4 },
  { ...pr(6), rating: 2 },
];
// Salvos e Estudados vêm dos Contexts e tratam a lista paginada do mesmo jeito.
const LOCAL_FILTERS = [
  { name: 'Salvos', storage: 'rl.u1.favorites', items: [pr(5), pr(6)] },
  { name: 'Estudados', storage: 'rl.u1.studied', items: studied },
] as const;

const Stack = createNativeStackNavigator();
const Detail = ({ route }: { route: { params: { number: number } } }) => (
  <Text>{`Detalhe ${route.params.number}`}</Text>
);

async function renderCatalog() {
  await render(
    <FavoritesProvider userId="u1">
      <StudiedProvider userId="u1">
        <LayoutProvider userId="u1">
          <NavigationContainer>
            <Stack.Navigator>
              <Stack.Screen name="Catalog" component={CatalogScreen as never} />
              <Stack.Screen name="Detail" component={Detail as never} />
            </Stack.Navigator>
          </NavigationContainer>
        </LayoutProvider>
      </StudiedProvider>
    </FavoritesProvider>,
  );
}

// O card não tem `width`; quem o recebe é o `View` em volta, montado pelo `renderItem`. Sobe
// pelos pais até ele, porque o RNTL 14 não tem mais `UNSAFE_getByType`.
function cardWidth(index: number) {
  let node = screen.getByTestId(`catalog.card.${index}`).parent;
  while (node && StyleSheet.flatten(node.props.style)?.width === undefined) node = node.parent;
  return node ? StyleSheet.flatten(node.props.style).width : undefined;
}

async function reachEnd() {
  const list = screen.getByTestId('catalog.list');
  await act(async () => {
    list.props.onEndReached?.({ distanceFromEnd: 0 });
  });
}

async function searchFor(term: string) {
  await fireEvent.changeText(screen.getByLabelText('Buscar PRs'), term);
  await fireEvent.press(screen.getByTestId('catalog.search-submit'));
}

async function showFilter(name: 'Todos' | 'Salvos' | 'Estudados') {
  await fireEvent.press(screen.getByRole('button', { name }));
}

beforeEach(async () => {
  mockList.mockReset();
  mockSearch.mockReset();
  await AsyncStorage.clear();
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

test('C21: tapping the star saves the PR and the icon reflects it, tapping again removes it', async () => {
  mockList.mockResolvedValue(page([3, 2], false));
  await renderCatalog();

  const star = await screen.findByTestId('catalog.save.0');
  expect(star.props.accessibilityState).toMatchObject({ selected: false });
  await fireEvent.press(star);
  expect(screen.getByTestId('catalog.save.0').props.accessibilityState).toMatchObject({
    selected: true,
  });
  expect(screen.getByTestId('catalog.save.1').props.accessibilityState).toMatchObject({
    selected: false,
  });
  await fireEvent.press(screen.getByTestId('catalog.save.0'));
  expect(screen.getByTestId('catalog.save.0').props.accessibilityState).toMatchObject({
    selected: false,
  });
});

test('C65 and C31: the term only applies on Buscar, and a result opens its own detail', async () => {
  mockList.mockResolvedValue(page([3, 2, 1], false));
  mockSearch.mockResolvedValue([pr(7), pr(8)]);
  await renderCatalog();
  await screen.findByTestId('catalog.card.0');
  expect(screen.getByText('Buscar PRs')).toBeTruthy();

  await fireEvent.changeText(screen.getByLabelText('Buscar PRs'), '  fix  ');
  expect(mockSearch).not.toHaveBeenCalled();
  expect(screen.getByText('PR 3')).toBeTruthy();

  await fireEvent.press(screen.getByTestId('catalog.search-submit'));
  expect(await screen.findByText('PR 8')).toBeTruthy();
  expect(mockSearch).toHaveBeenCalledWith('fix', expect.anything());
  expect(screen.queryByText('PR 3')).toBeNull();
  expect(screen.queryByText(/^Detalhe/)).toBeNull();

  await fireEvent.press(screen.getByTestId('catalog.card.1'));
  expect(await screen.findByText('Detalhe 8')).toBeTruthy();
});

test('C32: a search without results says so and names the term', async () => {
  mockList.mockResolvedValue(page([1], false));
  mockSearch.mockResolvedValue([]);
  await renderCatalog();
  await screen.findByTestId('catalog.card.0');

  await searchFor('zzzqqq');

  expect(await screen.findByText('Nenhum resultado para “zzzqqq”')).toBeTruthy();
  expect(screen.getByText('Tente outro termo.')).toBeTruthy();
});

test('C35: the loader shows while the search runs and the search field stays', async () => {
  mockList.mockResolvedValue(page([1], false));
  let release: (items: PullRequestSummary[]) => void = () => {};
  mockSearch.mockReturnValue(new Promise((resolve) => (release = resolve)));
  await renderCatalog();
  await screen.findByTestId('catalog.card.0');

  await searchFor('fix');

  expect(screen.getByTestId('loading')).toBeTruthy();
  expect(screen.getByLabelText('Buscar PRs')).toBeTruthy();
  await act(async () => release([pr(9)]));
  expect(screen.getByText('PR 9')).toBeTruthy();
  expect(screen.queryByTestId('loading')).toBeNull();
});

test('the search limit shows its message with the time, and Tentar novamente searches again', async () => {
  mockList.mockResolvedValue(page([1], false));
  const limit = 'Limite de requisições do GitHub atingido. Volta às 20:09.';
  mockSearch
    .mockRejectedValueOnce(new AppError('rate-limit', limit))
    .mockResolvedValueOnce([pr(9)]);
  await renderCatalog();
  await screen.findByTestId('catalog.card.0');

  await searchFor('fix');

  expect(await screen.findByText(limit)).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('Tentar novamente'));
  expect(await screen.findByText('PR 9')).toBeTruthy();
  expect(mockSearch).toHaveBeenCalledTimes(2);
});

test('C65: Enter searches too, and Buscar with an empty field goes back to the same list', async () => {
  mockList.mockResolvedValue(page([3, 2, 1], false));
  mockSearch.mockResolvedValue([pr(9)]);
  await renderCatalog();
  await screen.findByTestId('catalog.card.0');

  await fireEvent.changeText(screen.getByLabelText('Buscar PRs'), 'fix');
  await fireEvent(screen.getByLabelText('Buscar PRs'), 'submitEditing');
  expect(await screen.findByText('PR 9')).toBeTruthy();

  await searchFor('   ');

  expect(await screen.findByText('PR 3')).toBeTruthy();
  expect(screen.queryByText('PR 9')).toBeNull();
  expect(mockSearch).toHaveBeenCalledTimes(1);
  expect(mockList).toHaveBeenCalledTimes(1);
});

test('C22: Salvos lists the saved PR without the network and drops it on unsave', async () => {
  mockList.mockResolvedValue(page([3, 2, 1], false));
  await renderCatalog();
  await fireEvent.press(await screen.findByTestId('catalog.save.1'));

  await showFilter('Salvos');

  expect(screen.getByText('PR 2')).toBeTruthy();
  expect(screen.queryByText('PR 3')).toBeNull();
  expect(mockList).toHaveBeenCalledTimes(1);
  expect(mockSearch).not.toHaveBeenCalled();

  await fireEvent.press(screen.getByTestId('catalog.save.0'));
  expect(screen.queryByText('PR 2')).toBeNull();
  expect(screen.getByTestId('catalog.empty')).toBeTruthy();
});

test('C23: an empty Salvos explains how to save a PR', async () => {
  mockList.mockResolvedValue(page([1], false));
  await renderCatalog();
  await screen.findByTestId('catalog.card.0');

  await showFilter('Salvos');

  expect(screen.getByText('Você ainda não salvou nenhum PR')).toBeTruthy();
  expect(screen.getByText('Toque em ☆ em um card ou no detalhe.')).toBeTruthy();
});

test('C63 and C65: the term filters Salvos locally, stays across filters and clears on an empty Buscar', async () => {
  mockList.mockResolvedValue(page([3, 2, 1], false));
  mockSearch.mockResolvedValue([pr(7)]);
  await renderCatalog();
  await fireEvent.press(await screen.findByTestId('catalog.save.0'));
  await fireEvent.press(screen.getByTestId('catalog.save.1'));
  await showFilter('Salvos');

  await searchFor('3');
  expect(screen.getByText('PR 3')).toBeTruthy();
  expect(screen.queryByText('PR 2')).toBeNull();
  expect(mockSearch).not.toHaveBeenCalled();

  await showFilter('Todos');
  expect(await screen.findByText('PR 7')).toBeTruthy();
  expect(mockSearch).toHaveBeenCalledWith('3', expect.anything());

  await showFilter('Salvos');
  expect(screen.getByText('PR 3')).toBeTruthy();
  expect(screen.queryByText('PR 7')).toBeNull();

  await searchFor('zzz');
  expect(screen.getByText('Nenhum resultado para “zzz”')).toBeTruthy();
  expect(screen.getByText('Tente outro termo ou troque o filtro.')).toBeTruthy();

  await searchFor('');
  expect(screen.getByText('PR 3')).toBeTruthy();
  expect(screen.getByText('PR 2')).toBeTruthy();
  await fireEvent.press(screen.getByTestId('catalog.card.1'));
  expect(await screen.findByText('Detalhe 3')).toBeTruthy();
});

test('Salvos still shows the saved PRs when the list fails, and Todos keeps its error', async () => {
  await AsyncStorage.setItem('rl.u1.favorites', JSON.stringify([pr(5)]));
  mockList.mockRejectedValue(new AppError('network', 'Sem conexão. Confira a internet.'));
  await renderCatalog();
  expect(await screen.findByTestId('catalog.error')).toBeTruthy();

  await showFilter('Salvos');
  expect(screen.getByText('PR 5')).toBeTruthy();
  expect(screen.queryByTestId('catalog.error')).toBeNull();

  await showFilter('Todos');
  expect(screen.getByTestId('catalog.error')).toBeTruthy();
});

test.each(LOCAL_FILTERS)(
  '$name does not page, refresh, show the footer or wait for the list',
  async ({ name, storage, items }) => {
    await AsyncStorage.setItem(storage, JSON.stringify(items));
    mockList.mockResolvedValueOnce(page([2], true)).mockReturnValueOnce(new Promise(() => {}));
    await renderCatalog();
    await screen.findByTestId('catalog.card.0');
    await reachEnd();
    expect(screen.getByTestId('catalog.footer-loader')).toBeTruthy();

    await showFilter(name);

    const list = screen.getByTestId('catalog.list');
    expect(list.props.onEndReached).toBeUndefined();
    expect(list.props.onRefresh).toBeUndefined();
    expect(screen.queryByTestId('catalog.footer-loader')).toBeNull();
    expect(screen.getByText('PR 5')).toBeTruthy();
  },
);

test.each(LOCAL_FILTERS)(
  '$name shows its PRs while the first page of Todos is still loading',
  async ({ name, storage, items }) => {
    await AsyncStorage.setItem(storage, JSON.stringify(items));
    mockList.mockReturnValue(new Promise(() => {}));
    await renderCatalog();
    expect(screen.getByTestId('loading')).toBeTruthy();

    await showFilter(name);

    expect(await screen.findByText('PR 5')).toBeTruthy();
    expect(screen.queryByTestId('loading')).toBeNull();
  },
);

test.each(LOCAL_FILTERS)(
  'C65: in $name typing does not filter until Buscar',
  async ({ name, storage, items }) => {
    await AsyncStorage.setItem(storage, JSON.stringify(items));
    mockList.mockResolvedValue(page([1], false));
    await renderCatalog();
    await screen.findByTestId('catalog.card.0');
    await showFilter(name);

    await fireEvent.changeText(screen.getByLabelText('Buscar PRs'), '6');
    expect(screen.getByText('PR 5')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('catalog.search-submit'));
    expect(screen.queryByText('PR 5')).toBeNull();
    expect(screen.getByText('PR 6')).toBeTruthy();
  },
);

test.each(LOCAL_FILTERS)(
  'changing the filter or the term in $name starts a new list',
  async ({ name, storage, items }) => {
    await AsyncStorage.setItem(storage, JSON.stringify(items));
    mockList.mockResolvedValue(page([3, 2, 1], false));
    await renderCatalog();
    await screen.findByTestId('catalog.card.0');
    const todos = screen.getByTestId('catalog.list');

    await showFilter(name);
    const local = screen.getByTestId('catalog.list');
    expect(local).not.toBe(todos);

    await searchFor('6');
    expect(screen.getByTestId('catalog.list')).not.toBe(local);
  },
);

test('C63: switching between Salvos and Estudados keeps the term and starts a new list', async () => {
  await AsyncStorage.setItem('rl.u1.favorites', JSON.stringify([pr(5), pr(6)]));
  await AsyncStorage.setItem('rl.u1.studied', JSON.stringify(studied));
  mockList.mockResolvedValue(page([1], false));
  await renderCatalog();
  await screen.findByTestId('catalog.card.0');

  await showFilter('Salvos');
  await searchFor('6');
  const salvos = screen.getByTestId('catalog.list');
  await showFilter('Estudados');

  expect(screen.getByTestId('catalog.list')).not.toBe(salvos);
  expect(screen.getByText('PR 6')).toBeTruthy();
  expect(screen.queryByText('PR 5')).toBeNull();
  expect(mockSearch).not.toHaveBeenCalled();
});

test('C64: each filter chip states whether it is selected and is at least 44x44', async () => {
  mockList.mockResolvedValue(page([1], false));
  await renderCatalog();
  await screen.findByTestId('catalog.card.0');
  const chip = (name: string) => screen.getByRole('button', { name });

  const names = ['Todos', 'Salvos', 'Estudados'] as const;
  for (const shown of names) {
    await showFilter(shown);
    for (const name of names) {
      expect(chip(name).props.accessibilityState).toMatchObject({ selected: name === shown });
    }
  }
  for (const name of names) {
    const style = StyleSheet.flatten(chip(name).props.style);
    expect(style.minWidth).toBe(touch.min);
    expect(style.minHeight).toBe(touch.min);
  }
});

test('C30: Estudados lists each studied PR with its rating, without the network', async () => {
  await AsyncStorage.setItem('rl.u1.studied', JSON.stringify(studied));
  mockList.mockResolvedValue(page([5, 1], false));
  await renderCatalog();
  await screen.findByTestId('catalog.card.0');
  // Em Todos o card não mostra a nota, como no protótipo.
  expect(screen.queryByTestId('catalog.card.0.rating')).toBeNull();

  await showFilter('Estudados');

  expect(screen.getByLabelText('PR #5: PR 5, de ana, nota 4 de 5')).toBeTruthy();
  expect(screen.getByLabelText('PR #6: PR 6, de ana, nota 2 de 5')).toBeTruthy();
  expect(screen.getByText('★★★★☆')).toBeTruthy();
  expect(screen.getByText('★★☆☆☆')).toBeTruthy();
  expect(screen.queryByText('PR 1')).toBeNull();
  expect(mockList).toHaveBeenCalledTimes(1);
  expect(mockSearch).not.toHaveBeenCalled();
  // A estrela de salvar continua valendo dentro de Estudados.
  const star = screen.getByTestId('catalog.save.0');
  expect(star.props.accessibilityState).toMatchObject({ selected: false });
  await fireEvent.press(star);
  expect(screen.getByTestId('catalog.save.0').props.accessibilityState).toMatchObject({
    selected: true,
  });
  await fireEvent.press(screen.getByTestId('catalog.card.1'));
  expect(await screen.findByText('Detalhe 6')).toBeTruthy();
});

test('C55: an empty Estudados says no PR was marked as studied', async () => {
  mockList.mockResolvedValue(page([1], false));
  await renderCatalog();
  await screen.findByTestId('catalog.card.0');

  await showFilter('Estudados');

  expect(screen.getByTestId('catalog.empty')).toBeTruthy();
  expect(screen.getByText('Você ainda não marcou nenhum PR como estudado')).toBeTruthy();
});

test('C63 and C65: the term filters Estudados locally, stays across filters and clears on an empty Buscar', async () => {
  await AsyncStorage.setItem('rl.u1.studied', JSON.stringify(studied));
  mockList.mockResolvedValue(page([1], false));
  mockSearch.mockResolvedValue([pr(7)]);
  await renderCatalog();
  await screen.findByTestId('catalog.card.0');
  await showFilter('Estudados');

  await searchFor('6');
  expect(screen.getByText('PR 6')).toBeTruthy();
  expect(screen.queryByText('PR 5')).toBeNull();
  expect(mockSearch).not.toHaveBeenCalled();

  await showFilter('Todos');
  expect(await screen.findByText('PR 7')).toBeTruthy();
  expect(mockSearch).toHaveBeenCalledWith('6', expect.anything());

  await showFilter('Estudados');
  expect(screen.getByText('PR 6')).toBeTruthy();
  expect(screen.queryByText('PR 7')).toBeNull();

  await searchFor('zzz');
  expect(screen.getByText('Nenhum resultado para “zzz”')).toBeTruthy();
  expect(screen.getByText('Tente outro termo ou troque o filtro.')).toBeTruthy();

  await searchFor('');
  expect(screen.getByText('PR 5')).toBeTruthy();
  expect(screen.getByText('PR 6')).toBeTruthy();
});

test('Buscar with the same term after the limit searches again, like Tentar novamente', async () => {
  mockList.mockResolvedValue(page([1], false));
  const limit = 'Limite de requisições do GitHub atingido. Volta às 20:09.';
  mockSearch
    .mockRejectedValueOnce(new AppError('rate-limit', limit))
    .mockResolvedValueOnce([pr(9)]);
  await renderCatalog();
  await screen.findByTestId('catalog.card.0');

  await searchFor('fix');
  expect(await screen.findByText(limit)).toBeTruthy();
  await fireEvent.press(screen.getByTestId('catalog.search-submit'));

  expect(await screen.findByText('PR 9')).toBeTruthy();
  expect(mockSearch).toHaveBeenCalledTimes(2);
});

test('while a search is shown the list does not page, refresh or show its footer', async () => {
  const dismiss = jest.spyOn(Keyboard, 'dismiss');
  mockList.mockResolvedValueOnce(page([2], true)).mockReturnValueOnce(new Promise(() => {}));
  mockSearch.mockResolvedValue([pr(9)]);
  await renderCatalog();
  await screen.findByTestId('catalog.card.0');
  await reachEnd();
  expect(screen.getByTestId('catalog.footer-loader')).toBeTruthy();

  await searchFor('fix');

  expect(await screen.findByText('PR 9')).toBeTruthy();
  expect(dismiss).toHaveBeenCalled();
  const list = screen.getByTestId('catalog.list');
  expect(list.props.onEndReached).toBeUndefined();
  expect(list.props.onRefresh).toBeUndefined();
  // Com o teclado aberto, o primeiro toque num resultado já abre o PR em vez de só fechar o teclado.
  expect(list.props.keyboardShouldPersistTaps).toBe('handled');
  expect(screen.queryByTestId('catalog.footer-loader')).toBeNull();
  dismiss.mockRestore();
});

test('C66: the layout button switches between 2 and 1 columns and says the action it does', async () => {
  mockList.mockResolvedValue(page([3, 2], false));
  await renderCatalog();
  await screen.findByTestId('catalog.card.0');
  const button = () => screen.getByTestId('catalog.layout-toggle');

  expect(button().props.accessibilityRole).toBe('button');
  expect(button().props.accessibilityLabel).toBe('Ver em 1 coluna');
  const twoColumns = cardWidth(0);
  expect(twoColumns).toBe((Dimensions.get('window').width - spacing.lg * 2 - spacing.md) / 2);

  await fireEvent.press(button());
  expect(button().props.accessibilityLabel).toBe('Ver em 2 colunas');
  // Na largura do teste, 353 em 2 colunas e 718 em 1: a coluna única ocupa a linha toda.
  expect(cardWidth(0)).toBe(Dimensions.get('window').width - spacing.lg * 2);
  expect(cardWidth(0)).toBeGreaterThan(twoColumns);
  expect(cardWidth(0)).toBe(cardWidth(1));

  await fireEvent.press(button());
  expect(button().props.accessibilityLabel).toBe('Ver em 1 coluna');
  expect(cardWidth(0)).toBe(twoColumns);
});

test('C66: switching columns keeps the list and the saved PR without fetching again', async () => {
  mockList.mockResolvedValue(page([3, 2], false));
  await renderCatalog();
  await fireEvent.press(await screen.findByTestId('catalog.save.1'));

  await fireEvent.press(screen.getByTestId('catalog.layout-toggle'));

  expect(screen.getByText('PR 3')).toBeTruthy();
  expect(screen.getByText('PR 2')).toBeTruthy();
  expect(screen.getByTestId('catalog.save.1').props.accessibilityState).toMatchObject({
    selected: true,
  });
  expect(mockList).toHaveBeenCalledTimes(1);
});

test('C66: the layout button is at least 44x44', async () => {
  mockList.mockResolvedValue(page([1], false));
  await renderCatalog();

  const style = StyleSheet.flatten(
    (await screen.findByTestId('catalog.layout-toggle')).props.style,
  );
  expect(style.minWidth).toBe(touch.min);
  expect(style.minHeight).toBe(touch.min);
});

test('C66: the chosen layout comes back after the catalog mounts again', async () => {
  mockList.mockResolvedValue(page([3, 2], false));
  await renderCatalog();
  await screen.findByTestId('catalog.card.0');
  await fireEvent.press(screen.getByTestId('catalog.layout-toggle'));
  const oneColumn = cardWidth(0);
  expect(oneColumn).toBe(Dimensions.get('window').width - spacing.lg * 2);
  screen.unmount();

  await renderCatalog();
  await screen.findByTestId('catalog.card.0');
  expect(screen.getByTestId('catalog.layout-toggle').props.accessibilityLabel).toBe(
    'Ver em 2 colunas',
  );
  expect(cardWidth(0)).toBe(oneColumn);
  expect(await AsyncStorage.getItem('rl.u1.layout')).toBe('1');
});
