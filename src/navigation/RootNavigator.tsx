import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAuth } from '../contexts/AuthContext';
import { FavoritesProvider, useFavorites } from '../contexts/FavoritesContext';
import { StudiedProvider, useStudied } from '../contexts/StudiedContext';
import { colors } from '../theme';
import { AppStack } from './AppStack';
import { AuthStack } from './AuthStack';

function Loading() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator testID="loading" accessibilityLabel="Carregando" color={colors.primary} />
    </View>
  );
}

// Fica dentro dos providers porque só eles enxergam o próprio `hydrated`. Até favoritos e
// estudados saírem do disco nenhuma tela monta: Salvos, Estudados e os botões do Detalhe
// nunca aparecem zerados (C26). Leitura que falhou também conta como hidratada e abre vazia.
function HydrationGate() {
  const favorites = useFavorites();
  const studied = useStudied();
  if (!favorites.hydrated || !studied.hydrated) return <Loading />;
  return <AppStack />;
}

// Troca a stack inteira pelo estado da sessão: login e logout não chamam `navigate`, e sem
// sessão a AppStack nem existe (C51). Enquanto `hydrated` é falso mostra o loader, nunca o Login.
export function RootNavigator() {
  const { user, hydrated } = useAuth();

  if (!hydrated) return <Loading />;
  if (!user) return <AuthStack />;
  // `key` remonta os providers a cada troca de usuário: favoritos e estudados são por conta.
  return (
    <FavoritesProvider key={user.id} userId={user.id}>
      <StudiedProvider userId={user.id}>
        <HydrationGate />
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
