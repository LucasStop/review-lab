import assert from 'node:assert/strict';
import { test } from 'node:test';

import { AppError, toAppError } from './appError.ts';

const withResponse = (status: number, headers: Record<string, string> = {}) => ({
  isAxiosError: true,
  message: 'Request failed https://api.github.com/x?access_token=SEGREDO',
  config: { headers: { Authorization: 'Bearer SEGREDO' }, url: 'https://api.github.com/x' },
  response: { status, headers },
});

test('no response means network error', () => {
  const err = toAppError({ isAxiosError: true, code: 'ERR_NETWORK', request: {} });
  assert.equal(err.kind, 'network');
});

test('timeout code means timeout', () => {
  assert.equal(
    toAppError({ isAxiosError: true, code: 'ECONNABORTED', request: {} }).kind,
    'timeout',
  );
  assert.equal(toAppError({ isAxiosError: true, code: 'ETIMEDOUT', request: {} }).kind, 'timeout');
});

test('403 with remaining 0 is rate limit and reports the reset time', () => {
  const reset = Math.floor(new Date(2026, 9, 24, 14, 5).getTime() / 1000);
  const err = toAppError(
    withResponse(403, { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': String(reset) }),
  );
  assert.equal(err.kind, 'rate-limit');
  assert.ok(err.message.includes('14:05'), err.message);
  assert.equal(err.resetAt?.getTime(), reset * 1000);
});

test('429 is rate limit even without headers', () => {
  const err = toAppError(withResponse(429));
  assert.equal(err.kind, 'rate-limit');
  assert.equal(err.resetAt, undefined);
});

test('403 with quota left is not rate limit', () => {
  assert.equal(toAppError(withResponse(403, { 'x-ratelimit-remaining': '12' })).kind, 'forbidden');
});

test('404 and 5xx', () => {
  assert.equal(toAppError(withResponse(404)).kind, 'not-found');
  assert.equal(toAppError(withResponse(500)).kind, 'server');
  assert.equal(toAppError(withResponse(503)).kind, 'server');
});

test('message never carries the token or the url', () => {
  for (const status of [401, 403, 404, 429, 500]) {
    const err = toAppError(withResponse(status, { 'x-ratelimit-remaining': '0' }));
    assert.ok(!err.message.includes('SEGREDO'));
    assert.ok(!err.message.includes('api.github.com'));
    assert.ok(!JSON.stringify(err).includes('SEGREDO'));
  }
});

test('an AppError passes through and unknown values do not throw', () => {
  const own = new AppError('server', 'x');
  assert.equal(toAppError(own), own);
  assert.equal(toAppError('boom').kind, 'unknown');
  assert.equal(toAppError(null).kind, 'unknown');
});

for (const status of [403, 429]) {
  test(`${status} with retry-after is a rate limit that returns after that many seconds`, () => {
    const before = Date.now();
    const err = toAppError(
      withResponse(status, { 'retry-after': '60', 'x-ratelimit-remaining': '5' }),
    );
    assert.equal(err.kind, 'rate-limit');
    const wait = (err.resetAt!.getTime() - before) / 1000;
    assert.ok(wait >= 59 && wait <= 61, String(wait));
  });
}

test('403 without remaining 0 and without retry-after stays forbidden', () => {
  assert.equal(toAppError(withResponse(403)).kind, 'forbidden');
});
