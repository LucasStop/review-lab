import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { placeholder } from './Placeholder';
import type { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Login" component={placeholder('Login')} options={{ title: 'Entrar' }} />
      <Stack.Screen
        name="SignUp"
        component={placeholder('Cadastro')}
        options={{ title: 'Criar conta' }}
      />
    </Stack.Navigator>
  );
}
