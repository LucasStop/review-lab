export type GitHubUser = {
  login: string;
  avatar_url: string;
};

export type PullRequest = {
  number: number;
  title: string;
  state: 'open' | 'closed';
  user: GitHubUser | null;
  created_at: string;
  merged_at: string | null;
  html_url: string;
};

export type PullRequestDetail = PullRequest & {
  // Vem de Accept: application/vnd.github.html+json. É dado não confiável: sanitizar antes de exibir.
  body_html: string | null;
  comments: number;
  review_comments: number;
  changed_files: number;
  additions: number;
  deletions: number;
};
