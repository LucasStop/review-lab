import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAuth } from '../contexts/AuthContext';
import { FavoritesProvider, useFavorites } from '../contexts/FavoritesContext';
import { LayoutProvider, useLayout } from '../contexts/LayoutContext';
import { StudiedProvider, useStudied } from '../contexts/StudiedContext';
import { colors } from '../theme';
import { AppStack } from './AppStack';
import { AuthStack } from './AuthStack';

function Loading() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator
        testID="loading"
        accessibilityLabel="Carregando"
        color={colors.primary}
        size="large"
      />
    </View>
  );
}

// Fica dentro dos providers porque só eles enxergam o próprio `hydrated`. Até favoritos,
// estudados e o layout saírem do disco nenhuma tela monta: Salvos, Estudados e os botões do
// Detalhe nunca aparecem zerados (C26), e o Catálogo não pisca de 2 para 1 coluna (C66).
// Leitura que falhou também conta como hidratada e abre no padrão.
function HydrationGate() {
  const favorites = useFavorites();
  const studied = useStudied();
  const layout = useLayout();
  if (!favorites.hydrated || !studied.hydrated || !layout.hydrated) return <Loading />;
  return <AppStack />;
}

// Troca a stack inteira pelo estado da sessão: login e logout não chamam `navigate`, e sem
// sessão a AppStack nem existe (C51). Enquanto `hydrated` é falso mostra o loader, nunca o Login.
export function RootNavigator() {
  const { user, hydrated } = useAuth();

  if (!hydrated) return <Loading />;
  if (!user) return <AuthStack />;
  // `key` remonta os providers a cada troca de usuário: listas e layout são por conta.
  return (
    <FavoritesProvider key={user.id} userId={user.id}>
      <StudiedProvider userId={user.id}>
        <LayoutProvider userId={user.id}>
          <HydrationGate />
        </LayoutProvider>
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
