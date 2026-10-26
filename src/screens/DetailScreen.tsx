import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '../components/Avatar';
import { BodyBlocks } from '../components/BodyBlocks';
import { ErrorState } from '../components/ErrorState';
import { useFavorites } from '../contexts/FavoritesContext';
import { useFetch } from '../hooks/useFetch';
import type { AppStackParamList } from '../navigation/types';
import { getPullRequest } from '../services/github';
import { colors, radius, spacing, touch, typography } from '../theme';

type Props = NativeStackScreenProps<AppStackParamList, 'Detail'>;

export function DetailScreen({ navigation, route }: Props) {
  const { number } = route.params;
  const fetcher = useCallback((signal: AbortSignal) => getPullRequest(number, signal), [number]);
  const pr = useFetch(fetcher);
  const { isFavorite, toggle } = useFavorites();
  const saved = isFavorite(number);
  const title = pr.status === 'data' ? pr.data.title : undefined;

  // O header mostra "PR #n" até o título chegar; trocar de número não deixa o título anterior.
  useEffect(() => {
    navigation.setOptions({ title: title ?? `PR #${number}` });
  }, [navigation, title, number]);

  if (pr.status === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator testID="loading" color={colors.primary} size="large" />
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
        <Text style={styles.meta}>
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
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={saved ? 'Salvo para estudar' : 'Salvar para estudar'}
        accessibilityState={{ selected: saved }}
        onPress={() => toggle(summary)}
        style={styles.save}
        testID="detail.save"
      >
        <Text style={[styles.saveText, saved && styles.savedText]}>
          {saved ? '★ Salvo para estudar' : '☆ Salvar para estudar'}
        </Text>
      </Pressable>
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
  title: { ...typography.title, color: colors.text },
  save: {
    minHeight: touch.min,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  saveText: { ...typography.body, color: colors.text },
  savedText: { color: colors.star },
  meta: { ...typography.caption, color: colors.textMuted },
});
