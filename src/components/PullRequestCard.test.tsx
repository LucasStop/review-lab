import { expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { touch } from '../theme';
import type { PullRequestSummary } from '../types/github';
import { Avatar } from './Avatar';
import { PullRequestCard } from './PullRequestCard';

const pr: PullRequestSummary = {
  number: 42,
  title: 'Fix race in scheduler',
  author: 'octocat',
  avatarUrl: 'https://avatars.example/octocat.png',
};

function card(overrides: Partial<React.ComponentProps<typeof PullRequestCard>> = {}) {
  return (
    <PullRequestCard
      pr={pr}
      saved={false}
      onPress={() => {}}
      onToggleSave={() => {}}
      testID="catalog.card.0"
      {...overrides}
    />
  );
}

test('C09: the card shows avatar, title, number and author, and the whole card is one button', async () => {
  await render(card());
  expect(screen.getByText('Fix race in scheduler')).toBeTruthy();
  expect(screen.getByText('#42 · octocat')).toBeTruthy();
  expect(screen.getByTestId('avatar.image')).toBeTruthy();
  expect(screen.getByLabelText('PR #42: Fix race in scheduler, de octocat')).toBeTruthy();
});

test('tapping the card calls onPress and tapping the star calls onToggleSave only', async () => {
  const onPress = jest.fn();
  const onToggleSave = jest.fn();
  await render(card({ onPress, onToggleSave }));

  await fireEvent.press(screen.getByLabelText('Salvar para estudar'));
  expect(onToggleSave).toHaveBeenCalledTimes(1);
  expect(onPress).not.toHaveBeenCalled();

  await fireEvent.press(screen.getByTestId('catalog.card.0'));
  expect(onPress).toHaveBeenCalledTimes(1);
});

test('the save button label and selected state follow the saved prop', async () => {
  await render(card({ saved: true }));
  const save = screen.getByLabelText('Remover dos salvos');
  expect(save.props.accessibilityState).toEqual({ selected: true });
  expect(screen.getByTestId('catalog.save.0')).toBeTruthy();
});

test('C45: the save button is at least 44x44', async () => {
  await render(card());
  const style = StyleSheet.flatten(screen.getByLabelText('Salvar para estudar').props.style);
  expect(style.minWidth).toBeGreaterThanOrEqual(touch.min);
  expect(style.minHeight).toBeGreaterThanOrEqual(touch.min);
});

test('a long title stays inside the card (shrinks instead of overflowing)', async () => {
  const long = 'x'.repeat(300);
  await render(card({ pr: { ...pr, title: long } }));
  const style = StyleSheet.flatten(screen.getByText(long).props.style);
  expect(style.flexShrink).toBe(1);
  expect(style.height).toBeUndefined();
  expect(style.lineHeight).toBeUndefined();
});

test('the rating shows only when given', async () => {
  await render(card({ rating: 4 }));
  expect(screen.getByText('Nota 4 de 5')).toBeTruthy();
});

test('C10: no avatar url shows the initial placeholder', async () => {
  await render(card({ pr: { ...pr, avatarUrl: undefined, author: 'ghost' } }));
  expect(screen.queryByTestId('avatar.image')).toBeNull();
  expect(screen.getByTestId('avatar.placeholder')).toBeTruthy();
  expect(screen.getByText('G')).toBeTruthy();
});

test('C10: an image that fails to load falls back to the placeholder', async () => {
  await render(<Avatar uri="https://broken.example/x.png" name="octocat" size={40} />);
  await fireEvent(screen.getByTestId('avatar.image'), 'error');
  expect(screen.queryByTestId('avatar.image')).toBeNull();
  expect(screen.getByTestId('avatar.placeholder')).toBeTruthy();
});

test('an avatar next to the name is hidden from the screen reader', async () => {
  await render(<Avatar name="octocat" size={40} accessible={false} />);
  expect(screen.queryByLabelText('Avatar de octocat')).toBeNull();
});

test('a standalone avatar is labelled', async () => {
  await render(<Avatar name="octocat" size={40} />);
  expect(screen.getByLabelText('Avatar de octocat')).toBeTruthy();
});
