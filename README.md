# Review Lab

App React Native (Expo) que cataloga pull requests reais de repositórios open source para estudar code review: grade de PRs, detalhe com a descrição em texto limpo, busca, PRs salvos para estudar e PRs estudados com nota de utilidade de 1 a 5.

Projeto do Somativo 2 de Desenvolvimento Mobile Híbrido (PUCPR, 2026/2). Fonte de dados: API REST do GitHub, somente leitura.

> Estado atual: dados, auth e navegação prontos e testados; as telas começam na Fase 2. Estado por RF em [docs/MAPA.md](docs/MAPA.md), plano em [docs/PLAN.md](docs/PLAN.md), design em [docs/SDD.md](docs/SDD.md).

## Como rodar

Pré-requisitos: Node 22 (veja `.nvmrc`), yarn, e o app Expo Go no celular ou um emulador.

```bash
nvm use            # Node 22
yarn install
cp .env.example .env   # opcional, veja abaixo
yarn start        # equivale a `npx expo start`
```

Depois escaneie o QR code com o Expo Go, ou pressione `i` (iOS) ou `a` (Android) no terminal.

## Variáveis de ambiente

Copie `.env.example` para `.env`. O `.env` nunca é versionado.

| Variável | Para quê |
|---|---|
| `EXPO_PUBLIC_GITHUB_TOKEN` | opcional; sem ele a API dá 60 requisições por hora, com ele 5.000 |
| `EXPO_PUBLIC_GITHUB_REPO` | repositório catalogado, padrão `expo/expo` |

Atenção: tudo que começa com `EXPO_PUBLIC_` é embutido no bundle do app e fica visível. Use apenas um token somente leitura, sem nenhum escopo, criado só para isso.

## Scripts

| Comando | O que faz |
|---|---|
| `yarn typecheck` | `tsc --noEmit` |
| `yarn lint` | ESLint |
| `yarn format` / `yarn format:check` | Prettier (escreve / só confere) |
| `yarn test` | testes unitários (`node:test`) |
| `yarn test:ui` | testes de componente e integração (jest-expo + RNTL) |
| `yarn test:contract` | 3 GETs reais na API do GitHub; manual, gasta 3 das 60 req/h |

Antes de commitar: `brew install lefthook gitleaks` e `lefthook install`. O hook barra segredo (gitleaks) e código fora do formato. O CI repete typecheck, lint, formato e gitleaks em cada PR.

## Como testar

```bash
yarn test           # unitários: sanitizador, hash, sessão, cache, erros
yarn test:ui        # componentes e integração
yarn test:contract  # API real do GitHub, à mão
maestro test .maestro/smoke.yaml   # E2E no simulador, ver .maestro/README.md
```

Estratégia, cenários C01-C55 e roteiro manual em [docs/TESTES.md](docs/TESTES.md).

## Documentação

[docs/ENUNCIADO.md](docs/ENUNCIADO.md) (rubrica), [docs/PRD.md](docs/PRD.md), [docs/SDD.md](docs/SDD.md), [docs/adr/](docs/adr/) (decisões), [docs/ENTREGA.md](docs/ENTREGA.md) (vídeo e PDF), [docs/MAPA.md](docs/MAPA.md) (estado), [docs/TESTES.md](docs/TESTES.md) (testes).

## Uso de IA

Este projeto foi desenvolvido com apoio de agentes de IA (Claude Code, da Anthropic) para planejamento, documentação e código. Toda alteração passa por revisão e verificação (typecheck, lint, CI) antes do merge.

## Autores

- Lucas Stopinski da Silva
- Lucas Bruno e Silva
