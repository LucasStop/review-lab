import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { colors, radius, spacing, touch, typography } from '../theme';

type Props = Pick<
  TextInputProps,
  | 'value'
  | 'onChangeText'
  | 'secureTextEntry'
  | 'keyboardType'
  | 'autoComplete'
  | 'textContentType'
  | 'returnKeyType'
  | 'onSubmitEditing'
  | 'testID'
  | 'autoFocus'
> & { label: string };

export function TextField({ label, ...input }: Props) {
  return (
    <View style={styles.field}>
      {/* Só o input leva o label ao leitor de tela; com o texto também, o VoiceOver lê duas vezes. */}
      <Text style={styles.label} accessibilityElementsHidden importantForAccessibility="no">
        {label}
      </Text>
      <TextInput
        {...input}
        accessibilityLabel={label}
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  label: { ...typography.label, color: colors.text },
  input: {
    minHeight: touch.min,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    color: colors.text,
    fontSize: typography.body.fontSize,
  },
});
