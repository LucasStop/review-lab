import { isTag, isText, type ChildNode } from 'domhandler';
import { parseDocument } from 'htmlparser2';

export type Inline = {
  text: string;
  bold?: true;
  italic?: true;
  code?: true;
  href?: string;
};

export type Block =
  | { type: 'paragraph'; content: Inline[] }
  | { type: 'heading'; level: 1 | 2 | 3 | 4 | 5 | 6; content: Inline[] }
  | { type: 'quote'; content: Inline[] }
  | { type: 'code'; text: string }
  | { type: 'list'; ordered: boolean; items: Inline[][] };

// Conteúdo descartado por inteiro. Imagens do corpo também saem (ADR 0001).
const DROP = new Set([
  'script',
  'style',
  'iframe',
  'object',
  'embed',
  'noscript',
  'template',
  'svg',
  'math',
  'textarea',
  'select',
  'img',
  'picture',
  'video',
  'audio',
  'canvas',
  'form',
  'head',
]);

// Contêineres sem significado próprio: só se desce para os filhos.
const CONTAINERS = new Set([
  'div',
  'section',
  'article',
  'aside',
  'main',
  'header',
  'footer',
  'nav',
  'details',
  'summary',
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'td',
  'th',
  'figure',
  'figcaption',
  'dl',
  'dt',
  'dd',
  'li',
  'hr',
]);

const SAFE_URL = /^https?:\/\//i;

// Corpo de PR é dado hostil: milhares de tags aninhadas estourariam a pilha da recursão e o
// Detalhe nunca abriria. Acima desta profundidade o nó é ignorado.
const MAX_DEPTH = 64;

function inlineOf(nodes: ChildNode[], marks: Omit<Inline, 'text'>, out: Inline[], depth = 0) {
  if (depth > MAX_DEPTH) return;
  for (const node of nodes) {
    if (isText(node)) {
      const text = node.data.replace(/\s+/g, ' ');
      if (text) out.push({ text, ...marks });
    } else if (isTag(node)) {
      const name = node.name.toLowerCase();
      if (DROP.has(name)) continue;
      if (name === 'br') {
        out.push({ text: '\n', ...marks });
      } else if (name === 'strong' || name === 'b') {
        inlineOf(node.children, { ...marks, bold: true }, out, depth + 1);
      } else if (name === 'em' || name === 'i') {
        inlineOf(node.children, { ...marks, italic: true }, out, depth + 1);
      } else if (name === 'code' || name === 'kbd' || name === 'samp') {
        inlineOf(node.children, { ...marks, code: true }, out, depth + 1);
      } else if (name === 'a') {
        const href = node.attribs.href?.trim();
        const next = href && SAFE_URL.test(href) ? { ...marks, href } : marks;
        inlineOf(node.children, next, out, depth + 1);
      } else {
        inlineOf(node.children, marks, out, depth + 1);
      }
    }
  }
}

function clean(inlines: Inline[]): Inline[] {
  const out = inlines.map((i) => ({ ...i }));
  while (out.length && !(out[0].text = out[0].text.trimStart())) out.shift();
  while (out.length && !(out[out.length - 1].text = out[out.length - 1].text.trimEnd())) out.pop();
  return out;
}

function inlines(nodes: ChildNode[]): Inline[] {
  const out: Inline[] = [];
  inlineOf(nodes, {}, out);
  return clean(out);
}

function rawText(nodes: ChildNode[], depth = 0): string {
  if (depth > MAX_DEPTH) return '';
  let out = '';
  for (const node of nodes) {
    if (isText(node)) out += node.data;
    else if (isTag(node) && !DROP.has(node.name.toLowerCase()))
      out += rawText(node.children, depth + 1);
  }
  return out;
}

function blocksOf(nodes: ChildNode[], out: Block[], depth = 0) {
  if (depth > MAX_DEPTH) return;
  let run: ChildNode[] = [];
  const flush = () => {
    const content = inlines(run);
    if (content.length) out.push({ type: 'paragraph', content });
    run = [];
  };

  for (const node of nodes) {
    const name = isTag(node) ? node.name.toLowerCase() : '';
    if (!isTag(node)) {
      if (isText(node)) run.push(node);
    } else if (DROP.has(name)) {
      continue;
    } else if (name === 'p') {
      flush();
      const content = inlines(node.children);
      if (content.length) out.push({ type: 'paragraph', content });
    } else if (/^h[1-6]$/.test(name)) {
      flush();
      const content = inlines(node.children);
      if (content.length) {
        out.push({ type: 'heading', level: Number(name[1]) as 1 | 2 | 3 | 4 | 5 | 6, content });
      }
    } else if (name === 'blockquote') {
      flush();
      const content = inlines(node.children);
      if (content.length) out.push({ type: 'quote', content });
    } else if (name === 'pre') {
      flush();
      const text = rawText(node.children).replace(/\n$/, '');
      if (text.trim()) out.push({ type: 'code', text });
    } else if (name === 'ul' || name === 'ol') {
      flush();
      const items = node.children
        .filter(isTag)
        .filter((li) => li.name.toLowerCase() === 'li')
        .map((li) => inlines(li.children))
        .filter((item) => item.length);
      if (items.length) out.push({ type: 'list', ordered: name === 'ol', items });
    } else if (CONTAINERS.has(name)) {
      flush();
      blocksOf(node.children, out, depth + 1);
    } else {
      run.push(node);
    }
  }
  flush();
}

export function sanitizeHtml(html: string | null | undefined): Block[] {
  if (!html) return [];
  const out: Block[] = [];
  blocksOf(parseDocument(html).children, out);
  return out;
}
