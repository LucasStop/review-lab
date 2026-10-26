import { expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { touch } from '../theme';
import { StarRating } from './StarRating';

test('C28: the editable rating is one 44x44 button per star and marks only the current one', async () => {
  const onChange = jest.fn();
  await render(<StarRating value={3} onChange={onChange} />);

  const stars = screen.getAllByRole('button');
  expect(stars).toHaveLength(5);
  stars.forEach((star) => {
    const style = StyleSheet.flatten(star.props.style);
    expect(style.minWidth).toBe(touch.min);
    expect(style.minHeight).toBe(touch.min);
  });
  expect(screen.getByLabelText('Dar nota 3 de 5').props.accessibilityState).toMatchObject({
    selected: true,
  });
  expect(screen.getByLabelText('Dar nota 4 de 5').props.accessibilityState).toMatchObject({
    selected: false,
  });

  await fireEvent.press(screen.getByLabelText('Dar nota 5 de 5'));
  expect(onChange).toHaveBeenCalledWith(5);
});

test('the read-only rating is a single element with the value in its label', async () => {
  await render(<StarRating value={4} />);

  expect(screen.getByLabelText('Nota 4 de 5')).toBeTruthy();
  expect(screen.queryAllByRole('button')).toHaveLength(0);
});
