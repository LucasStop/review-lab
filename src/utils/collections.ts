import type { PullRequestSummary } from '../types/github';

export type StudiedEntry = PullRequestSummary & { rating: number };

const isSummary = (value: unknown): value is PullRequestSummary => {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.number === 'number' &&
    Number.isInteger(v.number) &&
    v.number > 0 &&
    typeof v.title === 'string' &&
    typeof v.author === 'string' &&
    (v.avatarUrl === undefined || typeof v.avatarUrl === 'string')
  );
};

export const isRating = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 5;

// Dado de outra versão ou corrompido não pode entrar no estado: o storage.read devolve o padrão.
const hasUniqueNumbers = (list: PullRequestSummary[]) =>
  new Set(list.map((item) => item.number)).size === list.length;

export const isFavoriteList = (value: unknown): value is PullRequestSummary[] =>
  Array.isArray(value) && value.every(isSummary) && hasUniqueNumbers(value);

export const isStudiedList = (value: unknown): value is StudiedEntry[] =>
  Array.isArray(value) &&
  value.every((entry) => isSummary(entry) && isRating((entry as StudiedEntry).rating)) &&
  hasUniqueNumbers(value);

// Guarda só o snapshot que o card precisa, nunca o objeto inteiro da API.
const snapshot = ({
  number,
  title,
  author,
  avatarUrl,
}: PullRequestSummary): PullRequestSummary => ({
  number,
  title,
  author,
  ...(avatarUrl ? { avatarUrl } : {}),
});

export function toggleFavorite(list: PullRequestSummary[], pr: PullRequestSummary) {
  return list.some((item) => item.number === pr.number)
    ? list.filter((item) => item.number !== pr.number)
    : [snapshot(pr), ...list];
}

// Nota fora de 1 a 5 (ou fracionada) é recusada: devolve null e o chamador não grava nada.
export function withStudied(list: StudiedEntry[], pr: PullRequestSummary, rating: number) {
  if (!isRating(rating)) return null;
  const entry = { ...snapshot(pr), rating };
  return list.some((item) => item.number === pr.number)
    ? list.map((item) => (item.number === pr.number ? entry : item))
    : [entry, ...list];
}

export const withoutStudied = (list: StudiedEntry[], number: number) =>
  list.filter((item) => item.number !== number);

// Busca dentro de Salvos e Estudados: a lista já está no aparelho, então filtra sem rede, por
// título, autor ou número, sem diferenciar maiúscula.
export function filterByTerm<T extends PullRequestSummary>(list: T[], term: string): T[] {
  const q = term.toLowerCase();
  if (!q) return list;
  return list.filter((pr) => `${pr.title} ${pr.author} #${pr.number}`.toLowerCase().includes(q));
}
