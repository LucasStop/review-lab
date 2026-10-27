import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

const src = join(import.meta.dirname, '..');

function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sources(path);
    return /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

test('C47: no source file turns off allowFontScaling', () => {
  const files = sources(src);
  assert.ok(files.length > 0);
  const offenders = files.filter((file) =>
    /allowFontScaling\s*(=\s*\{\s*false\s*\}|:\s*false)/.test(readFileSync(file, 'utf8')),
  );
  assert.deepEqual(offenders, []);
});
