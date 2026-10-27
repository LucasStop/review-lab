# Design system

Fonte dos valores: [src/theme/index.ts](../../src/theme/index.ts). O teste [theme.test.ts](../../src/theme/theme.test.ts) calcula o contraste de cada par e falha abaixo de 4.5:1. Protótipo clicável das 5 telas: ver a seção [Protótipo](#protótipo).

Princípio: nenhuma tela escreve cor, tamanho ou espaçamento solto. Tudo vem de `src/theme`. Só tema claro; o enunciado não pede escuro e um segundo tema dobraria o trabalho de contraste.

## Tokens

### Cores

| Token | Valor | Uso | Contraste |
|---|---|---|---|
| `background` | `#ffffff` | fundo das telas | |
| `surface` | `#f3f4f6` | cards, campos, faixas | |
| `text` | `#111827` | texto principal | 17.74 sobre `background`, 16.12 sobre `surface` |
| `textMuted` | `#4b5563` | autor, número do PR, legenda | 7.56 sobre `background`, 6.87 sobre `surface` |
| `primary` | `#1f2937` | botão principal | |
| `onPrimary` | `#ffffff` | texto do botão principal | 14.68 sobre `primary` |
| `link` | `#1d4ed8` | link do corpo do PR | 6.70 sobre `background`, 6.09 sobre `surface` |
| `danger` | `#b91c1c` | texto de erro | 5.91 sobre `dangerSurface` |
| `dangerSurface` | `#fef2f2` | fundo de erro | |
| `star` | `#b45309` | estrela da nota | 5.02 sobre `background`, 4.56 sobre `surface` |
| `danger` como fundo | `#b91c1c` | botão "Excluir" do diálogo | 6.47 de `onPrimary` sobre `danger` |
| `border` | `#6b7280` | borda de campo | 4.83 sobre `background` (mínimo 3:1 para controle) |

O tema de navegação (`App.tsx`) sai dos tokens: o tint do header, que pinta o voltar do Detalhe, é `link` (o padrão do iOS, `#007AFF`, dá 4.02 sobre `background`). O `Button` desabilitado (opacidade 0.6) dá 4.04 em `onPrimary` sobre `primary`; fica isento pelo WCAG 1.4.3, que não cobra componente inativo.

Cor nunca é o único sinal: o estado "salvo" muda ícone e label, a nota usa ★ e ☆, o erro traz texto.

### Espaçamento, raio, tipografia, toque

| Token | Valores |
|---|---|
| `spacing` | `xs` 4, `sm` 8, `md` 12, `lg` 16, `xl` 24, `xxl` 32 (escala de 4) |
| `radius` | `sm` 4, `md` 8, `lg` 12, `pill` 999 |
| `typography` | `title` 22/700, `heading` 18/600, `body` 16/400, `caption` 14/400, `label` 14/600, `button` 16/600 |
| `touch.min` | 44 |
| `glyph` | `md` 24 (estrela de salvar do card), `lg` 28 (estrela da nota editável) |

Regras de texto (RF10): nunca `allowFontScaling={false}`, nunca `height` ou `lineHeight` fixos em texto de conteúdo, nunca `numberOfLines` que esconda a informação principal. Contêiner de texto usa `minHeight`, não `height`.

## Componentes

`StarRating`, `ErrorState` e `EmptyState` já existem em [src/components/](../../src/components/). O resto entra na Fase 2, no PR da primeira tela que o usa. O contrato abaixo é o que o PR tem que entregar, e todo componente usa os tokens.

| Componente | Props | Acessibilidade | Estado |
|---|---|---|---|
| `Button` | `label`, `onPress`, `variant` (`primary` \| `secondary`), `loading?`, `disabled?`, `testID?` | `accessibilityRole="button"`, `accessibilityState={{ disabled, busy: loading }}`, `minHeight` 44; `loading` troca o texto por `ActivityIndicator` e bloqueia o toque; o spinner leva `testID="loading"` | feito (#31) |
| `TextField` | `label`, `value`, `onChangeText`, `secureTextEntry?`, `keyboardType?`, `autoComplete?`, `testID?` | label visível acima do campo e `accessibilityLabel` igual; `minHeight` 44; o erro do formulário é da tela, com `accessibilityRole="alert"` e testID `<tela>.error`, para não apontar qual campo errou | feito (#31) |
| `Avatar` | `uri?`, `name`, `size` | `accessibilityLabel="Avatar de {name}"` com imagem; sem `uri` mostra a inicial em branco sobre uma cor de fundo derivada do nome (contraste >= 4.5:1); `accessible={false}` quando o nome já está no texto ao lado | feito #34 |
| `PullRequestCard` | `pr: PullRequestSummary`, `saved`, `onPress`, `onToggleSave`, `rating?` (só em Estudados; entra no label do card como "nota N de 5" e aparece como estrelas ★ e ☆ em `typography.caption` com `colors.star`, testID `<testID>.rating`; o protótipo usa 18px, e o app fica no token da linha de meta do card, com o número no label), `testID`, `saveTestID` | o card inteiro é um botão com label "PR #n: título, de autor"; o ícone de salvar é outro botão com `accessibilityState={{ selected: saved }}` e label que muda ("Salvar para estudar" e "Remover dos salvos"); `hitSlop` no ícone | feito #34; estrelas no #39 |
| `ErrorState` | `message`, `onRetry` | `accessibilityRole="alert"` no texto da mensagem (no `View` o role não é exposto); botão "Tentar novamente" 44x44 | feito (#99, role corrigido no #117) |
| `EmptyState` | `title`, `text?` | só texto; a tela decide se há ação | feito (#99) |
| `ConfirmDialog` | `title`, `message`, `confirmLabel`, `onConfirm`, `onCancel`, `danger?`, `children?` (campo de senha) | `accessibilityRole="alert"` no texto; o foco entra no diálogo e volta ao botão de origem; fundo inerte (o RN `Modal` já prende o foco; o protótipo web não); Esc cancela; ação de perigo usa `danger` com `onPrimary`; o foco inicial vai para Cancelar em Sair e para o campo de senha em Excluir; alvo 44x44 | Fase 2 (#125) |
| `StarRating` | `value`, `onChange?` | editável: 5 botões "Dar nota N de 5" com `selected`; somente leitura: um único elemento "Nota N de 5"; alvo 44x44; as estrelas quebram linha com a fonte do sistema no máximo | feito (#98), tokens e teste no #27 |

Todos os componentes feitos já usam os tokens; o último a migrar foi o `StarRating`, no #27.

## Convenção de testID

Formato `tela.elemento`, em minúsculas, para o Maestro e para os testes de componente. Item de lista leva o número do PR.

| Tela | testIDs |
|---|---|
| Login | `login.email`, `login.password`, `login.submit`, `login.signup`, `login.error` |
| Cadastro | `signup.email`, `signup.password`, `signup.submit`, `signup.login`, `signup.error` |
| Catálogo | `catalog.list`, `catalog.card.<n>`, `catalog.card.<n>.rating`, `catalog.save.<n>`, `catalog.search-input`, `catalog.search-submit`, `catalog.filter.all`, `catalog.filter.saved`, `catalog.filter.studied`, `catalog.profile`, `catalog.footer-loader`, `catalog.empty` |
| Detalhe | `detail.title`, `detail.body`, `detail.save`, `detail.studied`, `detail.rating`, `detail.error` |
| Perfil | `profile.email`, `profile.saved-count`, `profile.studied-count`, `profile.avg`, `profile.logout`, `profile.delete`, `profile.password`, `profile.confirm`, `profile.cancel`, `profile.error` |
| Comum | `error.retry`, `loading` |

## Telas e estados

Toda tela tem estes estados, e cada um aparece no protótipo: **carregando** (`ActivityIndicator`), **erro** (`ErrorState`), **vazio** (`EmptyState`), **dados**.

| Tela | Stack | Dados | Vazio | Erro | Cenários |
|---|---|---|---|---|---|
| Login | Auth | formulário | n/a | mensagem única "E-mail ou senha incorretos" | C03-C05, C08 |
| Cadastro | Auth | formulário | n/a | e-mail repetido, senha curta | C02, C03 |
| Catálogo | App | campo de busca (label "Buscar PRs") e botão "Buscar" no topo, filtros Todos, Salvos e Estudados (`aria-pressed`), grade de 2 colunas: avatar, título, número, autor, ícone de salvar; em Estudados o card mostra a nota em estrelas (feito no #39) | "Nenhum PR encontrado"; "Nenhum resultado para {termo}"; "Você ainda não salvou nenhum PR" com "Toque em ☆ em um card ou no detalhe."; com termo, "Tente outro termo." em Todos e "Tente outro termo ou troque o filtro." nos filtros; "Você ainda não marcou nenhum PR como estudado" | `ErrorState`; erro na página 2 mantém a lista e mostra o erro no rodapé; limite de requisições da busca com o horário; erro e carregando só valem em Todos e na busca, já que Salvos e Estudados vêm do Context; a busca só roda ao tocar em Buscar (ou Enter), e Buscar com o campo vazio volta à lista; o campo não tem placeholder, porque o label visível já diz o que digitar (feito no #37); em Salvos e Estudados a busca filtra a lista local por título, autor e número, sem ir à rede, e desfavoritar tira o card de Salvos na hora; os chips têm 44x44 (`touch.min`), `radius.pill` e, selecionados, `primary` com texto `onPrimary`, e ficam fora da lista para não serem remontados ao trocar de filtro (feito no #38); o foco é conferido com o VoiceOver no passo 10; o protótipo busca localmente e não mostra o limite; o leitor de tela ainda não anuncia o resultado, o vazio e o erro da busca, o `ActivityIndicator` ainda não tem o label "Carregando" do protótipo, e os chips ainda não formam o grupo "Filtrar lista" (`role="group"`) nem devolvem o foco ao chip Salvos depois de tirar um card, como no protótipo (ficam para o #42) | C09-C14, C22, C23, C30, C31-C35, C52, C54, C55, C63-C65 |
| Detalhe | App | título no header, estatísticas, blocos de texto; botões "☆ Salvar para estudar" e "Marcar como estudado", que viram "★ Salvo para estudar" e "✓ Estudado" com `selected`; marcar grava a nota 4 e mostra "Nota de utilidade" com o `StarRating` editável; desmarcar apaga a nota, e marcar de novo volta a 4, como no protótipo; o app não tem o aviso "Marcado como estudado, nota 4" do protótipo, e o leitor de tela lê o `selected` e o label novo do botão (conferido no #42) | "Sem descrição" | `ErrorState` | C15-C17, C20, C28, C29, C53 |
| Perfil | App | e-mail, totais de salvos e estudados, nota média, Sair, Excluir conta | n/a | "Senha incorreta." no diálogo de exclusão; "Excluindo conta…" enquanto apaga | C07, C56-C62 |

Navegação: o Catálogo é a tela principal, com busca e filtros Todos, Salvos e Estudados na mesma tela (aprovado pelo professor em 26/10/2026, desde que a usabilidade fique boa), e leva ao Perfil pelo header; Sair e Excluir conta ficam dentro do Perfil. Sem sessão, só a AuthStack existe.

## Protótipo

Protótipo HTML clicável das 5 telas (Login, Cadastro, Catálogo com busca e filtros, Detalhe, Perfil), com os 4 estados alternáveis, publicado como Artifact privado ([abrir](https://claude.ai/artifact/6uCQVjVTGqNDPBBU4VMqTs); só abre para quem a conta do Lucas Stopinski liberar). A cópia versionada, [prototype.html](prototype.html), abre direto em qualquer navegador e é a referência para quem não tem acesso ao Artifact. Ele usa os valores dos tokens para texto e controles; bordas de card, trilho do spinner e cores de avatar são só ilustração e não são tokens. Serve de referência visual, não de código. Quando o protótipo e o app divergirem, o app com os tokens é a verdade.
