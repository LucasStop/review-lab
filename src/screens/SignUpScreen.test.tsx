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

test('C03: invalid input shows the rule that failed, not a generic error', async () => {
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
  expect(screen.getByTestId('signup.password').props.secureTextEntry).toBe(true);
});

test('"Já tenho conta" goes back to the login screen', async () => {
  await render(<SignUpScreen {...props} />);
  await fireEvent.press(screen.getByTestId('signup.login'));
  expect(navigate).toHaveBeenCalledWith('Login');
});
