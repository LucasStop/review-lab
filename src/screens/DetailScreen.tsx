import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '../components/Avatar';
import { BodyBlocks } from '../components/BodyBlocks';
import { ErrorState } from '../components/ErrorState';
import { StarRating } from '../components/StarRating';
import { useFavorites } from '../contexts/FavoritesContext';
import { useStudied } from '../contexts/StudiedContext';
import { useFetch } from '../hooks/useFetch';
import type { AppStackParamList } from '../navigation/types';
import { getPullRequest } from '../services/github';
import { colors, radius, spacing, touch, typography } from '../theme';

type Props = NativeStackScreenProps<AppStackParamList, 'Detail'>;

// Marcar já grava uma nota, porque a lista de estudados só guarda PR com nota de 1 a 5. O 4 vem
// do protótipo.
const FIRST_RATING = 4;

export function DetailScreen({ navigation, route }: Props) {
  const { number } = route.params;
  const fetcher = useCallback((signal: AbortSignal) => getPullRequest(number, signal), [number]);
  const pr = useFetch(fetcher);
  const { isFavorite, toggle } = useFavorites();
  const { getRating, markStudied, unmark } = useStudied();
  const saved = isFavorite(number);
  const rating = getRating(number);
  const studied = rating !== undefined;
  const title = pr.status === 'data' ? pr.data.title : undefined;

  // O header mostra "PR #n" até o título chegar; trocar de número não deixa o título anterior.
  useEffect(() => {
    navigation.setOptions({ title: title ?? `PR #${number}` });
  }, [navigation, title, number]);

  if (pr.status === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          testID="loading"
          accessibilityLabel="Carregando"
          color={colors.primary}
          size="large"
        />
      </View>
    );
  }

  if (pr.status === 'error') {
    return (
      <View style={styles.center} testID="detail.error">
        <ErrorState message={pr.error.message} onRetry={pr.retry} />
      </View>
    );
  }

  const { data } = pr;
  // Só o resumo vai para o disco: os blocos do corpo não pertencem à lista de salvos.
  const summary = {
    number: data.number,
    title: data.title,
    author: data.author,
    avatarUrl: data.avatarUrl,
  };
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.author}>
        <Avatar uri={data.avatarUrl} name={data.author} size={56} accessible={false} />
        <Text style={[styles.meta, styles.authorText]}>
          #{data.number} · {data.author}
        </Text>
      </View>
      <Text style={styles.title} accessibilityRole="header" testID="detail.title">
        {data.title}
      </Text>
      <Text style={styles.meta} testID="detail.stats">
        {data.comments + data.reviewComments} comentários · {data.changedFiles} arquivos · +
        {data.additions} −{data.deletions}
      </Text>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={saved ? 'Salvo para estudar' : 'Salvar para estudar'}
          accessibilityState={{ selected: saved }}
          onPress={() => toggle(summary)}
          style={styles.action}
          testID="detail.save"
        >
          <Text style={[styles.actionText, saved && styles.savedText]}>
            {saved ? '★ Salvo para estudar' : '☆ Salvar para estudar'}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={studied ? 'Estudado' : 'Marcar como estudado'}
          accessibilityState={{ selected: studied }}
          onPress={() => (studied ? unmark(number) : markStudied(summary, FIRST_RATING))}
          style={styles.action}
          testID="detail.studied"
        >
          <Text style={styles.actionText}>{studied ? '✓ Estudado' : 'Marcar como estudado'}</Text>
        </Pressable>
      </View>
      {studied ? (
        <View style={styles.rating} testID="detail.rating">
          <Text style={styles.label}>Nota de utilidade</Text>
          <StarRating value={rating} onChange={(value) => markStudied(summary, value)} />
        </View>
      ) : null}
      <View testID="detail.body">
        {data.blocks.length > 0 ? (
          <BodyBlocks blocks={data.blocks} />
        ) : (
          <Text style={styles.meta}>Sem descrição</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: colors.background, justifyContent: 'center' },
  screen: { backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg },
  author: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  authorText: { flexShrink: 1 },
  title: { ...typography.title, color: colors.text },
  // Quebra de linha: com fonte grande os dois botões não cabem lado a lado.
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  action: {
    minWidth: touch.min,
    minHeight: touch.min,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  actionText: { ...typography.body, color: colors.text },
  savedText: { color: colors.star },
  rating: { gap: spacing.xs },
  label: { ...typography.label, color: colors.text },
  meta: { ...typography.caption, color: colors.textMuted },
});
