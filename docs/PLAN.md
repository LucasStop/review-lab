# Plano: Review Lab (Somativo 2, React Native)

## Contexto

Mobile Development Framework exige um projeto React Native/Expo ("Catálogo Interativo 2.0", Canvas assignment 365836, 10 pontos, upload de um PDF, grupo de até 4 e só um posta). O grupo 10 tem 2 integrantes (Lucas Stopinski e Lucas Bruno e Silva); as issues saem por categoria e cada categoria tem um dono (ver AGENTS.md).

## Fatos verificados

- **Rubrica** (Canvas): Expo com axios, React Navigation native-stack e AsyncStorage ou expo-sqlite. FlatList em grade com rolagem infinita e pull-to-refresh. Detalhe por id com segunda requisição e HTML limpo. Favoritos via Context API, tela de favoritos e itens "consumidos" com nota de 1 a 5. Login local com sessão persistente, `AuthContext` e senha em expo-secure-store ou hash. Busca. `ActivityIndicator`, erro com "Tentar novamente", toque mínimo 44x44. Chaves em `.env` (`EXPO_PUBLIC_`), fora do git. Testes não são exigidos.
- **Pesos:** RF01 15%, RF02/03 10%, RF04/05 15%, RF06 a RF10 10% cada, código 5%, UI/UX 5%. Bônus de +10% para persistência em nuvem e +10% para autenticação real (esta exige a nuvem).
- **Entrega:** PDF único com capa (todos os nomes, senão zero para a pessoa), links do GitHub público (README com `npx expo start`) e do vídeo no YouTube (6 a 9 min, todos aparecendo e falando), tema/API/persistência/login, autoavaliação RF01 a RF10, comparação Flutter x RN, tema da explicação técnica com o minuto do vídeo, screenshots.
- **Penalidades:** mesmo tema ou API do Flutter -20%, item faltante no PDF -20% cada, vídeo fora de 6 a 9 min -5% por minuto, atraso -20% por semana, entrega por comentário -30%.
- **Temas proibidos por precaução:** Rick and Morty, posts, cachorros, receitas (já usados nas tarefas de Flutter).
- **Prazo:** Canvas due 02/11 23:59, trava 09/11 23:59. O plano de ensino lista apresentação em 26/10 e 09/11, mas o Canvas não tem tarefa de apresentação: só o Somativo 2 existe. O RA3 é, quase certamente, o vídeo do mesmo projeto. Confirmar com o professor se há apresentação ao vivo.
- **Curitiba Bus App:** Expo 57, expo-router, zustand, Supabase, mapas. Não casa com a rubrica (React Navigation, Context API, axios) e carrega 198 commits de outro escopo. Decisão do Lucas: app novo. Reaproveitar só o ferramental (ESLint, Prettier, lefthook, CI, convenções).

## Tema recomendado: "Review Lab", catálogo de PRs reais para estudar code review

Foco em ajudar a vida do dev. O app lista pull requests reais de repositórios open source (expo/expo, por exemplo), com a descrição e os comentários de review.

| Rubrica | Como o tema cumpre |
|---|---|
| Lista em grade com rolagem infinita | `GET /repos/{owner}/{repo}/pulls?state=closed&per_page=N&page=P` (testado: devolve `Link rel="next"`) |
| Detalhe por id, segunda requisição, HTML limpo | `GET /repos/{owner}/{repo}/pulls/{n}` com `Accept: application/vnd.github.html+json` devolve `body_html` (testado) |
| Busca | `GET /search/issues?q=type:pr+repo:...+palavra` |
| Itens "consumidos" com nota 1 a 5 | "estudado", com nota de utilidade do review |
| Favoritos | PRs salvos para estudar |
| Chave em `.env` | token opcional do GitHub: sem token são 60 requisições/hora (testado: `x-ratelimit-limit: 60`), com token 5.000/hora |

Riscos:
- O limite de 60/hora sem token é apertado para a demo. Mitigação: cache em AsyncStorage e token opcional.
- Variável `EXPO_PUBLIC_` vai embutida no bundle. Usar um token somente leitura, sem escopo, e dizer isso no README.
- Repos podem ser renomeados e a API responde 301 (visto com facebook/react-native). O axios tem de seguir redirecionamento, ou o app guarda o id do repositório.
- A lista de PRs não tem total de itens. A paginação usa o `Link`.

**Alternativas testadas ao vivo, mesma conformidade com a rubrica:**
- **dev.to** (`/api/articles?page=&tag=` e `/api/articles/{id}` com `body_html`): sem chave, sem limite que atrapalhe. Plano B se o limite do GitHub atrapalhar.
- **Stack Exchange** (`/questions?filter=withbody`, `/search/advanced`): HTML nos corpos, 300 requisições por dia sem chave.
- **Hacker News (Algolia)** (`/search?query=&page=`): busca paginada, sem HTML garantido.
- **Jikan:** resposta vazia, não verificada.

## Embasamento do tema (pesquisa web, verificado)

Ferramentas: WebFetch e Firecrawl (busca web e de papers). Perplexity não existe nesta sessão.

