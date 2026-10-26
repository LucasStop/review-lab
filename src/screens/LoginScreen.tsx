import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAuth } from '../contexts/AuthContext';
import type { AuthStackParamList } from '../navigation/types';
import { AuthForm } from './AuthForm';

// Uma só mensagem para e-mail desconhecido e senha errada: não revela qual campo falhou (C04).
const INVALID = 'E-mail ou senha incorretos.';

export function LoginScreen({ navigation }: NativeStackScreenProps<AuthStackParamList, 'Login'>) {
  const { signIn } = useAuth();
  return (
    <AuthForm
      id="login"
      passwordAutoComplete="password"
      submitLabel="Entrar"
      switchLabel="Não tenho conta"
      switchTestID="login.signup"
      onSwitch={() => navigation.navigate('SignUp')}
      submit={signIn}
      messages={{
        'invalid-credentials': INVALID,
        'invalid-input': INVALID,
        'email-taken': INVALID,
      }}
    />
  );
}
