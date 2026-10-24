import { expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { ErrorState } from './ErrorState';

test('shows the message as an alert and retry calls onRetry', async () => {
  const onRetry = jest.fn();
  await render(<ErrorState message="Sem conexão." onRetry={onRetry} />);

  expect(screen.getByRole('alert')).toBeTruthy();
  expect(screen.getByText('Sem conexão.')).toBeTruthy();

  await fireEvent.press(screen.getByRole('button', { name: 'Tentar novamente' }));
  expect(onRetry).toHaveBeenCalledTimes(1);
});
