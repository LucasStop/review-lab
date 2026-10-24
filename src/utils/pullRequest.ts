import type { PullRequest, PullRequestSummary } from '../types/github';

export function toSummary(pr: PullRequest): PullRequestSummary {
  return {
    number: pr.number,
    title: pr.title,
    author: pr.user?.login ?? 'ghost',
    avatarUrl: pr.user?.avatar_url || undefined,
  };
}
