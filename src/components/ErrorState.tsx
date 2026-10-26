import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, touch, typography } from '../theme';

type Props = {
  message: string;
  onRetry: () => void;
};

export function ErrorState({ message, onRetry }: Props) {
  return (
    <View style={styles.container}>
      {/* No Text, não no View: View sem `accessible` não expõe o role, e com `accessible`
          engoliria o botão num foco só. */}
      <Text style={styles.message} accessibilityRole="alert">
        {message}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Tentar novamente"
        onPress={onRetry}
        style={styles.button}
      >
        <Text style={styles.buttonText}>Tentar novamente</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.lg,
  },
  message: { ...typography.body, color: colors.text, textAlign: 'center' },
  button: {
    minWidth: touch.min,
    minHeight: touch.min,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  buttonText: { ...typography.button, color: colors.onPrimary },
});
