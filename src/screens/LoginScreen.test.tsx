import { beforeEach, expect, jest, test } from '@jest/globals';
import type { ComponentProps } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';

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

test.each(['invalid-credentials', 'invalid-input', 'email-taken'] as const)(
  'C04: reason %s shows the same message, without naming a field',
  async (reason) => {
    mockSignIn.mockResolvedValue({ ok: false, reason });
    await render(<LoginScreen {...props} />);

    await fill('ana@exemplo.com', 'errada');
    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha incorretos.');
    expect(screen.getByTestId('login.error')).toBeTruthy();
  },
);

test('a rejected sign-in shows a message and frees the button', async () => {
  mockSignIn.mockRejectedValue(new Error('SecureStore'));
  await render(<LoginScreen {...props} />);

  await fill('ana@exemplo.com', 'segredo123');
  expect(await screen.findByTestId('login.error')).toHaveTextContent(
    'Não foi possível concluir agora. Tente de novo.',
  );
  expect(screen.queryByTestId('loading')).toBeNull();
  expect(screen.getByTestId('login.submit')).toBeEnabled();
});

test('two presses in the same tick call signIn once', async () => {
  mockSignIn.mockReturnValue(new Promise(() => {}));
  await render(<LoginScreen {...props} />);

  await fireEvent.changeText(screen.getByTestId('login.email'), 'ana@exemplo.com');
  await fireEvent.changeText(screen.getByTestId('login.password'), 'segredo123');
  // Dois toques antes de qualquer re-render: só a guarda síncrona os segura.
  const press = screen.getByTestId('login.submit').props.onClick;
  await act(async () => {
    press({});
    press({});
  });
  expect(mockSignIn).toHaveBeenCalledTimes(1);
});

test('typing again clears the previous error', async () => {
  mockSignIn.mockResolvedValue({ ok: false, reason: 'invalid-credentials' });
  await render(<LoginScreen {...props} />);

  await fill('ana@exemplo.com', 'errada');
  expect(await screen.findByTestId('login.error')).toBeTruthy();
  await fireEvent.changeText(screen.getByTestId('login.password'), 'errada2');
  expect(screen.queryByTestId('login.error')).toBeNull();
});

test('the keyboard "done" key submits from the password field', async () => {
  mockSignIn.mockResolvedValue({ ok: true, userId: 'u1' });
  await render(<LoginScreen {...props} />);

  await fireEvent.changeText(screen.getByTestId('login.email'), 'ana@exemplo.com');
  await fireEvent.changeText(screen.getByTestId('login.password'), 'segredo123');
  await fireEvent(screen.getByTestId('login.password'), 'submitEditing');
  expect(mockSignIn).toHaveBeenCalledWith('ana@exemplo.com', 'segredo123');
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

test('C43: the error is announced once, without the Android live region', async () => {
  const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockClear();
  mockSignIn.mockResolvedValue({ ok: false, reason: 'invalid-credentials' });
  await render(<LoginScreen {...props} />);

  await fill('ana@exemplo.com', 'errada');

  expect(await screen.findByTestId('login.error')).toBeTruthy();
  expect(announce).toHaveBeenCalledTimes(1);
  expect(announce).toHaveBeenCalledWith('E-mail ou senha incorretos.');
  expect(screen.getByTestId('login.error').props.accessibilityLiveRegion).toBeUndefined();
  announce.mockRestore();
});

test('C43: the switch link has its own label, the visible text', async () => {
  await render(<LoginScreen {...props} />);

  expect(screen.getByTestId('login.signup').props.accessibilityLabel).toBe('Não tenho conta');
});
