import assert from 'node:assert/strict';
import { test } from 'node:test';

import { colors, spacing, textPairs, touch, typography } from './index.ts';

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const channel = parseInt(hex.slice(i, i + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

test('the contrast formula matches the WCAG reference values', () => {
  assert.equal(contrast('#000000', '#ffffff'), 21);
  assert.equal(contrast('#ffffff', '#ffffff'), 1);
  // #767676 em branco é o limite clássico de 4.5:1 (4.54).
  assert.ok(Math.abs(contrast('#767676', '#ffffff') - 4.54) < 0.01);
});

test('every text pair has at least 4.5:1', () => {
  for (const [fg, bg] of textPairs) {
    const ratio = contrast(colors[fg], colors[bg]);
    assert.ok(ratio >= 4.5, `${fg} sobre ${bg}: ${ratio.toFixed(2)}`);
  }
});

test('the form label is the caption size, only bolder', () => {
  assert.equal(typography.label.fontSize, typography.caption.fontSize);
  assert.equal(typography.label.fontWeight, '600');
});

test('the control border has at least 3:1 against the background (WCAG 1.4.11)', () => {
  assert.ok(contrast(colors.border, colors.background) >= 3);
});

test('spacing is a scale of 4 and the touch target is 44', () => {
  for (const value of Object.values(spacing)) assert.equal(value % 4, 0);
  assert.equal(touch.min, 44);
});
