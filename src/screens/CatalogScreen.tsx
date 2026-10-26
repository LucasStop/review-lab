import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  StyleSheet,
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
import { colors, spacing } from '../theme';

type Props = NativeStackScreenProps<AppStackParamList, 'Catalog'>;

const COLUMNS = 2;
const NO_RESULTS: PullRequestSummary[] = [];

export function CatalogScreen({ navigation }: Props) {
  const list = usePullRequestList();
  const { isFavorite, toggle } = useFavorites();
  const { width } = useWindowDimensions();
  const cardWidth = (width - spacing.lg * 2 - spacing.md * (COLUMNS - 1)) / COLUMNS;
  const [query, setQuery] = useState('');
  // O termo só vale ao tocar em Buscar (ou Enter): a busca tem limite de 10 por minuto, então
  // nada de buscar a cada tecla. Termo vazio volta à lista paginada sem recarregar: as páginas
  // ficam no hook, mas a rolagem volta ao topo, porque a lista sai da tela enquanto a busca roda.
  const [term, setTerm] = useState('');
  const searcher = useCallback(
    (signal: AbortSignal) =>
      term ? searchPullRequests(term, signal) : Promise.resolve(NO_RESULTS),
    [term],
  );
  const search = useFetch(searcher);
  const searching = term !== '';

  const submit = () => {
    Keyboard.dismiss();
    const next = query.trim();
    // O mesmo termo não muda o estado e não buscaria de novo: depois de um erro (o limite, por
    // exemplo), Buscar tenta outra vez, como o "Tentar novamente".
    if (next === term && search.error) search.retry();
    else setTerm(next);
  };

  const loading = searching ? search.status === 'loading' : list.status === 'loading';
  const error = searching ? search.error : list.status === 'error' ? list.error : undefined;

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
        data={searching ? (search.data ?? NO_RESULTS) : list.items}
        numColumns={COLUMNS}
        keyExtractor={(pr) => String(pr.number)}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        onEndReached={searching ? undefined : list.loadMore}
        onEndReachedThreshold={0.5}
        refreshing={list.refreshing}
        onRefresh={searching ? undefined : list.refresh}
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
            {searching ? (
              <EmptyState title={`Nenhum resultado para “${term}”`} text="Tente outro termo." />
            ) : (
              <EmptyState title="Nenhum PR encontrado" />
            )}
          </View>
        }
        ListFooterComponent={
          searching ? undefined : list.loadingMore ? (
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
  center: { flex: 1, justifyContent: 'center' },
  list: { backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md },
  row: { gap: spacing.md },
  footer: { padding: spacing.lg },
});
