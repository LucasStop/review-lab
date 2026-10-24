# Mapa do projeto

Retrato de 24/10/2026, fim da Fase 1 (organização). A Fase 2 (telas) começa em 26/10. Atualizar este arquivo quando um RF mudar de estado.

## Estado por RF

Legenda: **base** quer dizer que a lógica existe e está testada, mas falta a tela.

| RF | Peso | Já existe | Falta | Dono |
|---|---|---|---|---|
| RF01 Catálogo | 15% | `listPullRequests` com paginação por `Link` e cache ([services/github.ts](../src/services/github.ts), PR #103); `toSummary` com autor `ghost` e avatar ausente ([utils/pullRequest.ts](../src/utils/pullRequest.ts)) | #34 card e avatar, #35 grade com rolagem infinita e pull-to-refresh | Luc-Bruno |
| RF02 Navegação | 10% com RF03 | `AuthStack` e `AppStack`, `Detail: { number }` ([navigation/](../src/navigation/), PR #112) | montar em `App.tsx` (#32), `setOptions` no detalhe (#36) | LucasStop, Luc-Bruno |
| RF03 Detalhe | 10% com RF02 | `getPullRequest` com ETag (PR #105); `sanitizeHtml` em blocos tipados ([utils/sanitizeHtml.ts](../src/utils/sanitizeHtml.ts), PR #101) | #36 tela e render dos blocos | Luc-Bruno |
| RF04 Favoritos (Context) | 15% com RF05 | storage por usuário ([services/storage.ts](../src/services/storage.ts), PR #108) | #24 `FavoritesContext`, #26 botão e ícone no card | Luc-Bruno |
| RF05 Tela de favoritos | 15% com RF04 | `EmptyState` (PR #99) | #38 | Luc-Bruno |
| RF06 Persistência | 10% | `createStorage` com hidratação segura (PR #108) e chave `rl.<userId>.<nome>` | #24, #25 e #45 (sem dado zerado na carga) | Luc-Bruno |
| RF07 Login, sessão, estudados | 10% | credenciais com hash e sal em SecureStore (PR #102); `createAuth` e `AuthContext` (PR #110); `StarRating` (PR #98) | #31 telas de login e cadastro, #32 navegação condicional e logout, #25 e #27 estudados com nota, #39 tela | LucasStop, Luc-Bruno |
| RF08 Busca | 10% | `searchPullRequests` e `buildSearchQuery` (PR #106) | #37 | Luc-Bruno |
| RF09 Feedback | 10% | `useFetch` (PR #107), `AppError` com mensagens pt-BR e horário de volta do limite (PR #104), `ErrorState` (PR #99) | #41, que confere o `ActivityIndicator` em todo fluxo | Luc-Bruno |
| RF10 Acessibilidade | 10% | `StarRating` e `ErrorState` com label, role e toque 44x44 | tokens (#114), #42, #43 e #44 | Luc-Bruno |

Hoje o `App.tsx` ainda é o template do Expo. As stacks entram nele no #32.

## Módulos

Padrão do projeto: a lógica fica numa fábrica `create*` pura, que recebe as dependências e é testada com `node:test`. Um binding fino (`app*` ou `secure*`) liga a fábrica ao módulo nativo, e esse binding não é testado.

| Arquivo | O que faz | Teste |
|---|---|---|
| [src/config.ts](../src/config.ts) | lê `EXPO_PUBLIC_GITHUB_REPO` (padrão `expo/expo`) e `EXPO_PUBLIC_GITHUB_TOKEN` | — |
| [src/types/github.ts](../src/types/github.ts) | tipos crus da API e as views `PullRequestSummary`, `PullRequestPage` e `PullRequestDetailView` | — |
| [src/services/github.ts](../src/services/github.ts) | cliente axios (15 s, Bearer só com token) com lista, detalhe e busca | pelas funções puras |
| [src/services/cache.ts](../src/services/cache.ts) | TTL, ETag, volta ao valor vencido quando a rede falha, limite de 50 entradas | 8 |
| [src/services/appCache.ts](../src/services/appCache.ts) | instância do cache sobre o AsyncStorage | binding |
| [src/services/storage.ts](../src/services/storage.ts) | `read`, `write` e `remove` em JSON com fallback; `userKey` | 6 |
| [src/services/appStorage.ts](../src/services/appStorage.ts) | AsyncStorage | binding |
| [src/services/credentials.ts](../src/services/credentials.ts) | cadastro e login com SHA-256 com sal (2000 iterações) e comparação em tempo constante | 9 |
| [src/services/secureCredentials.ts](../src/services/secureCredentials.ts) | expo-crypto e expo-secure-store | binding |
| [src/services/session.ts](../src/services/session.ts) | `restore`, `signIn`, `signUp` e `signOut` | 5 |
| [src/services/appAuth.ts](../src/services/appAuth.ts) | sessão em SecureStore | binding |
| [src/utils/sanitizeHtml.ts](../src/utils/sanitizeHtml.ts) | converte `body_html` em blocos tipados e descarta script, style, iframe e img | 12 |
| [src/utils/appError.ts](../src/utils/appError.ts) | erro normalizado em 7 tipos, com mensagem fixa sem token nem URL | 8 |
| [src/utils/linkHeader.ts](../src/utils/linkHeader.ts) | parse do header `Link` | 4 |
| [src/utils/pullRequest.ts](../src/utils/pullRequest.ts) | `toSummary`, `toDetail` e `buildSearchQuery` | 7 |
| [src/hooks/useFetch.ts](../src/hooks/useFetch.ts) | `{status, data, error, retry}` com cancelamento por `AbortController` | Fase 2 (C38) |
| [src/contexts/AuthContext.tsx](../src/contexts/AuthContext.tsx) | `AuthProvider` e `useAuth` com hidratação | Fase 2 (C06, C07) |
| [src/components/](../src/components/) | `StarRating`, `ErrorState` e `EmptyState` | `ErrorState` em #115, o resto na Fase 2 |
| [src/navigation/](../src/navigation/) | tipos de rota, `AuthStack`, `AppStack` e `Placeholder` | E2E na Fase 2 |

Total na main: 59 testes unitários (`yarn test`), rodando no CI.

## Issues por categoria e pessoa

| Categoria | Dono | Fechadas | Abertas |
|---|---|---|---|
| `cat:fundacao` | LucasStop | #5-#14, #68, #7, #94 | #113, #115 |
| `cat:dados` | LucasStop | #15-#22 | — |
| `cat:auth` | LucasStop | #29, #30 | #31, #32 |
| `cat:entrega` | LucasStop | — | #46-#56, #111 (com Luc-Bruno) |
| `cat:navegacao-telas` | Luc-Bruno | #33 | #34-#39 |
| `cat:estado` | Luc-Bruno | #23, #28 | #24-#27 |
| `cat:ux-acessibilidade` | Luc-Bruno | #40 | #41-#45, #114 |
| `cat:nuvem-bonus` | a definir depois do MVP | — | #57-#59 |

Lista viva: [issues](https://github.com/LucasStop/review-lab/issues), [PRs mergeados](https://github.com/LucasStop/review-lab/pulls?q=is%3Apr+is%3Amerged), [milestones](https://github.com/LucasStop/review-lab/milestones).

## Fases

1. **Organização (24-25/10):** este mapa, [TESTES.md](TESTES.md), o design system ([design/DESIGN-SYSTEM.md](design/DESIGN-SYSTEM.md), #114) e a base das ferramentas de teste (#115).
2. **Aplicação (a partir de 26/10):** telas e Contexts. Cada PR leva o teste de componente e o fluxo Maestro e cita os cenários que cobre. Termina com #111 e o marco #52.
