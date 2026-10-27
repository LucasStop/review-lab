import { expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';

import { ErrorState } from './ErrorState';

test('shows the message as an alert and retry calls onRetry', async () => {
  const onRetry = jest.fn();
  await render(<ErrorState message="Sem conexão." onRetry={onRetry} />);

  expect(screen.getByRole('alert')).toBeTruthy();
  expect(screen.getByText('Sem conexão.')).toBeTruthy();

  // Pelo label, não pelo texto: o RNTL cai no texto do filho e esconderia a perda do label.
  await fireEvent.press(screen.getByLabelText('Tentar novamente'));
  expect(onRetry).toHaveBeenCalledTimes(1);
});

test('C43: announces the message when it shows and when it changes', async () => {
  // O spyOn devolve o jest.fn do preset, com as chamadas dos testes anteriores.
  const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockClear();
  await render(<ErrorState message="Sem conexão." onRetry={jest.fn()} />);
  expect(announce).toHaveBeenLastCalledWith('Sem conexão.');

  await screen.rerender(<ErrorState message="Limite atingido." onRetry={jest.fn()} />);
  expect(announce).toHaveBeenLastCalledWith('Limite atingido.');
  expect(announce).toHaveBeenCalledTimes(2);
  announce.mockRestore();
});
