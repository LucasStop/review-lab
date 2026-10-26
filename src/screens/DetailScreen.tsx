import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '../components/Avatar';
import { BodyBlocks } from '../components/BodyBlocks';
import { ErrorState } from '../components/ErrorState';
import { useFetch } from '../hooks/useFetch';
import type { AppStackParamList } from '../navigation/types';
import { getPullRequest } from '../services/github';
import { colors, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<AppStackParamList, 'Detail'>;

export function DetailScreen({ navigation, route }: Props) {
  const { number } = route.params;
  const fetcher = useCallback((signal: AbortSignal) => getPullRequest(number, signal), [number]);
  const pr = useFetch(fetcher);
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
  meta: { ...typography.caption, color: colors.textMuted },
});
