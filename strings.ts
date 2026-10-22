export function capitalize(text: string): string {
  if (text.length === 0) return text;
  return text[0].toUpperCase() + text.slice(1);
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 3) + '...';
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function countWords(text: string): number {
  return text.split(' ').length;
}

export function isPalindrome(text: string): boolean {
  const clean = text.toLowerCase().replace(/[^a-z0-9]/g, '');
  return clean === clean.split('').reverse().join('');
}

export function repeat(text: string, times: number): string {
  let out = '';
  for (let i = 0; i < times; i++) out += text;
  return out;
}

export function padCenter(text: string, width: number): string {
  const total = Math.max(0, width - text.length);
  const left = Math.floor(total / 2);
  return ' '.repeat(left) + text + ' '.repeat(left);
}
