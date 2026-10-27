# Mapa do projeto

Retrato da Fase 2 (aplicação), em andamento desde 26/10/2026. O PR que muda o estado de um RF atualiza este arquivo.

## Estado por RF

Legenda: **base** quer dizer que a lógica existe, mas falta a tela.

| RF | Peso | Já existe | Falta | Dono |
|---|---|---|---|---|
| RF01 Catálogo | 15% | grade de 2 colunas com avatar, título, número e autor, rolagem infinita e pull-to-refresh ([screens/CatalogScreen.tsx](../src/screens/CatalogScreen.tsx), #34 e #35); `listPullRequests` com paginação por `Link` (PR #103) e cache (PR #109); botão que alterna entre 1 e 2 colunas, com a escolha salva por usuário (#140) | — | Luc-Bruno |
| RF02 Navegação | 10% com RF03 | `RootNavigator` no `App.tsx`, com a AuthStack sem sessão e a AppStack com sessão (#32); o detalhe recebe `number` e põe o título do PR no header (#36); Perfil pelo botão do header do Catálogo (#125) | — | LucasStop, Luc-Bruno |
| RF03 Detalhe | 10% com RF02 | estatísticas e corpo em blocos sanitizados ([screens/DetailScreen.tsx](../src/screens/DetailScreen.tsx), #36), com links só http(s) filtrados no `sanitizeHtml` e de novo no `BodyBlocks` | — | Luc-Bruno |
| RF04 Favoritos (Context) | 15% com RF05 | `FavoritesContext` por usuário (#24); estrela no card e botão no detalhe, com o mesmo estado nas duas telas (#26) | — | Luc-Bruno |
| RF05 Favoritos (filtro Salvos no Catálogo) | 15% com RF04 | filtro Salvos no Catálogo, com a busca filtrando a lista local e o vazio que explica como salvar (#38), sobre `useFavorites().favorites` e `EmptyState` (PR #99) | — | Luc-Bruno |
| RF06 Persistência | 10% | `usePersistedList` no AsyncStorage com chave `rl.<userId>.<nome>`, que recusa gravar antes da hidratação (#24, #25), generalizado em `usePersistedValue` para as colunas do Catálogo (#140); portão no `RootNavigator` que segura as telas até favoritos, estudados e colunas saírem do disco, sem lista zerada na carga (#45, #140) | — | Luc-Bruno |
| RF07 Login, sessão, estudados | 10% | login e cadastro com hash e sal (#29 e #31), navegação condicional (#32), exclusão de conta no serviço (#124), `StudiedContext` com nota de 1 a 5 (#25), marcar como estudado com a nota editável no detalhe (#27), filtro Estudados no Catálogo com a nota em estrelas (#39), Perfil com e-mail, totais e nota média, e Sair e Excluir conta com confirmação (#125, além da rubrica) | — | LucasStop, Luc-Bruno |
| RF08 Busca (campo e botão no Catálogo) | 10% | campo "Buscar PRs" e botão "Buscar" no Catálogo, com carregando, erro, limite com horário e "Nenhum resultado para" o termo (#37); `searchPullRequests` e `buildSearchQuery` (PR #106) | — | Luc-Bruno |
| RF09 Feedback | 10% | `ActivityIndicator` e `ErrorState` com "Tentar novamente" no Catálogo e no detalhe; erro da página seguinte no rodapé; `AppError` com horário de volta do limite (PR #104); `useFetch` com teste próprio de carga, erro, retry, cancelamento e troca de fetcher (#41) | conferir cada fluxo no simulador com a rede lenta, no roteiro do #111 | Luc-Bruno |
| RF10 Acessibilidade | 10% | tokens com contraste testado (#114); tema de navegação feito dos tokens, com o voltar do iOS em `link`, e `link` sobre `surface` no teste de contraste (#44); label, role e toque 44x44 nos componentes | #42 e #43 | Luc-Bruno |

## Módulos

Padrão do projeto: a lógica fica numa fábrica `create*` pura, que recebe as dependências e é testada com `node:test`. Um binding fino (`app*` ou `secure*`) liga a fábrica ao módulo nativo, e esse binding não é testado. Telas, Contexts e componentes têm teste de componente (`yarn test:ui`).

| Arquivo | O que faz | Teste |
|---|---|---|
| [src/config.ts](../src/config.ts) | lê `EXPO_PUBLIC_GITHUB_REPO` (padrão `expo/expo`) e `EXPO_PUBLIC_GITHUB_TOKEN` | — |
| [src/types/github.ts](../src/types/github.ts) | tipos crus da API e as views `PullRequestSummary`, `PullRequestPage` e `PullRequestDetailView` | — |
| [src/services/github.ts](../src/services/github.ts) | cliente axios (15 s, Bearer só com token) com lista, detalhe e busca | pelas funções puras |
| [src/services/cache.ts](../src/services/cache.ts) | TTL, ETag, limite de 50 entradas; com a chave em cache, qualquer falha (rede, 403, 5xx) devolve o valor vencido | 8 |
| [src/services/appCache.ts](../src/services/appCache.ts) | instância do cache sobre o AsyncStorage | binding |
| [src/services/storage.ts](../src/services/storage.ts) | `read`, `load`, `write` e `remove` em JSON com fallback; `userKey` e `removeUserKeys` | 8 |
| [src/services/appStorage.ts](../src/services/appStorage.ts) | AsyncStorage | binding |
| [src/services/credentials.ts](../src/services/credentials.ts) | cadastro e login com SHA-256 com sal (2000 iterações) e comparação sem saída antecipada (tempo constante dentro do possível em JS) | 10 |
| [src/services/secureCredentials.ts](../src/services/secureCredentials.ts) | expo-crypto e expo-secure-store | binding |
| [src/services/session.ts](../src/services/session.ts) | `restore`, `signIn`, `signUp`, `signOut` e `deleteAccount`; a sessão guarda `{ userId, email }` em JSON e ainda lê o formato antigo (`parseSession`) | 13 |
| [src/services/appAuth.ts](../src/services/appAuth.ts) | sessão em SecureStore | binding |
| [src/utils/sanitizeHtml.ts](../src/utils/sanitizeHtml.ts) | converte `body_html` em blocos tipados e descarta script, style, iframe e img | 12 |
| [src/utils/appError.ts](../src/utils/appError.ts) | erro normalizado em 7 tipos, com mensagem fixa sem token nem URL | 8 |
| [src/utils/linkHeader.ts](../src/utils/linkHeader.ts) | parse do header `Link` | 4 |
| [src/utils/pullRequest.ts](../src/utils/pullRequest.ts) | `toSummary`, `toDetail` e `buildSearchQuery` | 8 |
| [src/utils/avatar.ts](../src/utils/avatar.ts) | inicial e cor de fundo do avatar sem foto, com o contraste conferido | 3 |
| [src/utils/collections.ts](../src/utils/collections.ts) | validação e operações das listas de salvos e estudados (`toggleFavorite`, `withStudied`, `withoutStudied`) a busca local (`filterByTerm`) e a nota média do Perfil (`averageRating`) | 9 |
| [src/utils/mergePage.ts](../src/utils/mergePage.ts) | junta a página nova à lista sem repetir PR | 3 |
| [src/theme/index.ts](../src/theme/index.ts) | tokens e pares de texto e fundo | 5 (contraste, borda, label, espaçamento e alvo de toque) |
| [src/hooks/useFetch.ts](../src/hooks/useFetch.ts) | `{status, data, error, retry}` com cancelamento por `AbortController` | `useFetch.test.tsx` (#41), além do `DetailScreen.test.tsx` e do `CatalogScreen.test.tsx` |
| [src/hooks/usePersistedList.ts](../src/hooks/usePersistedList.ts) | `usePersistedValue` (valor por usuário no AsyncStorage, com hidratação) e `usePersistedList` em cima dele | pelos testes dos Contexts e pelo C66 do `CatalogScreen.test.tsx` |
| [src/hooks/usePullRequestList.ts](../src/hooks/usePullRequestList.ts) | páginas, refresh e erro da página seguinte no Catálogo | pelo `CatalogScreen.test.tsx` |
| [src/contexts/AuthContext.tsx](../src/contexts/AuthContext.tsx) | `AuthProvider` e `useAuth` com hidratação | `AuthContext.test.tsx`, `RootNavigator.test.tsx` |
| [src/contexts/FavoritesContext.tsx](../src/contexts/FavoritesContext.tsx) | `FavoritesProvider` e `useFavorites` | `FavoritesContext.test.tsx` |
| [src/contexts/StudiedContext.tsx](../src/contexts/StudiedContext.tsx) | `StudiedProvider` e `useStudied`, com nota de 1 a 5 | `StudiedContext.test.tsx` |
| [src/contexts/LayoutContext.tsx](../src/contexts/LayoutContext.tsx) | `LayoutProvider` e `useLayout`, com 1 ou 2 colunas (padrão 2) | `CatalogScreen.test.tsx` (C66) e `RootNavigator.hydration.test.tsx` |
| [src/components/](../src/components/) | `Avatar`, `BodyBlocks`, `Button`, `ConfirmDialog`, `EmptyState`, `ErrorState`, `PullRequestCard`, `StarRating` e `TextField` | `ErrorState`, `PullRequestCard` e `StarRating`; os outros pelas telas |
| [src/screens/](../src/screens/) | Login e Cadastro (com `AuthForm`), Catálogo, Detalhe e Perfil | um arquivo por tela e `FavoritesFlow.test.tsx` |
| [src/navigation/](../src/navigation/) | tipos de rota, `RootNavigator` (com o portão de hidratação), `AuthStack` e `AppStack` | `RootNavigator.test.tsx` e `RootNavigator.hydration.test.tsx`; E2E em `.maestro/` |

Totais da última execução: tabela "Execuções" de [TESTES.md](TESTES.md).

## Issues por categoria e pessoa

| Categoria | Dono | Fechadas | Abertas |
|---|---|---|---|
| `cat:fundacao` | LucasStop | #5-#14, #68, #94, #113, #115, #121 | — |
| `cat:dados` | LucasStop | #15-#22 | — |
| `cat:auth` | LucasStop | #29-#32, #124 | — |
| `cat:entrega` | LucasStop | #46 | #47-#56, #111 (com Luc-Bruno) |
| `cat:navegacao-telas` | Luc-Bruno | #33-#39, #125, #140 | — |
| `cat:estado` | Luc-Bruno | #23-#28 | — |
| `cat:ux-acessibilidade` | Luc-Bruno | #40, #41, #44, #45, #114, #119, #123, #128, #130 | #42, #43 |
| `cat:nuvem-bonus` | a definir depois do MVP | — | #57-#59 |

Lista viva: [issues](https://github.com/LucasStop/review-lab/issues), [PRs mergeados](https://github.com/LucasStop/review-lab/pulls?q=is%3Apr+is%3Amerged), [milestones](https://github.com/LucasStop/review-lab/milestones).

## Decisão do professor

Resposta no Canvas em 26/10/2026: Salvos e Estudados podem ser filtros do Catálogo, "se fizer sentido no contexto do app" e com boa usabilidade, e a busca pode ficar na mesma tela. Por isso o app tem 5 telas (Login, Cadastro, Catálogo, Detalhe, Perfil) e o RF05 e o RF08 são entregues dentro do Catálogo. A usabilidade é conferida por C63-C65 e pelo roteiro manual. No mesmo dia ele sugeriu o botão que alterna a grade entre 1 e 2 colunas, que mantém o `numColumns` do RF01 (#140, C66).

## Fases

1. **Organização (24-25/10):** este mapa, [TESTES.md](TESTES.md), o design system ([design/DESIGN-SYSTEM.md](design/DESIGN-SYSTEM.md), #114) e a base das ferramentas de teste (#115).
2. **Aplicação (a partir de 26/10):** telas e Contexts. Cada PR leva o teste de componente e o fluxo Maestro e cita os cenários que cobre. Termina com #111 e o marco #52, no milestone "MVP interno" (30/10).
3. **Entrega (até 02/11):** autoavaliação, comparação Flutter x React Native, screenshots, roteiro e vídeo, PDF e conferência de penalidades (#47-#51, #53-#56), no milestone "Entrega Canvas 02/11".
