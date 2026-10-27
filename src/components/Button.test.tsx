import { expect, test } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { touch } from '../theme';
import { Button } from './Button';

test.each(['primary', 'secondary', 'danger'] as const)(
  'C45: the %s button is at least 44x44',
  async (variant) => {
    await render(<Button label="Salvar" variant={variant} onPress={() => {}} testID="b" />);

    const style = StyleSheet.flatten(screen.getByTestId('b').props.style);
    expect(style.minWidth).toBeGreaterThanOrEqual(touch.min);
    expect(style.minHeight).toBeGreaterThanOrEqual(touch.min);
  },
);
