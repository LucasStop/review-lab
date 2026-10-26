import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, touch, typography } from '../theme';
import type { PullRequestSummary } from '../types/github';
import { Avatar } from './Avatar';

type Props = {
  pr: PullRequestSummary;
  saved: boolean;
  onPress: () => void;
  onToggleSave: () => void;
  // Só no filtro Estudados: nota de 1 a 5 do PR.
  rating?: number;
  testID?: string;
};

export function PullRequestCard({ pr, saved, onPress, onToggleSave, rating, testID }: Props) {
  const saveLabel = saved ? 'Remover dos salvos' : 'Salvar para estudar';
  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`PR #${pr.number}: ${pr.title}, de ${pr.author}`}
        onPress={onPress}
        style={styles.body}
        testID={testID}
      >
        <Avatar uri={pr.avatarUrl} name={pr.author} size={40} accessible={false} />
        <Text style={styles.title}>{pr.title}</Text>
        <Text style={styles.meta}>
          #{pr.number} · {pr.author}
        </Text>
        {rating ? (
          <Text style={styles.meta} testID={testID && `${testID}.rating`}>
            Nota {rating} de 5
          </Text>
        ) : null}
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={saveLabel}
        accessibilityState={{ selected: saved }}
        hitSlop={spacing.sm}
        onPress={onToggleSave}
        style={styles.save}
        testID={testID && testID.replace('card', 'save')}
      >
        <Text style={[styles.saveGlyph, saved && styles.saved]}>{saved ? '★' : '☆'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  body: { padding: spacing.md, gap: spacing.xs, paddingEnd: touch.min },
  title: { ...typography.body, color: colors.text, flexShrink: 1 },
  meta: { ...typography.caption, color: colors.textMuted },
  save: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: touch.min,
    minHeight: touch.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveGlyph: { fontSize: 24, color: colors.textMuted },
  saved: { color: colors.star },
});
