import { beforeEach, expect, jest, test } from '@jest/globals';
import type { ComponentProps } from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import type { AuthResult } from '../services/credentials';
import { SignUpScreen } from './SignUpScreen';

const mockSignUp = jest.fn<(email: string, password: string) => Promise<AuthResult>>();
jest.mock('../contexts/AuthContext', () => ({ useAuth: () => ({ signUp: mockSignUp }) }));

const navigate = jest.fn();
const props = { navigation: { navigate } } as unknown as ComponentProps<typeof SignUpScreen>;

async function fill(email: string, password: string) {
  await fireEvent.changeText(screen.getByTestId('signup.email'), email);
  await fireEvent.changeText(screen.getByTestId('signup.password'), password);
  await fireEvent.press(screen.getByTestId('signup.submit'));
}

beforeEach(() => {
  mockSignUp.mockReset();
  navigate.mockReset();
});

test('C02: a repeated e-mail shows the message on screen', async () => {
  mockSignUp.mockResolvedValue({ ok: false, reason: 'email-taken' });
  await render(<SignUpScreen {...props} />);

  await fill('ana@exemplo.com', 'segredo123');
  expect(await screen.findByRole('alert')).toHaveTextContent('Esse e-mail já tem conta.');
});

test('C03: invalid input explains the rules (valid e-mail, at least 6 characters)', async () => {
  mockSignUp.mockResolvedValue({ ok: false, reason: 'invalid-input' });
  await render(<SignUpScreen {...props} />);

  await fill('sem-arroba', '123');
  expect(await screen.findByTestId('signup.error')).toHaveTextContent(
    'Use um e-mail válido e uma senha de pelo menos 6 caracteres.',
  );
});

test('C08: shows the ActivityIndicator while creating the account', async () => {
  mockSignUp.mockReturnValue(new Promise(() => {}));
  await render(<SignUpScreen {...props} />);

  await fill('ana@exemplo.com', 'segredo123');
  expect(screen.getByTestId('loading')).toBeTruthy();
});

test('the password field is secure', async () => {
  await render(<SignUpScreen {...props} />);
  const field = screen.getByTestId('signup.password');
  expect(field.props.secureTextEntry).toBe(true);
});

test('a valid sign-up sends the typed values and shows no error', async () => {
  mockSignUp.mockResolvedValue({ ok: true, userId: 'u1' });
  await render(<SignUpScreen {...props} />);

  await fill('ana@exemplo.com', 'segredo123');
  expect(mockSignUp).toHaveBeenCalledWith('ana@exemplo.com', 'segredo123');
  expect(screen.queryByTestId('signup.error')).toBeNull();
});

test('"Já tenho conta" goes back to the login screen', async () => {
  await render(<SignUpScreen {...props} />);
  await fireEvent.press(screen.getByTestId('signup.login'));
  expect(navigate).toHaveBeenCalledWith('Login');
});
