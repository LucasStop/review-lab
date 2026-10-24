import { create } from 'axios';

import { config } from '../config';
import type {
  PullRequest,
  PullRequestDetail,
  PullRequestDetailView,
  PullRequestPage,
  PullRequestSummary,
} from '../types/github';
import { cache } from './appCache';
import { toAppError } from '../utils/appError';
import { parseLinkHeader } from '../utils/linkHeader';
import { buildSearchQuery, toDetail, toSummary } from '../utils/pullRequest';

export const PAGE_SIZE = 20;

export const api = create({
  baseURL: 'https://api.github.com',
  timeout: 15000,
  headers: {
    Accept: 'application/vnd.github+json',
    ...(config.token ? { Authorization: `Bearer ${config.token}` } : {}),
  },
});

api.interceptors.response.use(undefined, (error) => Promise.reject(toAppError(error)));

const MIN = 60_000;
const LIST_TTL = 10 * MIN;
const DETAIL_TTL = 60 * MIN;

// 304 chega como resposta normal para o cache renovar a cópia sem gastar o limite.
const conditional = (etag?: string, headers: Record<string, string> = {}) => ({
  headers: etag ? { ...headers, 'If-None-Match': etag } : headers,
  validateStatus: (status: number) => (status >= 200 && status < 300) || status === 304,
});

// `refresh` ignora o TTL (pull-to-refresh).
export function listPullRequests(
  page: number,
  signal?: AbortSignal,
  refresh = false,
): Promise<PullRequestPage> {
  return cache.get(
    `list:${config.repo}:${page}`,
    { ttlMs: LIST_TTL, force: refresh },
    async (etag) => {
      const response = await api.get<PullRequest[]>(`/repos/${config.repo}/pulls`, {
        params: { state: 'closed', per_page: PAGE_SIZE, page },
        signal,
        ...conditional(etag),
      });
      if (response.status === 304) return 'not-modified';
      return {
        value: {
          items: response.data.map(toSummary),
          hasNext: parseLinkHeader(response.headers.link).next !== undefined,
        },
        etag: response.headers.etag as string | undefined,
      };
    },
  );
}

export function getPullRequest(
  number: number,
  signal?: AbortSignal,
  refresh = false,
): Promise<PullRequestDetailView> {
  return cache.get(
    `detail:${config.repo}:${number}`,
    { ttlMs: DETAIL_TTL, force: refresh },
    async (etag) => {
      const response = await api.get<PullRequestDetail>(`/repos/${config.repo}/pulls/${number}`, {
        signal,
        ...conditional(etag, { Accept: 'application/vnd.github.html+json' }),
      });
      if (response.status === 304) return 'not-modified';
      return { value: toDetail(response.data), etag: response.headers.etag as string | undefined };
    },
  );
}

export async function searchPullRequests(
  term: string,
  signal?: AbortSignal,
): Promise<PullRequestSummary[]> {
  const q = buildSearchQuery(config.repo, term);
  if (!q) return [];
  const response = await api.get<{ items: PullRequest[] }>('/search/issues', {
    params: { q, per_page: PAGE_SIZE },
    signal,
  });
  return response.data.items.map(toSummary);
}
