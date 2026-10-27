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
  stars.forEach((star, index) => {
    const style = StyleSheet.flatten(star.props.style);
    expect(style.minWidth).toBe(touch.min);
    expect(style.minHeight).toBe(touch.min);
    expect(star.props.accessibilityState).toMatchObject({ selected: index + 1 === 3 });
  });
  expect(screen.getAllByText('★')).toHaveLength(3);
  expect(screen.getAllByText('☆')).toHaveLength(2);

  await fireEvent.press(screen.getByLabelText('Dar nota 5 de 5'));
  expect(onChange).toHaveBeenCalledWith(5);
});

test('C47: the stars wrap to a new line when the system font is at its largest', async () => {
  const { root } = await render(<StarRating value={3} onChange={jest.fn()} />);

  expect(StyleSheet.flatten(root?.props.style).flexWrap).toBe('wrap');
});

test('the read-only rating is a single element with the value in its label', async () => {
  await render(<StarRating value={4} />);

  expect(screen.getByRole('image', { name: 'Nota 4 de 5' })).toBeTruthy();
  expect(screen.queryAllByRole('button')).toHaveLength(0);
});
