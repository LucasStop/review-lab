import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAuth } from '../contexts/AuthContext';
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
  return user ? <AppStack /> : <AuthStack />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
