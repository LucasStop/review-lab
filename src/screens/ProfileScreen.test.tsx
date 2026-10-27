import { beforeEach, expect, jest, test } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, screen, within } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';

import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { FavoritesProvider } from '../contexts/FavoritesContext';
import { StudiedProvider } from '../contexts/StudiedContext';
import type { AuthResult } from '../services/credentials';
import type { Session } from '../services/session';
import { ProfileScreen } from './ProfileScreen';

const mockAuth = {
  restore: jest.fn<() => Promise<Session | null>>(),
  signIn: jest.fn<(email: string, password: string) => Promise<AuthResult>>(),
  signUp: jest.fn<(email: string, password: string) => Promise<AuthResult>>(),
  signOut: jest.fn<() => Promise<void>>(),
  deleteAccount: jest.fn<(userId: string, password: string) => Promise<AuthResult>>(),
};
jest.mock('../services/appAuth', () => ({
  get auth() {
    return mockAuth;
  },
}));

const pr = (number: number) => ({ number, title: `t${number}`, author: 'ana' });

function Profile() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <FavoritesProvider userId={user.id}>
      <StudiedProvider userId={user.id}>
        <ProfileScreen />
      </StudiedProvider>
    </FavoritesProvider>
  );
}

async function renderProfile(session: Session = { userId: 'u1', email: 'ana@exemplo.com' }) {
  mockAuth.restore.mockResolvedValue(session);
  await render(
    <AuthProvider>
      <Profile />
    </AuthProvider>,
  );
  await screen.findByTestId('profile.email');
}

async function openDelete(password?: string) {
  await fireEvent.press(screen.getByTestId('profile.delete'));
  if (password !== undefined) {
    await fireEvent.changeText(screen.getByTestId('profile.password'), password);
  }
}

beforeEach(async () => {
  await AsyncStorage.clear();
  Object.values(mockAuth).forEach((fn) => fn.mockReset());
  mockAuth.signOut.mockResolvedValue();
  jest.restoreAllMocks();
});

test('C56: shows the email, the saved and studied totals and the average rating', async () => {
  await AsyncStorage.setItem('rl.u1.favorites', JSON.stringify([pr(1), pr(2), pr(3)]));
  // Média 4,333…: só com 1 casa ela vira "4,3".
  await AsyncStorage.setItem(
    'rl.u1.studied',
    JSON.stringify([
      { ...pr(1), rating: 4 },
      { ...pr(2), rating: 5 },
      { ...pr(3), rating: 4 },
    ]),
  );
  await renderProfile();

  expect(screen.getByTestId('profile.email')).toHaveTextContent('ana@exemplo.com');
  expect(await within(screen.getByTestId('profile.avg')).findByText('4,3')).toBeTruthy();
  expect(screen.getByTestId('profile.saved-count')).toHaveTextContent('3salvos');
  expect(screen.getByTestId('profile.studied-count')).toHaveTextContent('3estudados');
  expect(screen.getByTestId('profile.avg').props.accessibilityLabel).toBe('Nota média: 4,3');
});

test('C56: without studied PRs the average is a dash with a spoken label', async () => {
  await renderProfile();

  expect(screen.getByTestId('profile.saved-count')).toHaveTextContent('0salvos');
  expect(screen.getByTestId('profile.studied-count')).toHaveTextContent('0estudados');
  expect(within(screen.getByTestId('profile.avg')).getByText('—')).toBeTruthy();
  expect(screen.getByTestId('profile.avg').props.accessibilityLabel).toBe('Nota média: nenhuma');
});

test('a session stored in the old format shows the fallback text and the "?" avatar', async () => {
  await renderProfile({ userId: 'a'.repeat(64) });

  expect(screen.getByTestId('profile.email')).toHaveTextContent(
    'E-mail indisponível. Entre de novo para vê-lo.',
  );
  expect(screen.getByText('?')).toBeTruthy();
});

