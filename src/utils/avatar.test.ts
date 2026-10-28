import assert from 'node:assert/strict';
import { test } from 'node:test';

import { AVATAR_COLORS, avatarColor, initialOf } from './avatar.ts';

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const channel = parseInt(hex.slice(i, i + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

test('C10: every avatar color has at least 4.5:1 against the white initial', () => {
  for (const color of AVATAR_COLORS) {
    const ratio = 1.05 / (luminance(color) + 0.05);
    assert.ok(ratio >= 4.5, `${color}: ${ratio.toFixed(2)}`);
  }
});

test('the same name always gets the same color', () => {
  assert.equal(avatarColor('octocat'), avatarColor('octocat'));
  assert.ok(AVATAR_COLORS.includes(avatarColor('ghost') as (typeof AVATAR_COLORS)[number]));
});

test('initialOf uppercases the first letter and survives an empty name', () => {
  assert.equal(initialOf('octocat'), 'O');
  assert.equal(initialOf('  zed'), 'Z');
  assert.equal(initialOf(''), '?');
});

test('a known name keeps its color, and a long name still gets one from the palette', () => {
  assert.equal(avatarColor('ana'), '#be123c');
  assert.equal(avatarColor('octocat'), '#a21caf');
  const long = avatarColor('a'.repeat(200));
  assert.equal(long, '#1d4ed8');
  assert.ok((AVATAR_COLORS as readonly string[]).includes(long));
});
