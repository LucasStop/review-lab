import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { colors, radius, spacing, touch, typography } from '../theme';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  loading?: boolean;
  disabled?: boolean;
  testID?: string;
};

export function Button({ label, onPress, variant = 'primary', loading, disabled, testID }: Props) {
  const blocked = !!(disabled || loading);
  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      // O label fica mesmo com o spinner no lugar do texto: o leitor de tela não perde o botão.
      accessibilityLabel={label}
      accessibilityState={{ disabled: blocked, busy: !!loading }}
      disabled={blocked}
      onPress={onPress}
      testID={testID}
      style={[styles.button, primary ? styles.primary : styles.secondary, blocked && styles.dim]}
    >
      {loading ? (
        <ActivityIndicator testID="loading" color={primary ? colors.onPrimary : colors.text} />
      ) : (
        <Text style={[styles.text, { color: primary ? colors.onPrimary : colors.text }]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: touch.min,
    minWidth: touch.min,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.surface },
  dim: { opacity: 0.6 },
  text: typography.button,
});
