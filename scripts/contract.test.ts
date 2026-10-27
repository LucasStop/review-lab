// Contrato com a API real do GitHub (C49): os mocks dos testes podem divergir da API. Gasta 2
// requisições do limite `core` de 60/h e 1 do limite próprio de `search`, por isso roda à mão
// (`yarn test:contract`) e fica fora do CI.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { parseLinkHeader } from '../src/utils/linkHeader.ts';
import { buildSearchQuery, toDetail, toSummary } from '../src/utils/pullRequest.ts';

const repo = process.env.EXPO_PUBLIC_GITHUB_REPO || 'expo/expo';
const token = process.env.EXPO_PUBLIC_GITHUB_TOKEN;

async function get(path: string, accept = 'application/vnd.github+json') {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: { Accept: accept, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  // Só status e o restante do limite: a URL e o token não vão para a saída.
  assert.equal(
    response.status,
    200,
    `status ${response.status}, restante ${response.headers.get('x-ratelimit-remaining')}`,
  );
  return response;
}

let firstNumber: number | undefined;

test('list: closed PRs keep the fields toSummary reads and paginate by Link', async () => {
  const response = await get(`/repos/${repo}/pulls?state=closed&per_page=5&page=1`);
  const data = await response.json();
  assert.ok(Array.isArray(data) && data.length > 0);
  for (const pr of data) {
    assert.equal(typeof pr.number, 'number');
    assert.equal(typeof pr.title, 'string');
    assert.ok(pr.user === null || typeof pr.user.login === 'string');
    assert.ok('merged_at' in pr && typeof pr.html_url === 'string');
    toSummary(pr);
  }
  assert.ok(parseLinkHeader(response.headers.get('link') ?? undefined).next !== undefined);
  firstNumber = data[0].number;
});

test('detail: html+json returns body_html and the counts toDetail reads', async () => {
  assert.ok(firstNumber, 'o teste da lista falhou, sem número para o detalhe');
  const response = await get(
    `/repos/${repo}/pulls/${firstNumber}`,
    'application/vnd.github.html+json',
  );
  const pr = await response.json();
  assert.ok(pr.body_html === null || typeof pr.body_html === 'string');
  for (const key of ['comments', 'review_comments', 'changed_files', 'additions', 'deletions']) {
    assert.equal(typeof pr[key], 'number', key);
  }
  assert.ok(Array.isArray(toDetail(pr).blocks));
});

test('search: /search/issues returns PR items with the summary fields', async () => {
  const q = buildSearchQuery(repo, 'fix');
  assert.ok(q);
  const response = await get(`/search/issues?per_page=5&q=${encodeURIComponent(q)}`);
  const { items } = await response.json();
  assert.ok(Array.isArray(items) && items.length > 0);
  for (const item of items) {
    assert.ok(item.pull_request, 'type:pr devolve só PR');
    toSummary(item);
  }
});
