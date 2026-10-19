# PRD: Review Lab

## Problema

Estudar code review exige ver PRs reais com descrição e contexto, mas o GitHub mistura isso com ruído e não tem lista de estudo. Bacchelli e Bird (ICSE 2013) mostram que o valor da revisão está em entender a mudança e transferir conhecimento; a descrição do PR é o ponto de entrada.

## Usuário

Pessoa desenvolvedora (estudante ou júnior) que quer ler PRs de projetos open source grandes, guardar os bons e registrar o que aprendeu.

## Produto

App React Native (Expo, TypeScript) que cataloga PRs fechados de um repositório open source (padrão `expo/expo`) pela API REST do GitHub, somente leitura (GET).

## Escopo (v1, Somativo 2)

| Capacidade | RF |
|---|---|
| Login e cadastro locais, sessão persistente, logout | RF07 |
| Grade de PRs com avatar do autor e título, rolagem infinita, pull-to-refresh | RF01 |
| Detalhe do PR por número, descrição em texto limpo | RF02, RF03 |
| Salvar PR para estudar (favorito), tela de salvos | RF04, RF05 |
| Marcar PR como estudado com nota de utilidade 1 a 5, tela de estudados | RF07 |
| Persistência local de salvos e estudados por usuário | RF06 |
| Busca por termo dentro do repositório, lista de resultados, mensagem de vazio | RF08 |
| Carregando, erro com "Tentar novamente", limite de requisições explicado | RF09 |
| Acessibilidade: labels, roles, estado, toque 44x44, fonte grande | RF10 |

## Fora de escopo

Escrever no GitHub (comentar, aprovar), OAuth do GitHub, comentários de review inline, troca de repositório na UI, notificações. Nuvem e auth real são bônus condicionais (`cat:nuvem-bonus`).

## Requisitos não funcionais

- Limite de 60 requisições por hora sem token: o app tem cache e lida com o esgotamento sem quebrar. Token opcional em `EXPO_PUBLIC_GITHUB_TOKEN`, somente leitura e sem escopo.
- Conteúdo de PR é dado não confiável: sanitizado antes de renderizar.
- Senha nunca em texto puro; nada de segredo no git.
- Pastas `services/`, `contexts/`, `hooks/`, `components/`, `screens/` (exigência de código do Canvas).

## Critérios de sucesso

1. Checklist RF01-RF10 de [ENUNCIADO.md](ENUNCIADO.md) cumprido e demonstrável em 1:30 de vídeo.
2. Nenhuma penalidade da lista de [ENTREGA.md](ENTREGA.md).
3. typecheck, lint e CI verdes na main.

## Riscos

| Risco | Mitigação |
|---|---|
| 60 req/h acaba na demo | cache com TTL, ETag, token opcional, ver [ADR 0002](adr/0002-cache-e-rate-limit.md) |
| Busca tem limite próprio de 10/min | botão "Buscar" explícito (sem busca a cada tecla) |
| Repo renomeado devolve 301 | axios segue redirecionamento; repo fixo em config |
| PR sem imagem | avatar do autor, placeholder se faltar |
| Grupo ainda não formado | issues por categoria, sem responsável |
