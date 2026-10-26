import { beforeEach, expect, jest, test } from '@jest/globals';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { FavoritesProvider } from '../contexts/FavoritesContext';
import { StudiedProvider } from '../contexts/StudiedContext';
import type { PullRequestDetailView, PullRequestPage } from '../types/github';
import { CatalogScreen } from './CatalogScreen';
import { DetailScreen } from './DetailScreen';

const mockList = jest.fn<() => Promise<PullRequestPage>>();
const mockGet = jest.fn<() => Promise<PullRequestDetailView>>();
jest.mock('../services/github', () => ({
  listPullRequests: () => mockList(),
  getPullRequest: () => mockGet(),
}));

const Stack = createNativeStackNavigator();

beforeEach(() => {
  mockList.mockResolvedValue({
    items: [{ number: 7, title: 'Fix the parser', author: 'ana' }],
    hasNext: false,
  });
  mockGet.mockResolvedValue({
    number: 7,
    title: 'Fix the parser',
    author: 'ana',
    htmlUrl: 'https://github.com/o/r/pull/7',
    merged: true,
    comments: 0,
    reviewComments: 0,
    changedFiles: 1,
    additions: 1,
    deletions: 0,
    blocks: [],
  });
});

test('C21: saving in the detail flips the star of the same PR in the catalog without reloading', async () => {
  await render(
    <FavoritesProvider userId="u1">
      <StudiedProvider userId="u1">
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen name="Catalog" component={CatalogScreen as never} />
            <Stack.Screen name="Detail" component={DetailScreen as never} />
          </Stack.Navigator>
        </NavigationContainer>
      </StudiedProvider>
    </FavoritesProvider>,
  );

  await fireEvent.press(await screen.findByTestId('catalog.card.0'));
  await fireEvent.press(await screen.findByTestId('detail.save'));
  expect(screen.getByTestId('detail.save').props.accessibilityState).toMatchObject({
    selected: true,
  });

  // O catálogo continua montado atrás do detalhe; a estrela já reflete o estado compartilhado.
  expect(
    screen.getAllByTestId('catalog.save.0', { hidden: true })[0].props.accessibilityState,
  ).toMatchObject({ selected: true });
  expect(mockList).toHaveBeenCalledTimes(1);
});
