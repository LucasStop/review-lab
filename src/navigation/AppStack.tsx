import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { placeholder } from './Placeholder';
import type { AppStackParamList } from './types';

const Stack = createNativeStackNavigator<AppStackParamList>();

export function AppStack() {
  return (
    <Stack.Navigator initialRouteName="Catalog">
      <Stack.Screen
        name="Catalog"
        component={placeholder('Catálogo')}
        options={{ title: 'Review Lab' }}
      />
      <Stack.Screen
        name="Detail"
        component={placeholder('Detalhe')}
        options={({ route }) => ({ title: `PR #${route.params.number}` })}
      />
      <Stack.Screen name="Search" component={placeholder('Busca')} options={{ title: 'Buscar' }} />
      <Stack.Screen
        name="Favorites"
        component={placeholder('Salvos')}
        options={{ title: 'Salvos' }}
      />
      <Stack.Screen
        name="Studied"
        component={placeholder('Estudados')}
        options={{ title: 'Estudados' }}
      />
    </Stack.Navigator>
  );
}
