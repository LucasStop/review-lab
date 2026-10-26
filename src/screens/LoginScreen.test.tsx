import { beforeEach, expect, jest, test } from '@jest/globals';
import type { ComponentProps } from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import type { AuthResult } from '../services/credentials';
import { LoginScreen } from './LoginScreen';

const mockSignIn = jest.fn<(email: string, password: string) => Promise<AuthResult>>();
jest.mock('../contexts/AuthContext', () => ({ useAuth: () => ({ signIn: mockSignIn }) }));

const navigate = jest.fn();
const props = { navigation: { navigate } } as unknown as ComponentProps<typeof LoginScreen>;

async function fill(email: string, password: string) {
  await fireEvent.changeText(screen.getByTestId('login.email'), email);
  await fireEvent.changeText(screen.getByTestId('login.password'), password);
  await fireEvent.press(screen.getByTestId('login.submit'));
}

beforeEach(() => {
  mockSignIn.mockReset();
  navigate.mockReset();
});

test('C04: wrong password and unknown e-mail show the same message, without naming a field', async () => {
  mockSignIn.mockResolvedValue({ ok: false, reason: 'invalid-credentials' });
  await render(<LoginScreen {...props} />);

  await fill('ana@exemplo.com', 'errada');
  expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha incorretos.');
  expect(screen.getByTestId('login.error')).toBeTruthy();
});

test('C08: shows the ActivityIndicator and blocks a second press while signing in', async () => {
  let finish: (r: AuthResult) => void = () => {};
  mockSignIn.mockReturnValue(new Promise((resolve) => (finish = resolve)));
  await render(<LoginScreen {...props} />);

  await fill('ana@exemplo.com', 'segredo123');
  expect(screen.getByTestId('loading')).toBeTruthy();
  expect(screen.getByTestId('login.submit')).toBeDisabled();
  await fireEvent.press(screen.getByTestId('login.submit'));
  expect(mockSignIn).toHaveBeenCalledTimes(1);

  finish({ ok: false, reason: 'invalid-credentials' });
  expect(await screen.findByTestId('login.error')).toBeTruthy();
  expect(screen.queryByTestId('loading')).toBeNull();
});

test('keeps the password field secure and sends the typed values', async () => {
  mockSignIn.mockResolvedValue({ ok: true, userId: 'u1' });
  await render(<LoginScreen {...props} />);

  expect(screen.getByTestId('login.password').props.secureTextEntry).toBe(true);
  await fill('ana@exemplo.com', 'segredo123');
  expect(mockSignIn).toHaveBeenCalledWith('ana@exemplo.com', 'segredo123');
});

test('"Não tenho conta" opens the sign-up screen', async () => {
  await render(<LoginScreen {...props} />);
  await fireEvent.press(screen.getByTestId('login.signup'));
  expect(navigate).toHaveBeenCalledWith('SignUp');
});
