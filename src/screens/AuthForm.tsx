import { useRef, useState } from 'react';
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

const UNEXPECTED = 'Não foi possível concluir agora. Tente de novo.';

type Reason = Extract<AuthResult, { ok: false }>['reason'];

type Props = {
  // Prefixo dos testIDs (`login.email`, `signup.submit`...).
  id: 'login' | 'signup';
  // `new-password` no cadastro: o gerenciador de senhas sugere e guarda uma senha nova.
  passwordAutoComplete: 'password' | 'new-password';
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
  passwordAutoComplete,
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
  // Guarda síncrona: o `disabled` do botão só vale depois do re-render, e dois toques no mesmo
  // tick chamariam `submit` duas vezes.
  const sending = useRef(false);

  async function onSubmit() {
    if (sending.current) return;
    sending.current = true;
    setBusy(true);
    setError(null);
    try {
      const result = await submit(email, password);
      // Em sucesso a stack troca e esta tela desmonta; só falha volta ao formulário.
      if (result.ok) return;
      setError(messages[result.reason]);
    } catch {
      // SecureStore ou expo-crypto podem falhar; sem isto o botão ficaria preso no spinner.
      setError(UNEXPECTED);
    }
    sending.current = false;
    setBusy(false);
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
          onChangeText={(text) => {
            setEmail(text);
            setError(null);
          }}
          keyboardType="email-address"
          autoComplete="email"
          testID={`${id}.email`}
        />
        <TextField
          label="Senha"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setError(null);
          }}
          secureTextEntry
          autoComplete={passwordAutoComplete}
          returnKeyType="done"
          onSubmitEditing={() => void onSubmit()}
          testID={`${id}.password`}
        />
        {error && (
          <Text
            style={styles.error}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            testID={`${id}.error`}
          >
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
