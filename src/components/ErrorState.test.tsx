import { expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';

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
