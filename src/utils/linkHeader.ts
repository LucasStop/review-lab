export type Pagination = { next?: number; last?: number };

// A lista de PRs não traz total; o header Link diz se existe próxima página.
export function parseLinkHeader(header: string | undefined): Pagination {
  const out: Pagination = {};
  for (const part of (header ?? '').split(',')) {
    const match = part.match(/<([^>]*)>\s*;\s*rel="(next|last)"/);
    if (!match) continue;
    const page = Number(new URL(match[1], 'https://api.github.com').searchParams.get('page'));
    if (Number.isInteger(page) && page > 0) out[match[2] as 'next' | 'last'] = page;
  }
  return out;
}
