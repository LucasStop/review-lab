import { create } from 'axios';

import { config } from '../config';
import type { PullRequest, PullRequestPage } from '../types/github';
import { toAppError } from '../utils/appError';
import { parseLinkHeader } from '../utils/linkHeader';
import { toSummary } from '../utils/pullRequest';

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

export async function listPullRequests(page: number): Promise<PullRequestPage> {
  const response = await api.get<PullRequest[]>(`/repos/${config.repo}/pulls`, {
    params: { state: 'closed', per_page: PAGE_SIZE, page },
  });
  return {
    items: response.data.map(toSummary),
    hasNext: parseLinkHeader(response.headers.link).next !== undefined,
  };
}
