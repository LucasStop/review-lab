import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAuth } from '../contexts/AuthContext';
import type { AuthStackParamList } from '../navigation/types';
import { AuthForm } from './AuthForm';

export function SignUpScreen({ navigation }: NativeStackScreenProps<AuthStackParamList, 'SignUp'>) {
  const { signUp } = useAuth();
  return (
    <AuthForm
      id="signup"
      passwordAutoComplete="new-password"
      submitLabel="Criar conta"
      switchLabel="Já tenho conta"
      switchTestID="signup.login"
      onSwitch={() => navigation.navigate('Login')}
      submit={signUp}
      messages={{
        'email-taken': 'Esse e-mail já tem conta.',
        'invalid-input': 'Use um e-mail válido e uma senha de pelo menos 6 caracteres.',
        'invalid-credentials': 'Não foi possível criar a conta.',
      }}
    />
  );
}
