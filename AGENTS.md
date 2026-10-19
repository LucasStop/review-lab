# review-lab

App React Native (Expo) que cataloga pull requests reais de repositórios open source para estudar code review: grade de PRs, detalhe com a descrição em HTML limpo, busca, favoritos ("salvos para estudar") e PRs "estudados" com nota de utilidade de 1 a 5. É o Somativo 2 de Mobile Development Framework (PUCPR, 2026/2).

Este arquivo é o contexto de qualquer agente que trabalhe aqui. Plano em [docs/PLAN.md](docs/PLAN.md); rubrica e checklist de entrega em [docs/ENUNCIADO.md](docs/ENUNCIADO.md).

## Equipe

- Lucas Stopinski da Silva (`LucasStop`), dono do repositório.
- Grupo 10 do Canvas, ainda em formação (até 4 pessoas). A divisão é por categoria, não por pessoa.

## Prazos

| Data | Marco |
|---|---|
| 02/11/2026, 23:59 | prazo do Canvas (Somativo 2) |
| 09/11/2026, 23:59 | Canvas trava; atraso custa -20% por semana |

Entrega: um PDF único (ver [docs/ENUNCIADO.md](docs/ENUNCIADO.md) e [docs/ENTREGA.md](docs/ENTREGA.md)). O enunciado do Canvas não prevê apresentação ao vivo, só o vídeo; o plano de ensino cita 26/10 e 09/11, a confirmar com o professor.

## Tema e API

GitHub REST, só GET: `/repos/{o}/{r}/pulls?state=closed&per_page&page` (paginação pelo header `Link`), detalhe com `Accept: application/vnd.github.html+json` (campo `body_html`), busca em `/search/issues`. Sem token são 60 req/h; token opcional em `EXPO_PUBLIC_GITHUB_TOKEN`. Plano B: dev.to ou Stack Exchange. Não repetir tema ou API do projeto Flutter (-20%).

## Categorias

Cada categoria é um label `cat:*` e um conjunto de issues. Com uma pessoa, ela segue todas; com mais gente, cada um pega uma ou mais. Review cruzado em todo PR.

| Label | Escopo | RF e peso |
|---|---|---|
| `cat:fundacao` | repo, Expo, TypeScript, lint, CI, README base, estrutura de pastas | código e organização 5% |
| `cat:dados` | cliente axios, paginação, HTML limpo, erro e rate limit, cache | base de RF01, RF03, RF08, RF09 |
| `cat:navegacao-telas` | native-stack, grade, rolagem infinita, pull-to-refresh, detalhe, busca, tela de favoritos | RF01 15%, RF02/RF03 10%, RF05 (com RF04, 15%), RF08 10% |
| `cat:estado` | Context de favoritos e "estudados" com nota, AsyncStorage | RF04 (com RF05, 15%), RF06 10%, consumidos do RF07 |
| `cat:auth` | `AuthContext`, login local, hash, expo-secure-store, sessão, logout | RF07 10% |
| `cat:ux-acessibilidade` | `ActivityIndicator`, erro com "Tentar novamente", toque 44x44, labels, fonte grande | RF09 10%, RF10 10%, UI/UX 5% |
| `cat:entrega` | PDF, autoavaliação, Flutter x RN, roteiro e vídeo, screenshots, conferência de penalidades | evita -20% por item, -30%, -5%/min |
| `cat:nuvem-bonus` | nuvem e auth real, só se sobrar tempo | +10% RF06, +10% RF07 |

Mapeamento fixado em 19/10/2026 contra o Canvas, detalhe em [docs/ENUNCIADO.md](docs/ENUNCIADO.md).

## Mapa de docs

| Arquivo | Conteúdo |
|---|---|
| [docs/ENUNCIADO.md](docs/ENUNCIADO.md) | rubrica RF01-RF10, pesos, penalidades, formato do PDF e do vídeo |
| [docs/PLAN.md](docs/PLAN.md) | contexto, tema, riscos, embasamento |
| [docs/PRD.md](docs/PRD.md) | produto: usuário, escopo, requisitos, fora de escopo |
| [docs/SDD.md](docs/SDD.md) | arquitetura, telas, fluxo de dados, cache, sanitização, persistência |
| [docs/adr/](docs/adr/) | uma decisão por arquivo (HTML do PR, cache, hash e sessão, armazenamento) |
| [docs/ENTREGA.md](docs/ENTREGA.md) | roteiro do vídeo e esqueleto do PDF |

## Convenções

- Idioma: README e docs em português brasileiro. Identificadores, commits e PRs em inglês.
- Git: GitHub Flow, branch `feat/<issue>-slug` ou `fix/<issue>-slug`, um PR por issue, review de outra pessoa. Conventional Commits completo: `tipo(escopo): resumo`, linha em branco, corpo com o porquê. Commits por fase real, nunca um commit único no fim. Commit e push só quando a pessoa dona da sessão pedir.
- Estilo: editar antes de criar arquivo. Comentário só para o porquê não óbvio. Dependência nova só depois de conferir versão, licença e CVE.
- Nada é dado como pronto sem verificação: rodar typecheck e lint e ler a saída.

## Segurança

- Nunca commitar `.env`, credencial ou chave. O `.env.example` só tem nomes de variável.
- `EXPO_PUBLIC_*` vai embutido no bundle: só token somente leitura, sem escopo.
- Senha local nunca em texto puro: hash, e sessão em expo-secure-store.
- Conteúdo de PR (`body_html`) é dado não confiável: sanitizar antes de renderizar, nunca executar.
- Log e erro não carregam token nem dado do usuário.

## Uso de IA

Desenvolvido com apoio de agentes de IA (Claude Code). Declarar no README final.
