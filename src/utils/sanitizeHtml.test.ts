import assert from 'node:assert/strict';
import { test } from 'node:test';

import { sanitizeHtml } from './sanitizeHtml.ts';

const allText = (html: string) => JSON.stringify(sanitizeHtml(html));

test('paragraph with inline marks becomes typed blocks', () => {
  const blocks = sanitizeHtml('<p>Oi <strong>mundo</strong> e <em>você</em> <code>x</code></p>');
  assert.deepEqual(blocks, [
    {
      type: 'paragraph',
      content: [
        { text: 'Oi ' },
        { text: 'mundo', bold: true },
        { text: ' e ' },
        { text: 'você', italic: true },
        { text: ' ' },
        { text: 'x', code: true },
      ],
    },
  ]);
});

test('script content is removed entirely', () => {
  const out = allText('<p>a</p><script>alert(1)</script><p>b</p>');
  assert.ok(!out.includes('alert'));
  assert.ok(!out.includes('script'));
});

test('style and iframe content is removed entirely', () => {
  const out = allText(
    '<style>body{x:y}</style><iframe src="https://evil.test">frame text</iframe><p>ok</p>',
  );
  assert.ok(!out.includes('body{'));
  assert.ok(!out.includes('frame text'));
  assert.ok(!out.includes('evil.test'));
});

test('onerror and on* attributes never reach the output', () => {
  const out = allText(
    '<p onclick="steal()">x</p><img src=x onerror="steal()"><a href="https://a.test" onmouseover="steal()">l</a>',
  );
  assert.ok(!out.includes('steal'));
  assert.ok(!out.includes('onerror'));
  assert.ok(!out.includes('onclick'));
});

test('images from the body are dropped', () => {
  assert.deepEqual(sanitizeHtml('<p><img src="https://a.test/x.png" alt="x"></p>'), []);
});

test('javascript: and data: links keep the text but lose the href', () => {
  for (const href of [
    'javascript:alert(1)',
    ' JaVaScRiPt:alert(1)',
    'data:text/html,<b>x',
    'vbscript:x',
    '//evil.test',
  ]) {
    const blocks = sanitizeHtml(`<p><a href="${href}">click</a></p>`);
    assert.deepEqual(blocks, [{ type: 'paragraph', content: [{ text: 'click' }] }], href);
  }
});

test('http and https links keep the href', () => {
  const blocks = sanitizeHtml('<p><a href="https://github.com/a/b">repo</a></p>');
  assert.deepEqual(blocks, [
    { type: 'paragraph', content: [{ text: 'repo', href: 'https://github.com/a/b' }] },
  ]);
});

test('unknown tags are unwrapped, their text survives', () => {
  assert.deepEqual(sanitizeHtml('<p><blink>hi</blink></p>'), [
    { type: 'paragraph', content: [{ text: 'hi' }] },
  ]);
});

test('malformed html does not throw and has no tags in the output', () => {
  const out = allText('<p>aberto <strong>sem fechar <div><<script>x</p></ul>');
  assert.ok(!/<\/?[a-z]/i.test(out));
});

test('headings, lists, quotes and code blocks', () => {
  const blocks = sanitizeHtml(
    '<h2>T</h2><ul><li>a</li><li>b</li></ul><ol><li>1</li></ol><blockquote>q</blockquote><pre><code>let x\n  = 1</code></pre>',
  );
  assert.deepEqual(blocks, [
    { type: 'heading', level: 2, content: [{ text: 'T' }] },
    { type: 'list', ordered: false, items: [[{ text: 'a' }], [{ text: 'b' }]] },
    { type: 'list', ordered: true, items: [[{ text: '1' }]] },
    { type: 'quote', content: [{ text: 'q' }] },
    { type: 'code', text: 'let x\n  = 1' },
  ]);
});

test('entities are decoded to text, never to markup', () => {
  const out = sanitizeHtml('<p>&lt;script&gt;alert(1)&lt;/script&gt; &amp; ok</p>');
  assert.deepEqual(out, [
    { type: 'paragraph', content: [{ text: '<script>alert(1)</script> & ok' }] },
  ]);
});

test('empty, null-ish and whitespace input gives no blocks', () => {
  assert.deepEqual(sanitizeHtml(''), []);
  assert.deepEqual(sanitizeHtml('   \n '), []);
});

test('deeply nested hostile html does not blow the stack', () => {
  const deep = 5000;
  assert.ok(Array.isArray(sanitizeHtml('<b>'.repeat(deep) + 'x')));
  assert.ok(Array.isArray(sanitizeHtml('<div>'.repeat(deep) + 'x')));
  assert.ok(Array.isArray(sanitizeHtml('<pre>' + '<span>'.repeat(deep) + 'x</pre>')));
});

test('shallow content is unchanged by the depth limit', () => {
  assert.deepEqual(sanitizeHtml('<div><div><p><b><i>x</i></b></p></div></div>'), [
    { type: 'paragraph', content: [{ text: 'x', bold: true, italic: true }] },
  ]);
});
