import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { PullRequestCard } from '../components/PullRequestCard';
import { TextField } from '../components/TextField';
import { useFavorites } from '../contexts/FavoritesContext';
import { useFetch } from '../hooks/useFetch';
import { usePullRequestList } from '../hooks/usePullRequestList';
import type { AppStackParamList } from '../navigation/types';
import { searchPullRequests } from '../services/github';
import type { PullRequestSummary } from '../types/github';
import { colors, radius, spacing, touch, typography } from '../theme';
import type { AppError } from '../utils/appError';
import { filterByTerm } from '../utils/collections';

type Props = NativeStackScreenProps<AppStackParamList, 'Catalog'>;

type Filter = 'all' | 'saved';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'saved', label: 'Salvos' },
];

const COLUMNS = 2;
const NO_RESULTS: PullRequestSummary[] = [];

function Empty({ filter, term }: { filter: Filter; term: string }) {
  if (term) {
    return (
      <EmptyState
        title={`Nenhum resultado para “${term}”`}
        text={filter === 'all' ? 'Tente outro termo.' : 'Tente outro termo ou troque o filtro.'}
      />
    );
  }
  if (filter === 'saved') {
    return (
      <EmptyState
        title="Você ainda não salvou nenhum PR"
        text="Toque em ☆ em um card ou no detalhe."
      />
    );
  }
  return <EmptyState title="Nenhum PR encontrado" />;
}

export function CatalogScreen({ navigation }: Props) {
  const list = usePullRequestList();
  const { favorites, isFavorite, toggle } = useFavorites();
  const { width } = useWindowDimensions();
  const cardWidth = (width - spacing.lg * 2 - spacing.md * (COLUMNS - 1)) / COLUMNS;
  const [query, setQuery] = useState('');
  // O termo só vale ao tocar em Buscar (ou Enter): a busca tem limite de 10 por minuto, então
  // nada de buscar a cada tecla. Termo vazio volta à lista paginada, que ficou montada.
  const [term, setTerm] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  // Só Todos vai ao GitHub; Salvos vem do Context e a busca filtra a lista local.
  const remote = filter === 'all';
  const searcher = useCallback(
    (signal: AbortSignal) =>
      remote && term ? searchPullRequests(term, signal) : Promise.resolve(NO_RESULTS),
    [remote, term],
  );
  const search = useFetch(searcher);
  const searching = term !== '';
  const paginated = remote && !searching;

  const submit = () => {
    Keyboard.dismiss();
    setTerm(query.trim());
  };

  let items = NO_RESULTS;
  let loading = false;
  let error: AppError | undefined;
  if (!remote) {
    items = filterByTerm(favorites, term);
  } else if (searching) {
    items = search.data ?? NO_RESULTS;
    loading = search.status === 'loading';
    error = search.error;
  } else {
    items = list.items;
    loading = list.status === 'loading';
    error = list.status === 'error' ? list.error : undefined;
  }

  let body: ReactNode;
  if (loading) {
    body = (
      <View style={styles.center}>
        <ActivityIndicator testID="loading" color={colors.primary} size="large" />
      </View>
    );
  } else if (error) {
    body = (
      <View style={styles.center} testID="catalog.error">
        <ErrorState message={error.message} onRetry={searching ? search.retry : list.loadFirst} />
      </View>
    );
  } else {
    body = (
      <FlatList
        testID="catalog.list"
        style={styles.list}
        data={items}
        numColumns={COLUMNS}
        keyExtractor={(pr) => String(pr.number)}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        onEndReached={paginated ? list.loadMore : undefined}
        onEndReachedThreshold={0.5}
        refreshing={list.refreshing}
        onRefresh={paginated ? list.refresh : undefined}
        renderItem={({ item, index }) => (
          <View style={{ width: cardWidth }}>
            <PullRequestCard
              pr={item}
              saved={isFavorite(item.number)}
              onPress={() => navigation.navigate('Detail', { number: item.number })}
              onToggleSave={() => toggle(item)}
              testID={`catalog.card.${index}`}
              saveTestID={`catalog.save.${index}`}
            />
          </View>
        )}
        ListEmptyComponent={
          <View testID="catalog.empty">
            <Empty filter={filter} term={term} />
          </View>
        }
        ListFooterComponent={
          !paginated ? undefined : list.loadingMore ? (
            <ActivityIndicator
              testID="catalog.footer-loader"
              color={colors.primary}
              style={styles.footer}
            />
          ) : list.moreError ? (
            <View testID="catalog.footer-error">
              <ErrorState message={list.moreError.message} onRetry={list.retryMore} />
            </View>
          ) : undefined
        }
      />
    );
  }

  return (
    <View style={styles.screen}>
      {/* Com fonte grande o botão desce para baixo do campo em vez de espremer o texto. */}
      <View style={styles.searchbar}>
        <View style={styles.field}>
          <TextField
            label="Buscar PRs"
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            onSubmitEditing={submit}
            testID="catalog.search-input"
          />
        </View>
        <Button label="Buscar" onPress={submit} testID="catalog.search-submit" />
      </View>
      {/* Os chips ficam fora do corpo: trocar de filtro não os remonta e o foco continua no chip. */}
      <View style={styles.filters}>
        {FILTERS.map(({ key, label }) => {
          const selected = filter === key;
          return (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ selected }}
              onPress={() => setFilter(key)}
              style={[styles.chip, selected && styles.chipSelected]}
              testID={`catalog.filter.${key}`}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  searchbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  field: { flexGrow: 1, flexBasis: 200 },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  chip: {
    minHeight: touch.min,
    minWidth: touch.min,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...typography.button, color: colors.text },
  chipTextSelected: { color: colors.onPrimary },
  center: { flex: 1, justifyContent: 'center' },
  list: { backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md },
  row: { gap: spacing.md },
  footer: { padding: spacing.lg },
});
