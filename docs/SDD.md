# SDD: Review Lab

Design técnico. Requisitos em [PRD.md](PRD.md), rubrica em [ENUNCIADO.md](ENUNCIADO.md), decisões em [adr/](adr/).

## Arquitetura

Expo (TypeScript), React Navigation native-stack, axios, Context API. Sem biblioteca de estado externa.

```
src/
  services/    github.ts (axios), cache.ts, storage.ts, credentials.ts, session.ts e os bindings app*/secure*
  contexts/    AuthContext, FavoritesContext, StudiedContext
  hooks/       useFetch (detalhe), usePullRequestList (paginação), usePersistedList (listas por usuário)
  components/  PullRequestCard, StarRating, ErrorState, EmptyState, Avatar, BodyBlocks, Button, TextField
  screens/     Login, SignUp, Catalog, Detail, Profile
  utils/       sanitizeHtml, linkHeader, appError, pullRequest, collections, mergePage, avatar
  navigation/  AuthStack, AppStack, RootNavigator
```

Camadas: tela -> hook -> service. Tela não chama axios.

## Telas

| Tela | Stack | Função |
|---|---|---|
| Login / Cadastro | AuthStack | entrada local, erro de credencial |
| Catálogo | AppStack | campo de busca e botão "Buscar" no topo, filtros Todos, Salvos e Estudados, grade 2 colunas com botão para 1 coluna; header com Perfil |
| Detalhe | AppStack | título dinâmico, descrição limpa, salvar, estudado + nota |
| Perfil | AppStack | e-mail, totais de salvos e estudados, nota média; Sair e Excluir conta com confirmação |

`RootNavigator` escolhe AuthStack ou AppStack pelo estado do `AuthContext`; logout só limpa a sessão, sem `navigate('Login')`.

`auth.deleteAccount(userId, password)`: confere a senha com o hash de `credentials`, remove a credencial, a sessão e as chaves `rl.<userId>.*` (`storage.userKey`) e não toca em outro usuário. Senha errada não apaga nada e devolve o mesmo erro do login. Excluir e Sair pedem confirmação na tela, e o `RootNavigator` volta ao Login sozinho, como no logout.

## Fluxo de dados

1. Catálogo: `GET /repos/{o}/{r}/pulls?state=closed&per_page=20&page=N`. O header `Link` (`rel="next"`) diz se há próxima página; a lista não traz total. `onEndReached` busca a próxima e anexa; pull-to-refresh volta à página 1.
2. Detalhe: `GET /repos/{o}/{r}/pulls/{n}` com `Accept: application/vnd.github.html+json`, campo `body_html`.
3. Busca: `GET /search/issues?q=type:pr repo:{o}/{r} {termo}`. Resultado tem formato de issue (sem `body_html`); tocar abre o detalhe por número.
4. Card: título, número, autor, avatar (`user.avatar_url`); placeholder sem avatar. `keyExtractor` = `String(pr.number)`.

Estados de cada requisição: `loading | error | data` explícitos em `useFetch`.

## Cache e rate limit

Resumo; decisão em [ADR 0002](adr/0002-cache-e-rate-limit.md).

- Cache em AsyncStorage por URL, TTL de 10 min na lista e 1 h no detalhe. Cache expirado serve de fallback se a rede falhar.
- ETag/`If-None-Match`: resposta 304 renova a cópia; sem token ainda desconta do limite (medido), o TTL é que poupa as 60/h.
- Interceptor lê `x-ratelimit-remaining` e `x-ratelimit-reset`; 403/429 com remaining 0 vira erro "limite atingido, volta às HH:MM" com cache como alternativa.
- Token opcional por `EXPO_PUBLIC_GITHUB_TOKEN`; sem ele o app funciona com 60/h.

## Sanitização do `body_html`

Decisão em [ADR 0001](adr/0001-html-do-pr.md). O HTML vem do GitHub já renderizado, mas o texto é de terceiros.

- Nunca `WebView` com HTML cru, nunca executar script.
- Parser com lista de tags permitidas (p, br, ul, ol, li, pre, code, strong, em, h1-h6, blockquote, a). Qualquer outra tag, atributo e `on*` é descartado; conteúdo de `script`, `style`, `iframe` é removido inteiro.
- Link só com esquema `http(s)`; vai como texto sublinhado que abre no navegador do sistema.
- Imagens do corpo são ignoradas (menos superfície, menos rede).
- Saída: lista de blocos tipados renderizados por componentes nativos `Text`, não HTML.
- Teste primeiro (parsing de entrada não confiável): casos com `<script>`, `onerror`, `javascript:`.

## Persistência

Decisão em [ADR 0004](adr/0004-asyncstorage-vs-sqlite.md) e [ADR 0003](adr/0003-hash-e-sessao.md).

| Dado | Onde | Chave |
|---|---|---|
| Credencial (salt + hash) | expo-secure-store | `rl.cred.<sha256 do e-mail>` |
| Sessão (userId e e-mail normalizado, em JSON; o formato antigo, só o userId, ainda é lido) | expo-secure-store | `rl.session` |
| Salvos | AsyncStorage | `rl.<userId>.favorites` (snapshot do PR) |
| Estudados e nota | AsyncStorage | `rl.<userId>.studied` |
| Colunas do Catálogo | AsyncStorage | `rl.<userId>.layout` (`1` ou `2`; ausente ou inválido abre em 2) |
| Cache HTTP | AsyncStorage | `rl.cache.list:<repo>:<página>` e `rl.cache.detail:<repo>:<número>` |

Os Contexts carregam no `useEffect` inicial e expõem `hydrated`. No `RootNavigator`, o `HydrationGate` fica dentro do `FavoritesProvider` e do `StudiedProvider` e mostra o mesmo `ActivityIndicator` da sessão até as duas listas hidratarem; só então monta a `AppStack`, então Catálogo, Detalhe e Perfil nunca exibem dado zerado (RF06, C26). Leitura que falhou conta como hidratada: a lista abre vazia e recusa gravar, para não apagar o dado bom do disco, e o loader não trava. Favoritos guardam um snapshot (número, título, autor, avatar) para o filtro Salvos funcionar sem requisição.

## Erros e acessibilidade

`ErrorState` único (mensagem + "Tentar novamente"), `EmptyState` único. Toque mínimo 44x44 por `minHeight/minWidth` ou `hitSlop`; sem altura fixa em texto; `allowFontScaling` mantido. Botões de estado usam `accessibilityState={{ selected }}` e label que muda.

## Configuração

`.env` (fora do git), `.env.example` só com nomes: `EXPO_PUBLIC_GITHUB_TOKEN` (opcional) e `EXPO_PUBLIC_GITHUB_REPO` (padrão `expo/expo`). Variável `EXPO_PUBLIC_*` vai no bundle: só token somente leitura sem escopo.
