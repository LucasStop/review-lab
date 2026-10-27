import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, glyph, radius, spacing, touch, typography } from '../theme';
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
  saveTestID?: string;
};

export function PullRequestCard({
  pr,
  saved,
  onPress,
  onToggleSave,
  rating,
  testID,
  saveTestID,
}: Props) {
  const saveLabel = saved ? 'Remover dos salvos' : 'Salvar para estudar';
  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`PR #${pr.number}: ${pr.title}, de ${pr.author}${rating ? `, nota ${rating} de 5` : ''}`}
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
          <Text style={styles.rating} testID={testID && `${testID}.rating`}>
            {'★'.repeat(rating) + '☆'.repeat(5 - rating)}
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
        testID={saveTestID}
      >
        {/* Teto de 1,5x: o glifo (24 * 1,5 = 36) cabe no alvo de 44 e não invade o título. */}
        <Text maxFontSizeMultiplier={1.5} style={[styles.saveGlyph, saved && styles.saved]}>
          {saved ? '★' : '☆'}
        </Text>
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
  rating: { ...typography.caption, color: colors.star },
  save: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: touch.min,
    minHeight: touch.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveGlyph: { fontSize: glyph.md, color: colors.textMuted },
  saved: { color: colors.star },
});
