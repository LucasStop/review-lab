import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useAuth } from '../contexts/AuthContext';
import { colors, touch, typography } from '../theme';
import { placeholder } from './Placeholder';
import type { AppStackParamList } from './types';

const Stack = createNativeStackNavigator<AppStackParamList>();

// Provisório: o Sair passa para o Perfil no #125 e o header do Catálogo fica só com "Perfil".
function LogoutButton() {
  const { signOut } = useAuth();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Sair"
      onPress={() => void signOut()}
      style={styles.logout}
      testID="catalog.logout"
    >
      <Text style={styles.logoutText}>Sair</Text>
    </Pressable>
  );
}

export function AppStack() {
  return (
    <Stack.Navigator initialRouteName="Catalog">
      <Stack.Screen
        name="Catalog"
        component={placeholder('Catálogo')}
        options={{ title: 'Review Lab', headerLeft: () => <LogoutButton /> }}
      />
      <Stack.Screen
        name="Detail"
        component={placeholder('Detalhe')}
        options={({ route }) => ({ title: `PR #${route.params.number}` })}
      />
      <Stack.Screen
        name="Profile"
        component={placeholder('Perfil')}
        options={{ title: 'Perfil' }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  logout: {
    minWidth: touch.min,
    minHeight: touch.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: { ...typography.button, color: colors.link },
});
