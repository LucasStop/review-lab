import { expect, test } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';

import { Avatar } from './Avatar';

test.each([
  ['image', 'https://example.com/ana.png'],
  ['placeholder', undefined],
])('C43: the %s avatar is an image named after the person', async (_, uri) => {
  await render(<Avatar uri={uri} name="ana" size={32} />);

  expect(screen.getByRole('image', { name: 'Avatar de ana' })).toBeTruthy();
});

test('an avatar next to the name stays out of the accessibility tree', async () => {
  await render(<Avatar name="ana" size={32} accessible={false} />);

  expect(screen.queryByRole('image')).toBeNull();
  expect(screen.queryByLabelText('Avatar de ana')).toBeNull();
});
