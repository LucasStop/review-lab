import { create } from 'axios';

import { config } from '../config';
import type {
  PullRequest,
  PullRequestDetail,
  PullRequestDetailView,
  PullRequestPage,
  PullRequestSummary,
} from '../types/github';
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

export async function listPullRequests(
  page: number,
  signal?: AbortSignal,
): Promise<PullRequestPage> {
  const response = await api.get<PullRequest[]>(`/repos/${config.repo}/pulls`, {
    params: { state: 'closed', per_page: PAGE_SIZE, page },
    signal,
  });
  return {
    items: response.data.map(toSummary),
    hasNext: parseLinkHeader(response.headers.link).next !== undefined,
  };
}

export async function getPullRequest(
  number: number,
  signal?: AbortSignal,
): Promise<PullRequestDetailView> {
  const response = await api.get<PullRequestDetail>(`/repos/${config.repo}/pulls/${number}`, {
    headers: { Accept: 'application/vnd.github.html+json' },
    signal,
  });
  return toDetail(response.data);
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
