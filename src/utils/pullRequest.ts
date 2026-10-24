import type {
  PullRequest,
  PullRequestDetail,
  PullRequestDetailView,
  PullRequestSummary,
} from '../types/github';
import { sanitizeHtml } from './sanitizeHtml.ts';

export function toSummary(pr: PullRequest): PullRequestSummary {
  return {
    number: pr.number,
    title: pr.title,
    author: pr.user?.login ?? 'ghost',
    avatarUrl: pr.user?.avatar_url || undefined,
  };
}

export function toDetail(pr: PullRequestDetail): PullRequestDetailView {
  return {
    ...toSummary(pr),
    htmlUrl: pr.html_url,
    merged: pr.merged_at !== null,
    comments: pr.comments,
    reviewComments: pr.review_comments,
    changedFiles: pr.changed_files,
    additions: pr.additions,
    deletions: pr.deletions,
    blocks: sanitizeHtml(pr.body_html),
  };
}

// A busca do GitHub aceita qualificadores (repo:, is:, user:). Sem ':' o termo do usuário não
// consegue sair do repositório configurado.
export function buildSearchQuery(repo: string, term: string): string | undefined {
  const clean = term.replace(/:/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 100);
  return clean ? `type:pr repo:${repo} ${clean}` : undefined;
}
