import { expect, test } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';

import { TextField } from './TextField';

test('C43: the screen reader reads the label once, on the input', async () => {
  await render(<TextField label="E-mail" value="" onChangeText={() => {}} testID="field" />);

  expect(screen.queryAllByText('E-mail', { includeHiddenElements: false })).toHaveLength(0);
  expect(screen.getByLabelText('E-mail')).toBe(screen.getByTestId('field'));
  // O texto continua visível na tela.
  expect(screen.getByText('E-mail', { includeHiddenElements: true })).toBeTruthy();
});
