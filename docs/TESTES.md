# Estratégia de testes

O Canvas não pede teste, mas o MVP (#52) só vale se cada RF for provado. Este arquivo define quais tipos de teste o projeto usa, onde cada um fica e quais cenários precisam passar. Cada PR cita os IDs dos cenários que cobre, na linha "Cenários cobertos" do template.

## Tipos de teste e decisão

| Tipo | Aplica? | Ferramenta e comando | Onde fica | Por quê |
|---|---|---|---|---|
| Estático | sim, já existe | TypeScript, ESLint, Prettier, gitleaks: `yarn typecheck`, `yarn lint`, `yarn format:check` | CI e lefthook | pega erro de tipo, de lint, de formato e segredo antes do review |
| Unitário | sim, já existe | `node:test` com type stripping: `yarn test` | `src/**/*.test.ts` | lógica pura (sanitizador, hash, cache, erros); roda em menos de 1 s e não precisa de nativo |
| Componente | sim (ferramenta em #115) | jest-expo + React Native Testing Library: `yarn test:ui` | `src/**/*.test.tsx` | prova o que o usuário vê e toca: texto, role, label, `onPress` |
| Integração | sim (ferramenta em #115) | jest-expo + RNTL, com storage falso e serviço mockado | `src/**/*.test.tsx` | Context + serviço + storage juntos: hidratação, sessão, favoritos por usuário |
| Acessibilidade automatizada | sim | RNTL (`getByRole`, `accessibilityState`, tamanho mínimo) e teste de contraste dos tokens (`node:test`) | junto do componente e em `src/theme/` | o RF10 vale 10% e regressão de contraste ou de label é silenciosa |
| Segurança do sanitizador | sim, já existe | corpus fixo de HTML hostil no `node:test` | `src/utils/sanitizeHtml.test.ts` | `body_html` é dado não confiável |
| E2E e cenário em tela | sim, local (ferramenta em #115) | Maestro + Expo Go no simulador iOS: `maestro test .maestro/` | `.maestro/*.yaml` | prova o fluxo real de toque, navegação e persistência; fora do CI porque precisa de simulador |
| Smoke | sim (#115) | `maestro test .maestro/smoke.yaml` | `.maestro/smoke.yaml` | conferência de 30 s de que o app abre, antes de qualquer demo |
| Regressão | sim, como política | CI obrigatório nos PRs e suíte Maestro antes dos marcos | — | ver a política abaixo |
| Contrato com a API real | sim, manual (#115) | `yarn test:contract` (3 GETs reais) | `scripts/contract.test.ts` | os mocks podem divergir da API; gasta 3 das 60 req/h, por isso fica fora do CI |
| Exploratório e manual | sim | roteiro abaixo | este arquivo | fonte ampliada, VoiceOver, modo avião e limite de requisições não se automatizam bem no Expo Go |
| Snapshot | não | — | — | quebra a cada ajuste visual e ninguém lê o diff |
| Mutação (Stryker) | não | — | — | custo alto para o prazo; o cético faz a versão manual (mudar uma linha e ver o teste falhar) |
| Carga e performance | não | — | — | não há servidor próprio; o limite é o da API do GitHub |
| Fuzz com biblioteca (fast-check) | não, por ora | — | — | o corpus hostil cobre os vetores conhecidos; entra só se o cético achar um que passe |

## Pirâmide

```
        E2E Maestro      ~8 fluxos, um por RF demonstrável
      Componente/Integ.  um arquivo .test.tsx por tela, Context e componente
   Unitário node:test    toda lógica pura (totais em Execuções)
Estático                 em todo commit e PR
```

Regra prática: o que dá para testar sem renderizar desce para o unitário. A tela testa só o que é dela: o que aparece, o que o toque chama e o estado de carregando, erro ou vazio.

## Política de regressão

- Todo bug achado, seja no roteiro, no review ou pelo cético, vira primeiro um teste vermelho. Só depois vem o conserto, no mesmo PR.
- O CI roda `yarn typecheck`, `yarn lint`, `yarn format:check`, `yarn test` e o gitleaks em todo PR; `yarn test:ui` entra com o #115. Nenhum merge acontece com CI vermelho.
- A suíte Maestro inteira e o roteiro manual rodam antes do #52 (MVP), do #51 (vídeo) e do #56 (envio). O resultado e a data entram na tabela de execuções.
- Todo PR passa por um subagente cético. Ele tenta quebrar o PR com entrada hostil, offline, limite de requisições e app reaberto, e muda uma linha do código para ver se algum teste falha.

## Convenções

- Os seletores de E2E usam `testID` no formato `tela.elemento`, por exemplo `login.email`, `catalog.card.123` e `detail.save`. Detalhe em [design/DESIGN-SYSTEM.md](design/DESIGN-SYSTEM.md).
- `node:test` importa o arquivo irmão com a extensão `.ts` e não importa nada nativo. O que é nativo fica atrás de um binding `app*`/`secure*`.
- Jest pega só `*.test.tsx`. Os globals vêm de `@jest/globals`.
- Nenhum teste chama a rede, exceto o de contrato.

## Catálogo de cenários

Níveis: **U** unitário, **C** componente, **I** integração, **E2E** Maestro, **M** manual. Status: **ok** quando já existe teste verde; **F2** quando entra na Fase 2, com a issue indicada.

### Auth e sessão (RF07)

| ID | Cenário | Nível | Status |
|---|---|---|---|
| C01 | Cadastro válido entra logado | U, E2E | ok (U e E2E `.maestro/auth.yaml`) #32 |
| C02 | E-mail repetido é recusado, mesmo com outra caixa ou com espaços, e a tela mostra a mensagem | U, C | U ok; C ok (#31) |
| C03 | Senha com menos de 6 caracteres ou e-mail sem `@` é recusado antes de gravar | U, C | U ok; C ok (#31) |
| C04 | Senha errada e e-mail desconhecido recebem a mesma mensagem | U, E2E | ok (U e E2E `.maestro/auth.yaml`) #32 |
| C05 | Senha e e-mail em texto puro nunca chegam ao store: o e-mail só fica na sessão, cifrado no SecureStore, nunca no AsyncStorage nem em `rl.cred.*` | U, I | ok (`credentials.test.ts`; sessão em `session.test.ts`, #125; varredura do AsyncStorage e de `rl.cred.*` no C58 de `RootNavigator.test.tsx`, #125) |
| C51 | Sem sessão, o app abre no Login e não chega à AppStack (login obrigatório) | I, E2E | ok (I `RootNavigator.test.tsx`, E2E `.maestro/auth.yaml`) #32 |
| C06 | Fechar e reabrir o app mantém a sessão | I, E2E | ok (I e E2E `.maestro/auth.yaml`) #32 |
| C07 | Logout volta ao login e apaga a sessão (o botão Sair fica no Perfil, com confirmação) | U, I, E2E | ok #32, #125 (U `session.test.ts`, I `RootNavigator.test.tsx` pelo Perfil); E2E em `.maestro/auth.yaml` |
| C08 | `ActivityIndicator` durante o login e o cadastro | C | ok (#31) |

### Catálogo (RF01)

| ID | Cenário | Nível | Status |
|---|---|---|---|
| C09 | Grade em 2 colunas com avatar e título | C, E2E | ok #35 (card em `PullRequestCard.test.tsx`; o fluxo `.maestro/catalog.yaml` cobre a carga e a rolagem); as 2 colunas são conferidas pelo `rightOf` entre `catalog.card.1` e `catalog.card.0` no `.maestro/catalog.yaml` desde o #140 |
| C10 | Autor apagado (`ghost`) ou sem avatar mostra placeholder | U, C | U ok; C ok #34 (`PullRequestCard.test.tsx`, `avatar.test.ts`) |
| C11 | Rolagem infinita anexa a próxima página, com loader no rodapé | I, E2E | ok #35 (`CatalogScreen.test.tsx`, `.maestro/catalog.yaml`) |
| C12 | Na última página não há mais pedidos (`hasNext` falso) | U, I | ok #35 (U do parser de `Link`; I em `CatalogScreen.test.tsx`) |
| C13 | Pull-to-refresh recarrega a página 1 ignorando o TTL | U, E2E | ok #35 (U do `force`; I e E2E em `CatalogScreen.test.tsx`, `.maestro/catalog.yaml`) |
| C14 | Anexar uma página não duplica chave (`keyExtractor` estável) | I | ok #35 (`mergePage.test.ts`, `CatalogScreen.test.tsx`) |
| C52 | Catálogo vazio mostra `ListEmptyComponent` | C | ok #35 (`CatalogScreen.test.tsx`) |

### Navegação e detalhe (RF02, RF03)

| ID | Cenário | Nível | Status |
|---|---|---|---|
| C15 | Tocar no card abre o detalhe com o número em `route.params` | E2E | ok (`.maestro/detail.yaml`) |
| C53 | O detalhe faz a segunda requisição pelo número e põe o título do PR no header com `navigation.setOptions` (hoje o `AppStack` mostra só "PR #n") | C | ok |
| C16 | O detalhe mostra avatar maior, estatísticas (comentários, arquivos, +/-) e os blocos de texto | C | ok |
| C17 | PR sem descrição mostra "Sem descrição", não erro | U, C | U ok; C ok |
| C18 | HTML hostil (`script`, `on*`, `javascript:`, `iframe`, `img`) não chega à tela | U | ok |
| C19 | HTML malformado não quebra nem vaza tag | U | ok |
| C20 | Só link `http` ou `https` vira tocável | U, C | U ok; C ok |

### Salvos para estudar (RF04, RF05)

| ID | Cenário | Nível | Status |
|---|---|---|---|
| C21 | Salvar no detalhe muda o ícone do mesmo PR no card do catálogo | I, E2E | I ok (`CatalogScreen.test.tsx`, `DetailScreen.test.tsx`); E2E em `.maestro/favorite.yaml` |
| C22 | O filtro Salvos do Catálogo lista os salvos e atualiza ao remover | C, E2E | ok #38 (`CatalogScreen.test.tsx`, `.maestro/filters.yaml`) |
| C23 | Filtro Salvos vazio mostra `EmptyState` amigável (`ListEmptyComponent`) | C, E2E | ok #38 (`CatalogScreen.test.tsx`, `.maestro/filters.yaml`) |
| C54 | Busca, filtros Salvos e Estudados e Perfil são acessíveis na tela do Catálogo | E2E | busca ok #37, Salvos ok #38 e Estudados ok #39 (`.maestro/search.yaml`, `.maestro/filters.yaml`, `.maestro/studied.yaml`); Perfil #125 (`catalog.profile` no header, tocado em `.maestro/auth.yaml` e `.maestro/profile.yaml`) |

### Persistência (RF06)

| ID | Cenário | Nível | Status |
|---|---|---|---|
| C24 | Salvos e estudados sobrevivem ao fechar e reabrir | I, E2E | I ok #24, #25 (`FavoritesContext.test.tsx`, `StudiedContext.test.tsx`); E2E ok #27 (`.maestro/studied.yaml` salva, marca, fecha e reabre o app) |
| C25 | JSON corrompido no storage abre vazio, sem quebrar | U, I | U ok; I ok #24, #25; I ok #45 (`RootNavigator.hydration.test.tsx`, o portão libera) |
| C26 | Durante a hidratação não aparece lista zerada (loader até carregar) | I | ok #45 (`RootNavigator.hydration.test.tsx`: loader no lugar do vazio de Salvos e de Estudados e dos botões do Detalhe, e leitura que falha abre vazia; `FavoritesContext.test.tsx` e `StudiedContext.test.tsx`: `hydrated` falso até a leitura) |
| C27 | Dois usuários no mesmo aparelho não veem os dados um do outro | U, I | ok #24, #25 (U do `userKey`; I nos dois contextos) |

### Estudados com nota (RF07)

| ID | Cenário | Nível | Status |
|---|---|---|---|
| C28 | Marcar como estudado com nota de 1 a 5 no detalhe | C, E2E | ok #27 (C em `StarRating.test.tsx` e `DetailScreen.test.tsx`, E2E em `.maestro/studied.yaml`) |
| C29 | Mudar a nota ou desmarcar atualiza a lista | I | I ok #25 (`StudiedContext.test.tsx`); tela ok #27 (`DetailScreen.test.tsx`) |
| C30 | O filtro Estudados do Catálogo lista cada PR com a sua nota | C, E2E | ok #39 (`CatalogScreen.test.tsx`, `PullRequestCard.test.tsx`, `.maestro/studied.yaml`) |
| C55 | Filtro Estudados vazio mostra `EmptyState` | C | ok #39 (`CatalogScreen.test.tsx`) |

### Perfil, sair e excluir conta (RF07, além da rubrica)

| ID | Cenário | Nível | Status |
|---|---|---|---|
| C56 | O Perfil mostra o e-mail, o total de salvos, o total de estudados e a nota média (traço sem estudados) | C, E2E | C ok #125 (`ProfileScreen.test.tsx`, também a sessão antiga sem e-mail); E2E em `.maestro/profile.yaml` |
| C57 | Sair pede confirmação; Cancelar mantém a sessão e a tela | C, E2E | C ok #125 (`ProfileScreen.test.tsx`); E2E em `.maestro/auth.yaml` |
| C58 | Confirmar Sair limpa só a sessão: salvos e estudados voltam no próximo login | I | ok #125 (`RootNavigator.test.tsx`, com o `createAuth` de verdade) |
| C59 | Excluir conta com senha errada recusa, mostra "Senha incorreta." e não apaga nada | U, C | U ok #124 (`session.test.ts`; estado em `AuthContext.test.tsx`); C ok #125 (`ProfileScreen.test.tsx`, também campo vazio, toque duplo no mesmo ciclo de render, nova tentativa depois da senha errada, Cancelar/Esc/voltar travados durante a exclusão e falha do `deleteAccount`); E2E em `.maestro/profile.yaml` |
| C60 | Excluir conta com a senha certa apaga credencial, sessão e as chaves `rl.<userId>.*` e volta ao Login | U, I, E2E | U ok #124; I ok #125 (`RootNavigator.test.tsx`, que confere a limpeza das chaves); E2E em `.maestro/profile.yaml`, que só confere a volta ao Login |
| C61 | Excluir conta não toca nos dados de outro usuário do aparelho; cadastrar o mesmo e-mail depois funciona | U, I | U ok #124 (`session.test.ts`, `storage.test.ts`, `credentials.test.ts`); I ok #125 (`RootNavigator.test.tsx`); recadastro também em `.maestro/profile.yaml` |
| C62 | O foco entra no diálogo de confirmação e volta ao botão que o abriu ao cancelar ou fechar com Esc | C | C ok #125 (`ProfileScreen.test.tsx`, espião em `sendAccessibilityEvent`, que também exige o diálogo já fechado quando o foco volta); VoiceOver no passo 11 do roteiro manual |

### Busca (RF08)

| ID | Cenário | Nível | Status |
|---|---|---|---|
| C31 | Buscar com resultado; tocar num item abre o detalhe dele (não navega direto ao primeiro) | C, E2E | ok #37 (`.maestro/search.yaml`; o `CatalogScreen.test.tsx` confere o número do PR aberto) |
| C32 | Sem resultado mostra mensagem clara | C, E2E | ok #37 (`CatalogScreen.test.tsx`, `.maestro/search.yaml`) |
| C33 | Termo vazio não chama a API | U, C | U ok; C ok #37 (só espaços não busca) |
| C34 | Qualificadores (`repo:`, `is:`) e operadores (`AND`, `OR`, `NOT`) digitados são neutralizados | U | ok; operadores no #37 (mais de 5 davam 422) |
| C35 | Loader durante a busca | C | ok #37 (`CatalogScreen.test.tsx`, com o campo de busca na tela) |
| C63 | Busca e filtro se combinam: buscar dentro de Salvos ou Estudados filtra a lista local; trocar de filtro mantém o termo aplicado | C | Salvos ok #38 e Estudados ok #39 (`CatalogScreen.test.tsx`) |
| C64 | Cada chip de filtro informa o estado (`accessibilityState.selected`, `aria-pressed` no protótipo), tem alvo de 44x44 e o foco continua nele depois de tocar | C, M | estado e 44x44 de Todos e Salvos ok #38 e de Estudados ok #39 (`CatalogScreen.test.tsx`); o foco no chip depois do toque fica no passo 10 do roteiro; o foco volta ao chip Salvos depois de tirar o salvo de um card, ok #42 (`CatalogScreen.test.tsx`, "in Salvos, unsaving a card moves the focus to the Salvos chip"), e no VoiceOver no passo 10 |
| C65 | O termo só vale ao tocar em Buscar (ou Enter); Buscar com o campo vazio volta à lista paginada do filtro | C, E2E | em Todos ok #37 (`CatalogScreen.test.tsx`; o `.maestro/search.yaml` cobre a volta com o campo vazio); em Salvos ok #38 e em Estudados ok #39 (`CatalogScreen.test.tsx`) |
| C66 | O botão do Catálogo alterna `numColumns` entre 1 e 2 (padrão 2), com label que diz a ação, alvo de 44x44, `key` nova no `FlatList` e a lista e os favoritos intactos | C, E2E | ok #140 (`CatalogScreen.test.tsx`: label da ação, largura do card de 2 para 1 coluna, sem nova busca, favorito marcado, 44x44 e a escolha de volta depois de remontar; `RootNavigator.hydration.test.tsx`: o portão espera `rl.<userId>.layout`; `.maestro/catalog.yaml`: `rightOf`, toque, `below` e volta a 2 colunas) |

### Feedback de UI (RF09)

| ID | Cenário | Nível | Status |
|---|---|---|---|
| C36 | `ActivityIndicator` na carga inicial do catálogo e do detalhe e na próxima página (`ListFooterComponent`) | C | catálogo ok #35 (`CatalogScreen.test.tsx`, inclui o rodapé `catalog.footer-loader`); detalhe ok #36 (`DetailScreen.test.tsx`) |
| C37 | Erro de rede mostra `ErrorState`, e "Tentar novamente" recarrega | C, I, M | C ok #115 (`ErrorState.test.tsx`); I ok #41 (`useFetch.test.tsx` cobre erro e retry), e o ciclo erro, "Tentar novamente", dados com o serviço mockado está nas telas desde #35, #36 e #37 (`CatalogScreen.test.tsx`, `DetailScreen.test.tsx`); M no roteiro |
| C38 | `useFetch`: carregando, depois dados; erro, depois retry; cancela ao desmontar; trocar o fetcher ignora o resultado do antigo | I | ok #41 (`useFetch.test.tsx`) |
| C39 | Limite de requisições mostra o horário de volta (só onde não há cache: busca, PR nunca aberto, página nova) | U, C, M | U ok; C da busca ok #37 (`CatalogScreen.test.tsx`); M no roteiro |
| C40 | Com cache, qualquer falha (offline, 403, 5xx) mostra o valor vencido em vez de erro | U, M | U ok; M no roteiro |
| C41 | Mensagem de erro nunca carrega token nem URL | U | ok |
| C42 | Timeout vira mensagem própria | U | ok |

### Acessibilidade (RF10)

| ID | Cenário | Nível | Status |
|---|---|---|---|
| C43 | Todo tocável e toda imagem tem `accessibilityRole` e `accessibilityLabel` | C | ok #42 (`Avatar.test.tsx`, `StarRating.test.tsx`, `TextField.test.tsx`, `ErrorState.test.tsx`, link de `LoginScreen.test.tsx`, labels "Carregando" em `CatalogScreen.test.tsx` e `DetailScreen.test.tsx`; anúncios nos testes C43 de `CatalogScreen`, `LoginScreen`, `ErrorState` e no C59 de `ProfileScreen`) |
| C44 | Botão de estado informa o estado (`selected` ou label que muda) | C | ok #26, conferido no #42: `detail.save`, `detail.studied`, a estrela do card e os chips já têm `selected` e label que muda (`DetailScreen.test.tsx` C44, `PullRequestCard.test.tsx`, `CatalogScreen.test.tsx` C64) |
| C45 | Alvo de toque de pelo menos 44x44 | C | ok #43: `minWidth` e `minHeight` lidos do `style` em `detail.save`, `detail.studied`, `Button` (3 variantes), `TextField` (só `minHeight`), "Tentar novamente", link do `AuthForm` e `catalog.profile`; estrela do card ok #34. Exceção: links dentro do texto do PR (`BodyBlocks`) são texto corrido e ficam fora (WCAG 2.5.8 isenta alvo inline) |
| C46 | Pares de cor dos tokens com contraste de pelo menos 4.5:1 | U | ok #44 (`theme.test.ts`); o tema de navegação (`App.tsx`) usa `link` como tint do header e não tem teste automatizado. No simulador com iOS 26.5, o voltar do Detalhe é o botão de vidro do sistema, com a seta quase preta (`#191919` no print), e ignora o tint; o `link` no voltar vale antes do iOS 26 |
| C47 | Fonte do sistema no máximo não corta texto nem sobrepõe; nenhum `allowFontScaling={false}` no código (`git grep`) | C, M | C da quebra de linha das estrelas ok #27 (`StarRating.test.tsx`); regressão do `git grep` ok #43 (`src/theme/fontScaling.test.ts`, visto cair com `allowFontScaling={false}` e revertido); teto de fonte da inicial do `Avatar`, da estrela do card e do texto Perfil do header (teto 2, `RootNavigator.test.tsx`) ok #43; a passada com a fonte no máximo continua no passo 9 do roteiro |
| C48 | VoiceOver lê card, botões e estrelas numa ordem que faz sentido | M | roteiro |

### Transversais

| ID | Cenário | Nível | Status |
|---|---|---|---|
| C49 | A API real ainda devolve os campos que `toSummary` e `toDetail` leem | contrato | #115 |
| C50 | O app abre no Expo Go sem erro vermelho | E2E smoke | #115; desde o #27 aceita a sessão salva e espera o header do Catálogo, que não depende da API |

Os IDs C51 a C55 vieram da revisão do catálogo, C56 a C62 do Perfil e C63 a C65 da busca e dos filtros dentro do Catálogo e C66 do botão de colunas; ficam no fim da numeração para não renumerar os outros.

## Roteiro manual

Rodar no simulador iOS com o Expo Go, sem token no `.env`, salvo o que o passo pedir. Registrar o resultado na tabela de execuções.

1. Cadastrar `a@a.com`, depois tentar `A@a.com ` de novo (C01, C02).
2. Navegar pela grade até a página 3, puxar para atualizar e conferir que a lista volta ao topo (C11, C13).
3. Abrir um PR com descrição longa e outro sem descrição (C16, C17).
4. Salvar 2 PRs, marcar 1 como estudado com nota 4, fechar o app pelo multitarefa e reabrir (C21, C24, C28, C06).
5. Abrir o Perfil e conferir o e-mail, os totais e a nota média (C56). Tocar em Sair, Cancelar, e depois Sair de novo e confirmar (C57, C07). Cadastrar `b@b.com` e conferir que salvos e estudados estão vazios (C27). No Perfil de `b@b.com`, Excluir conta com a senha errada e depois com a certa (C59, C60). Entrar de novo com `a@a.com` e ver os salvos e estudados de volta (C58, C61).
6. Buscar `fix` e um termo sem resultado como `zzzqqq`, depois tocar em Buscar com o campo vazio e ver a lista paginada voltar; buscar dentro de Salvos e de Estudados, trocar de filtro com o termo aplicado e alternar entre 1 e 2 colunas (C31, C32, C63, C65, C66).
7. Ligar o modo avião (Network Link Conditioner ou o Wi-Fi do Mac desligado), abrir um PR já visto e depois um novo (C37, C40).
8. Esgotar o limite da rede do Mac (é por IP): `until [ "$(curl -s https://api.github.com/rate_limit | python3 -c 'import sys,json;print(json.load(sys.stdin)["rate"]["remaining"])')" = 0 ]; do curl -s -o /dev/null 'https://api.github.com/repos/expo/expo/pulls?per_page=1'; done`. O `/rate_limit` não gasta. Depois, abrir um PR nunca aberto e ver a mensagem com o horário (C39). Puxar para atualizar a grade já em cache mostra a lista vencida, não o erro (C40). A busca tem um limite próprio, de 10 por minuto, que esse comando não gasta: `for i in $(seq 10); do curl -s -o /dev/null "https://api.github.com/search/issues?q=type:pr+x$i"; done` e, no mesmo minuto, buscar um termo no app e ver a mensagem com o horário (C39).
9. Em Ajustes > Acessibilidade > Tela e Tamanho do Texto, colocar o texto no máximo e percorrer as 5 telas (C47).
10. Ligar o VoiceOver e percorrer o login, a busca (resultado, vazio e erro), o card, os chips de filtro (estado lido e foco no chip depois do toque), o detalhe, o botão de salvar e as estrelas (C48, C64).
11. Com o VoiceOver, abrir o Perfil: cada bloco é lido inteiro ("Salvos: 2", "Nota média: 4,0" ou "Nota média: nenhuma"). Abrir Sair: o foco vai para Cancelar; o gesto de Esc (esfregar com dois dedos) fecha e o foco volta ao Sair. Abrir Excluir conta: o foco vai para o campo de senha, "Senha incorreta." é anunciado, e Cancelar devolve o foco ao Excluir conta (C62).

## Execuções

| Data | Marco | Unitário | Componente | Maestro | Manual | Observação |
|---|---|---|---|---|---|---|
| 24/10/2026 | Fase 1 | 59 ok | — | — | — | base antes das telas |
| 24/10/2026 | Fim da Fase 1 (`b86f359`) | 63 ok | 1 ok (ErrorState) | smoke ok | protótipo, 7 telas | contrato real 3 de 3, rodado uma vez no #117 |
| 26/10/2026 | Fase 2, depois do PR #139 (`5a97c73`) | 83 ok | 72 ok (11 suítes) | — | — | contagem lida no PR #142; o Maestro roda por PR, no cenário do PR |
