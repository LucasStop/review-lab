import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, type HostInstance } from 'react-native';

import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { TextField } from '../components/TextField';
import { useAuth } from '../contexts/AuthContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { useStudied } from '../contexts/StudiedContext';
import { colors, radius, spacing, typography } from '../theme';
import { averageRating } from '../utils/collections';

// Sessão gravada antes do #125 só tem o userId; o e-mail volta no próximo login.
const NO_EMAIL = 'E-mail indisponível. Entre de novo para vê-lo.';
const WRONG_PASSWORD = 'Senha incorreta.';
const UNEXPECTED = 'Não foi possível excluir agora. Tente de novo.';

type Dialog = 'logout' | 'delete' | null;

function Tile({ value, label, spoken, testID }: Record<string, string>) {
  return (
    <View style={styles.tile} accessible accessibilityLabel={spoken} testID={testID}>
      <Text style={styles.tileValue}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

export function ProfileScreen() {
  const { user, signOut, deleteAccount } = useAuth();
  const { favorites } = useFavorites();
  const { studied } = useStudied();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  // Guarda síncrona: o `disabled` do botão só vale depois do re-render.
  const sending = useRef(false);
  const logoutRef = useRef<HostInstance>(null);
  const deleteRef = useRef<HostInstance>(null);

  const avg = averageRating(studied);
  const avgText = avg === null ? '—' : avg.toFixed(1).replace('.', ',');

  const close = () => {
    setDialog(null);
    setPassword('');
    setError(null);
  };

  // Fecha antes de sair: o signOut desmonta a AppStack com o Modal junto.
  const confirmLogout = () => {
    close();
    void signOut().catch(() => {});
  };

  async function confirmDelete() {
    if (sending.current) return;
    sending.current = true;
    setDeleting(true);
    setError(null);
    try {
      const result = await deleteAccount(password);
      // Em sucesso a AppStack desmonta e o RootNavigator mostra o Login.
      if (result.ok) return;
      setError(WRONG_PASSWORD);
    } catch {
      setError(UNEXPECTED);
    }
    sending.current = false;
    setDeleting(false);
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.account}>
        <Avatar name={user?.email ?? '?'} size={56} accessible={false} />
        <View style={styles.flex}>
          <Text style={styles.email} testID="profile.email">
            {user?.email ?? NO_EMAIL}
          </Text>
          <Text style={styles.muted}>Conta neste aparelho</Text>
        </View>
      </View>

      <View style={styles.tiles}>
        <Tile
          value={String(favorites.length)}
          label="salvos"
          spoken={`Salvos: ${favorites.length}`}
          testID="profile.saved-count"
        />
        <Tile
          value={String(studied.length)}
          label="estudados"
          spoken={`Estudados: ${studied.length}`}
          testID="profile.studied-count"
        />
        <Tile
          value={avgText}
          label="nota média"
          spoken={`Nota média: ${avg === null ? 'nenhuma' : avgText}`}
          testID="profile.avg"
        />
      </View>

      <View style={styles.actions}>
        <Button
          ref={logoutRef}
          label="Sair"
          variant="secondary"
          onPress={() => setDialog('logout')}
          testID="profile.logout"
        />
        <Button
          ref={deleteRef}
          label="Excluir conta"
          variant="danger"
          onPress={() => setDialog('delete')}
          testID="profile.delete"
        />
      </View>

      <ConfirmDialog
        visible={dialog === 'logout'}
        title="Sair da conta?"
        message="Seus salvos e estudados continuam guardados neste aparelho."
        confirmLabel="Sair"
        onConfirm={confirmLogout}
        onCancel={close}
        returnFocusTo={logoutRef}
        testIDPrefix="profile"
      />
      <ConfirmDialog
        visible={dialog === 'delete'}
        title="Excluir conta?"
        message="Apaga seu cadastro, salvos e estudados deste aparelho. Não dá para desfazer."
        confirmLabel="Excluir"
        danger
        onConfirm={() => void confirmDelete()}
        onCancel={close}
        returnFocusTo={deleteRef}
        confirmDisabled={!password}
        loading={deleting}
        testIDPrefix="profile"
      >
        <TextField
          label="Senha"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="off"
          autoFocus
          returnKeyType="done"
          testID="profile.password"
        />
        {error && (
          <Text style={styles.error} accessibilityRole="alert" testID="profile.error">
            {error}
          </Text>
        )}
      </ConfirmDialog>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg },
  flex: { flex: 1 },
  account: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  email: { ...typography.heading, color: colors.text },
  muted: { ...typography.caption, color: colors.textMuted },
  tiles: { flexDirection: 'row', gap: spacing.sm },
  tile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  tileValue: { ...typography.title, color: colors.text },
  tileLabel: { ...typography.caption, color: colors.textMuted },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  error: {
    ...typography.caption,
    color: colors.danger,
    backgroundColor: colors.dangerSurface,
    padding: spacing.md,
    borderRadius: radius.md,
  },
});
