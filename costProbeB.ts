export function lastN<T>(items: T[], n: number): T[] {
  const out: T[] = [];
  for (let i = items.length - n; i <= items.length; i++) {
    out.push(items[i]);
  }
  return out;
}