test('C57: logout asks first, and Cancel keeps the session and the screen', async () => {
  await renderProfile();

  await fireEvent.press(screen.getByTestId('profile.logout'));
  expect(screen.getByText('Sair da conta?')).toBeTruthy();
  await fireEvent.press(screen.getByTestId('profile.cancel'));

  expect(screen.queryByText('Sair da conta?')).toBeNull();
  expect(mockAuth.signOut).not.toHaveBeenCalled();
  expect(screen.getByTestId('profile.email')).toBeTruthy();
});

test('confirming logout closes the dialog before the sign-out finishes', async () => {
  // Pendente: o AuthProvider não zera o user, então só o próprio Perfil pode fechar o diálogo.
  mockAuth.signOut.mockReturnValue(new Promise(() => {}));
  await renderProfile();

  await fireEvent.press(screen.getByTestId('profile.logout'));
  await fireEvent.press(screen.getByTestId('profile.confirm'));

  expect(mockAuth.signOut).toHaveBeenCalledTimes(1);
  expect(screen.queryByText('Sair da conta?')).toBeNull();
});

test('Excluir stays disabled while the password field is empty', async () => {
  await renderProfile();
  await openDelete();

  expect(screen.getByTestId('profile.confirm').props.accessibilityState).toMatchObject({
    disabled: true,
  });
  await fireEvent.changeText(screen.getByTestId('profile.password'), 'x');
  expect(screen.getByTestId('profile.confirm').props.accessibilityState).toMatchObject({
    disabled: false,
  });
});

test('C59: a wrong password shows "Senha incorreta." and keeps the account', async () => {
  mockAuth.deleteAccount.mockResolvedValue({ ok: false, reason: 'invalid-credentials' });
  await renderProfile();
  await openDelete('errada123');

  await fireEvent.press(screen.getByTestId('profile.confirm'));

  expect(await screen.findByText('Senha incorreta.')).toBeTruthy();
  expect(mockAuth.deleteAccount).toHaveBeenCalledWith('u1', 'errada123');
  expect(screen.getByTestId('profile.error').props.accessibilityRole).toBe('alert');
  expect(screen.getByTestId('profile.email')).toHaveTextContent('ana@exemplo.com');
});

test('with the keyboard open, the first tap on Excluir confirms instead of only closing the keyboard', async () => {
  await renderProfile();
  await openDelete('errada123');

  // O ConfirmDialog é filho da ScrollView na árvore do React, então herda a regra dela.
  expect(screen.root?.type).toBe('RCTScrollView');
  expect(screen.root?.props.keyboardShouldPersistTaps).toBe('handled');
});

test('a rejected deleteAccount shows an error and frees the button instead of spinning forever', async () => {
  mockAuth.deleteAccount.mockRejectedValue(new Error('secure store down'));
  await renderProfile();
  await openDelete('certa123');

  await fireEvent.press(screen.getByTestId('profile.confirm'));

  expect(await screen.findByText('Não foi possível excluir agora. Tente de novo.')).toBeTruthy();
  expect(screen.getByTestId('profile.confirm').props.accessibilityState).toMatchObject({
    disabled: false,
    busy: false,
  });
});

test('a double tap on Excluir deletes only once', async () => {
  mockAuth.deleteAccount.mockReturnValue(new Promise(() => {}));
  await renderProfile();
  await openDelete('certa123');

  // Os dois toques no mesmo act, sem re-render no meio: o `loading` do botão ainda não vale e
  // só a guarda síncrona segura o segundo.
  const confirm = screen.getByTestId('profile.confirm');
  await act(async () => {
    void fireEvent.press(confirm);
    void fireEvent.press(confirm);
  });

  expect(mockAuth.deleteAccount).toHaveBeenCalledTimes(1);
});

