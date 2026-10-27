import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, touch, typography } from '../theme';
import { CatalogScreen } from '../screens/CatalogScreen';
import { DetailScreen } from '../screens/DetailScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import type { AppStackParamList } from './types';

const Stack = createNativeStackNavigator<AppStackParamList>();

export function AppStack() {
  return (
    <Stack.Navigator initialRouteName="Catalog">
      <Stack.Screen
        name="Catalog"
        component={CatalogScreen}
        options={({ navigation }) => ({
          title: 'Review Lab',
          headerRight: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Perfil"
              onPress={() => navigation.navigate('Profile')}
              style={styles.headerButton}
              testID="catalog.profile"
            >
              <Text style={styles.headerButtonText}>Perfil</Text>
            </Pressable>
          ),
        })}
      />
      <Stack.Screen
        name="Detail"
        component={DetailScreen}
        options={({ route }) => ({ title: `PR #${route.params.number}` })}
      />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil' }} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  headerButton: {
    minWidth: touch.min,
    minHeight: touch.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonText: { ...typography.button, color: colors.link },
});
