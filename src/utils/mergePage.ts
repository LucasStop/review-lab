import type { PullRequestSummary } from '../types/github';

// O GitHub ordena por data e entra PR novo entre uma página e outra: a página 2 pode repetir o
// último da 1. A chave do FlatList é o número do PR, então repetido quebraria a lista.
export function mergePage(current: PullRequestSummary[], incoming: PullRequestSummary[]) {
  const seen = new Set(current.map((pr) => pr.number));
  const added = incoming.filter((pr) => !seen.has(pr.number) && seen.add(pr.number));
  return [...current, ...added];
}
