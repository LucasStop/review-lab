import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import type { InternalAxiosRequestConfig } from 'axios';

import { getPullRequest, listPullRequests, searchPullRequests, api } from './github';

// O sanitizador depende de pacotes ESM que o jest não transforma, e ele já tem teste próprio.
jest.mock('../utils/sanitizeHtml', () => ({ sanitizeHtml: () => [] }));

// O cache fica fora: cada chamada vai direto ao fetcher, com o etag que o teste escolhe.
let mockEtag: string | undefined;
jest.mock('./appCache', () => ({
  cache: {
    get: async (
      _key: string,
      _options: unknown,
      fetch: (etag?: string) => Promise<{ value: unknown } | 'not-modified'>,
    ) => {
      const result = await fetch(mockEtag);
      return result === 'not-modified' ? undefined : result.value;
    },
  },
}));

const seen: InternalAxiosRequestConfig[] = [];

beforeEach(() => {
  seen.length = 0;
  mockEtag = undefined;
  // Sem rede: o adapter devolve um corpo mínimo e guarda a configuração da chamada.
  api.defaults.adapter = async (config) => {
    seen.push(config);
    const data = config.url?.includes('/pulls/')
      ? {
          number: 9,
          title: 't',
          user: null,
          html_url: 'u',
          merged_at: null,
          body_html: null,
          comments: 0,
          review_comments: 0,
          changed_files: 0,
          additions: 0,
          deletions: 0,
        }
      : [];
    return { data, status: 200, statusText: 'OK', headers: {}, config };
  };
});

describe('listPullRequests', () => {
  test('asks for closed PRs of the page, with the page size', async () => {
    await listPullRequests(3);
    expect(seen).toHaveLength(1);
    expect(seen[0].url).toBe('/repos/expo/expo/pulls');
    expect(seen[0].params).toEqual({ state: 'closed', per_page: 20, page: 3 });
  });

  test('sends If-None-Match only when there is an etag', async () => {
    await listPullRequests(1);
    expect(seen[0].headers.get('If-None-Match')).toBeUndefined();
    mockEtag = 'W/"abc"';
    await listPullRequests(1);
    expect(seen[1].headers.get('If-None-Match')).toBe('W/"abc"');
  });
});

describe('getPullRequest', () => {
  test('asks for the html body of that number', async () => {
    await getPullRequest(9);
    expect(seen[0].url).toBe('/repos/expo/expo/pulls/9');
    expect(seen[0].headers.get('Accept')).toBe('application/vnd.github.html+json');
  });
});

describe('searchPullRequests', () => {
  test('an empty term makes no request', async () => {
    expect(await searchPullRequests('')).toEqual([]);
    expect(await searchPullRequests('   ')).toEqual([]);
    expect(seen).toHaveLength(0);
  });
});
