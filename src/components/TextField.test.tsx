import { expect, test } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { touch } from '../theme';
import { TextField } from './TextField';

test('C43: the screen reader reads the label once, on the input', async () => {
  await render(<TextField label="E-mail" value="" onChangeText={() => {}} testID="field" />);

  expect(screen.queryAllByText('E-mail', { includeHiddenElements: false })).toHaveLength(0);
  expect(screen.getByLabelText('E-mail')).toBe(screen.getByTestId('field'));
  // O texto continua visível na tela.
  const text = screen.getByText('E-mail', { includeHiddenElements: true });
  // `accessibilityElementsHidden` esconde no iOS e `importantForAccessibility` no Android.
  expect(text.props.accessibilityElementsHidden).toBe(true);
  expect(text.props.importantForAccessibility).toBe('no');
});

test('C45: the field is at least 44 high and has no fixed height', async () => {
  await render(<TextField label="E-mail" value="" onChangeText={() => {}} testID="f" />);

  const style = StyleSheet.flatten(screen.getByTestId('f').props.style);
  expect(style.minHeight).toBeGreaterThanOrEqual(touch.min);
  expect(style.height).toBeUndefined();
});