- **Bacchelli & Bird, ICSE 2013 (Microsoft Research, aberto e lido):** achar defeitos é a motivação principal, mas a revisão rende menos defeitos que o esperado; rende mais transferência de conhecimento, consciência da equipe e soluções alternativas. A compreensão da mudança é o centro da revisão, e as ferramentas atendem mal essa necessidade. Sustenta o app: PR com descrição e contexto legíveis como material de estudo.
- **Outras fontes achadas na busca, não abertas (citar só como "a confirmar"):** Sadowski et al. (Google, ICSE-SEIP 2018), Catolino et al. (MSR 2022), Kudrjavets et al. "Nudge" (TOSEM 2023), Gousios et al. (ICSE 2014) e a lista `awesome-code-review-research`. Blogs de LinearB, Meta e SmartBear são fontes secundárias.
- **Docs do GitHub (aberto e lido):** limite primário de 60 req/h sem autenticação (por IP) e 5.000/h autenticado; secundários: 100 requisições concorrentes e 900 pontos/min por endpoint (GET vale 1). Bate com o que medi ao vivo. A página "getting started" não cita `body_html`/`html+json`; esse ponto vale só pelo meu teste ao vivo, então reconferir na Fase 0.
- Uso no PDF: citar Bacchelli & Bird como motivação do tema (a explicação técnica e o minuto do vídeo).

## Divisão por categorias (issues por label `cat:*`)

Cada categoria vira um label e um conjunto de issues. Com 1 pessoa, uma segue todas. Com dupla, trio ou quarteto, cada um pega uma ou mais categorias, com review cruzado em todo PR.

| Categoria | Escopo | RF e peso (Canvas, 19/10/2026) |
|---|---|---|
| `cat:fundacao` | repo, Expo, TypeScript, ESLint, Prettier, lefthook, CI, `.env.example`, README base, AGENTS.md | código e organização 5% |
| `cat:dados` | cliente axios, mapeadores, paginação, limpeza de HTML, tratamento de erro e rate limit, cache | base de RF01, RF03, RF08, RF09 |
| `cat:navegacao-telas` | native-stack, grade com FlatList, rolagem infinita, pull-to-refresh, detalhe, busca e filtros Salvos e Estudados no Catálogo | RF01 15%, RF02/RF03 10%, RF05 (com RF04, 15%), RF08 10% |
| `cat:estado` | Context de favoritos e de "estudados" com nota 1 a 5, persistência em AsyncStorage | RF04 (com RF05, 15%), RF06 10%, consumidos do RF07 |
| `cat:auth` | `AuthContext`, cadastro e login locais, hash, expo-secure-store, sessão persistente, logout | RF07 10% |
| `cat:ux-acessibilidade` | `ActivityIndicator`, erro com "Tentar novamente", toque 44x44, labels de acessibilidade, fonte grande | RF09 10%, RF10 10%, UI/UX 5% |
| `cat:entrega` | PDF das 6 seções, autoavaliação RF01 a RF10, comparação Flutter x RN, roteiro e vídeo de 6 a 9 min, screenshots, capa com todos os nomes | evita -20% por item, -30% comentário, -5%/min de vídeo |
| `cat:nuvem-bonus` | persistência em nuvem e auth real (Supabase ou Firebase), só se sobrar tempo | +10% e +10% |

Mapeamento fixado contra o enunciado do Canvas em 19/10/2026; ver [ENUNCIADO.md](ENUNCIADO.md). Correções ao que este plano supunha: RF02+RF03 valem 10% juntos, RF04+RF05 15% juntos, RF07 inclui login e consumidos, e RF08, RF09, RF10 são busca, feedback de UI e acessibilidade. O enunciado não prevê apresentação ao vivo, só vídeo.

## Próximo passo

Fase 2: fechar o milestone "MVP interno" até o marco #52 (30/10/2026). Depois, a Fase 3 (entrega, milestone "Entrega Canvas 02/11"). Estado por RF em [MAPA.md](MAPA.md).


## Pendências

Respostas registradas em 26/10/2026 (#46):

1. Tema: "Review Lab" (PRs do GitHub) aprovado. O professor aprovou também o desenho: busca e filtros Salvos e Estudados dentro do Catálogo, 5 telas.
2. Nome do repositório: `review-lab`.
3. Grupo 10: Lucas Stopinski da Silva e Lucas Bruno e Silva (#94). Conferir na conferência final (#55) que a dupla está registrada no grupo do Canvas.
4. Apresentação: não há apresentação ao vivo. A entrega é o PDF único com o vídeo no YouTube, confirmado com o professor. O peso segue o Canvas: 10 pontos, 50% da nota final.
5. Colunas do Catálogo: o professor aprovou um botão que alterna entre 1 e 2 colunas (padrão 2), mantendo o `numColumns` do RF01 (#140, C66).

Regra que continua valendo: remoto no GitHub (conta `LucasStop`), convites, Project, visibilidade do repositório e envio ao Canvas só com ok explícito do Lucas.
