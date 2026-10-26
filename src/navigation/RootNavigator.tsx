import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAuth } from '../contexts/AuthContext';
import { FavoritesProvider } from '../contexts/FavoritesContext';
import { StudiedProvider } from '../contexts/StudiedContext';
import { colors } from '../theme';
import { AppStack } from './AppStack';
import { AuthStack } from './AuthStack';

// Troca a stack inteira pelo estado da sessão: login e logout não chamam `navigate`, e sem
// sessão a AppStack nem existe (C51). Enquanto `hydrated` é falso mostra o loader, nunca o Login.
export function RootNavigator() {
  const { user, hydrated } = useAuth();

  if (!hydrated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator
          testID="loading"
          accessibilityLabel="Carregando"
          color={colors.primary}
        />
      </View>
    );
  }
  if (!user) return <AuthStack />;
  // `key` remonta os providers a cada troca de usuário: favoritos e estudados são por conta.
  return (
    <FavoritesProvider key={user.id} userId={user.id}>
      <StudiedProvider userId={user.id}>
        <AppStack />
      </StudiedProvider>
    </FavoritesProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