test('after a wrong password, a new password can be sent again', async () => {
  mockAuth.deleteAccount.mockResolvedValue({ ok: false, reason: 'invalid-credentials' });
  await renderProfile();
  await openDelete('errada123');
  await fireEvent.press(screen.getByTestId('profile.confirm'));
  await screen.findByText('Senha incorreta.');

  await fireEvent.changeText(screen.getByTestId('profile.password'), 'outra123');
  await fireEvent.press(screen.getByTestId('profile.confirm'));

  expect(mockAuth.deleteAccount).toHaveBeenCalledTimes(2);
  expect(mockAuth.deleteAccount).toHaveBeenLastCalledWith('u1', 'outra123');
});

test('closing the delete dialog clears the password and the error', async () => {
  mockAuth.deleteAccount.mockResolvedValue({ ok: false, reason: 'invalid-credentials' });
  await renderProfile();
  await openDelete('errada123');
  await fireEvent.press(screen.getByTestId('profile.confirm'));
  await screen.findByText('Senha incorreta.');

  await fireEvent.press(screen.getByTestId('profile.cancel'));
  await openDelete();

  expect(screen.getByTestId('profile.password').props.value).toBe('');
  expect(screen.queryByText('Senha incorreta.')).toBeNull();
});

test('while the account is being deleted, Cancelar, Esc and back do not close the dialog', async () => {
  mockAuth.deleteAccount.mockReturnValue(new Promise(() => {}));
  await renderProfile();
  await openDelete('certa123');
  await fireEvent.press(screen.getByTestId('profile.confirm'));

  await fireEvent.press(screen.getByTestId('profile.cancel'));
  await fireEvent(screen.getByText('Excluir conta?'), 'accessibilityEscape');
  await fireEvent(screen.getByText('Excluir conta?'), 'requestClose');

  expect(screen.getByText('Excluir conta?')).toBeTruthy();
  expect(screen.getByTestId('profile.confirm').props.accessibilityState).toMatchObject({
    busy: true,
  });
});

test('C62: focus enters the dialog and returns to the button that opened it', async () => {
  // Guarda se algum diálogo ainda estava na tela a cada evento: o VoiceOver ignora foco atrás de
  // um Modal aberto, então o foco só pode voltar depois que ele fecha.
  const dialogOpen: boolean[] = [];
  const send = jest
    .spyOn(AccessibilityInfo, 'sendAccessibilityEvent')
    .mockImplementation(
      () => void dialogOpen.push(screen.queryByTestId('profile.cancel') !== null),
    );
  // No jest a ref aponta para o View mockado, que guarda o testID nas props.
  const focused = () => {
    const [target, event] = send.mock.lastCall ?? [];
    return `${(target as { props?: { testID?: string } } | undefined)?.props?.testID} ${event}`;
  };
  await renderProfile();

  await fireEvent.press(screen.getByTestId('profile.logout'));
  // O mock do Modal não dispara onShow; o evento sobe do título até o Modal.
  await fireEvent(screen.getByText('Sair da conta?'), 'show');
  expect(focused()).toBe('profile.cancel focus');

  await fireEvent.press(screen.getByTestId('profile.cancel'));
  expect(focused()).toBe('profile.logout focus');
  expect(dialogOpen.at(-1)).toBe(false);

  // Esc (VoiceOver) e o voltar do Android também cancelam e devolvem o foco.
  send.mockClear();
  await fireEvent.press(screen.getByTestId('profile.logout'));
  await fireEvent(screen.getByText('Sair da conta?'), 'accessibilityEscape');
  expect(screen.queryByText('Sair da conta?')).toBeNull();
  expect(focused()).toBe('profile.logout focus');
  expect(dialogOpen.at(-1)).toBe(false);

  await openDelete();
  expect(screen.getByTestId('profile.password').props.autoFocus).toBe(true);
  await fireEvent(screen.getByText('Excluir conta?'), 'requestClose');
  expect(screen.queryByText('Excluir conta?')).toBeNull();
  expect(focused()).toBe('profile.delete focus');
  expect(dialogOpen.at(-1)).toBe(false);
  expect(mockAuth.signOut).not.toHaveBeenCalled();
});
