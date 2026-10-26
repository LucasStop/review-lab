import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';

import { Button } from '../components/Button';
import { TextField } from '../components/TextField';
import type { AuthResult } from '../services/credentials';
import { colors, spacing, touch, typography } from '../theme';

type Reason = Extract<AuthResult, { ok: false }>['reason'];

type Props = {
  // Prefixo dos testIDs (`login.email`, `signup.submit`...).
  id: 'login' | 'signup';
  submitLabel: string;
  switchLabel: string;
  switchTestID: string;
  onSwitch: () => void;
  submit: (email: string, password: string) => Promise<AuthResult>;
  messages: Record<Reason, string>;
};

// Login e cadastro são o mesmo formulário; só mudam a chamada, as mensagens e o link.
export function AuthForm({
  id,
  submitLabel,
  switchLabel,
  switchTestID,
  onSwitch,
  submit,
  messages,
}: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    setBusy(true);
    setError(null);
    const result = await submit(email, password);
    // Em sucesso a stack troca e esta tela desmonta; só falha volta ao formulário.
    if (!result.ok) {
      setError(messages[result.reason]);
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TextField
          label="E-mail"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoComplete="email"
          testID={`${id}.email`}
        />
        <TextField
          label="Senha"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
          testID={`${id}.password`}
        />
        {error && (
          <Text style={styles.error} accessibilityRole="alert" testID={`${id}.error`}>
            {error}
          </Text>
        )}
        <Button
          label={submitLabel}
          onPress={() => void onSubmit()}
          loading={busy}
          testID={`${id}.submit`}
        />
        <Pressable
          accessibilityRole="button"
          onPress={onSwitch}
          style={styles.link}
          testID={switchTestID}
        >
          <Text style={styles.linkText}>{switchLabel}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md },
  error: {
    ...typography.caption,
    color: colors.danger,
    backgroundColor: colors.dangerSurface,
    padding: spacing.md,
    borderRadius: spacing.sm,
  },
  link: { minHeight: touch.min, alignItems: 'center', justifyContent: 'center' },
  linkText: { ...typography.body, color: colors.link, textDecorationLine: 'underline' },
});
