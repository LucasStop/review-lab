import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, FlatList, StyleSheet, View, useWindowDimensions } from 'react-native';

import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { useFavorites } from '../contexts/FavoritesContext';
import { PullRequestCard } from '../components/PullRequestCard';
import { usePullRequestList } from '../hooks/usePullRequestList';
import type { AppStackParamList } from '../navigation/types';
import { colors, spacing } from '../theme';

type Props = NativeStackScreenProps<AppStackParamList, 'Catalog'>;

const COLUMNS = 2;

export function CatalogScreen({ navigation }: Props) {
  const list = usePullRequestList();
  const { isFavorite, toggle } = useFavorites();
  const { width } = useWindowDimensions();
  const cardWidth = (width - spacing.lg * 2 - spacing.md * (COLUMNS - 1)) / COLUMNS;

  if (list.status === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator testID="loading" color={colors.primary} size="large" />
      </View>
    );
  }

  if (list.status === 'error') {
    return (
      <View style={styles.center} testID="catalog.error">
        <ErrorState message={list.error?.message ?? ''} onRetry={list.loadFirst} />
      </View>
    );
  }

  return (
    <FlatList
      testID="catalog.list"
      style={styles.list}
      data={list.items}
      numColumns={COLUMNS}
      keyExtractor={(pr) => String(pr.number)}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.content}
      onEndReached={list.loadMore}
      onEndReachedThreshold={0.5}
      refreshing={list.refreshing}
      onRefresh={list.refresh}
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
          <EmptyState title="Nenhum PR encontrado" />
        </View>
      }
      ListFooterComponent={
        list.loadingMore ? (
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

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: colors.background, justifyContent: 'center' },
  list: { backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md },
  row: { gap: spacing.md },
  footer: { padding: spacing.lg },
});
