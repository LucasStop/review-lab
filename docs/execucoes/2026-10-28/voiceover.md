# VoiceOver, roteiro passos 10 e 11 (28/10/2026)

Simulador iPhone 17, iOS 26.5, Expo Go, branch `feat/111-test-suite`. O VoiceOver foi ligado pelo painel do Device Hub (Xcode 26) e conduzido pelo teclado com o Quick Nav: seta para a direita e para a esquerda movem o foco. O texto abaixo é o que o VoiceOver falou, lido do log do processo `VoiceOverTouch` (`VOTSpeech`, "Post-processed string"); vírgula separa o rótulo, o estado e o papel falados em sequência. A voz do sistema está em inglês, por isso o papel sai em inglês ("Button", "Heading").

## Passo 10

| Tela | Fala |
|---|---|
| Login, do topo ao fim | "Entrar, Heading"; "E-mail, Text field"; "Senha, Secure text field"; "Entrar, Button"; "Não tenho conta, Button" |
| Login com senha errada | anúncio "E-mail ou senha incorretos." |
| Catálogo, do header aos chips | "Review Lab, Heading"; "Perfil, Button"; "Buscar PRs, Text field"; "Buscar, Button"; "Todos, Button"; "Salvos, Button"; "selected, Estudados, Button"; "Ver em 1 coluna, Button" |
| Chip Estudados tocado | o foco continua no chip (print 10a); ao voltar a ele, "selected, Estudados" |
| Card estudado | "PR number 52330: [JSI][iOS] Adapt every host function closure to `HostFunctionClosure`, de tsapeta, nota 4 de 5"; estrela do card "selected, Remover dos salvos, Button" |
| Detalhe do #52330 | "[JSI][iOS] Adapt every host function closure…, Heading"; "number 52330 · tsapeta"; "3 comentários · 4 arquivos · plus 73 minus 204"; "selected, Salvo para estudar, Button"; "selected, Estudado, Button"; "Nota de utilidade"; "Dar nota 1 de 5, Button" … "selected, Dar nota 4 de 5, Button"; "Dar nota 5 de 5, Button"; "Why, Heading" |
| Busca com resultado ("router" em Todos) | anúncio "20 PRs" |
| Busca sem resultado | anúncio "Nenhum resultado para zzqxvnonexistentqq. Tente outro termo ou troque o filtro." |
| Busca sem rede | anúncio "Sem conexão. Verifique a internet e tente novamente." |

## Passo 11

| Ação | Fala |
|---|---|
| Perfil, do e-mail ao fim | "a@a.com"; "Conta neste aparelho"; "Salvos: 2"; "Estudados: 1"; "Nota média: 4,0"; "Sair, Button"; "Excluir conta, Button" |
| Abrir Sair | o foco vai para "Cancelar, Button" |
| Cancelar no Sair | o foco volta para "Sair, Button" (print 11c) |
| Abrir Excluir conta | o foco vai para "Senha, Secure text field, Is editing" |
| Excluir com senha errada | anúncio "Senha incorreta." |
| Cancelar no Excluir | o foco volta para "Excluir conta, Button" (print 11f) |

## Achado e conserto

Antes do conserto, Cancelar nos dois diálogos levava o foco para "Review Lab, Back button", o voltar do header. Isso se repetiu com o bundle recarregado. O foco era devolvido quando `visible` virava `false`, com o Modal ainda no fade; quando ele saía, o iOS avisava troca de tela e o VoiceOver ia para o primeiro elemento. O commit `1a182f4` devolve o foco no `onDismiss` no iOS e mantém o efeito no Android, com o teste "C62 (iOS)" em `ProfileScreen.test.tsx`, que falhava no código antigo.

## Fora desta passada

- O gesto de Esc (esfregar com dois dedos): a tecla Esc do Mac fica com o Device Hub e não chega ao VoiceOver. O Esc chama o mesmo `cancel` do botão Cancelar (`onAccessibilityEscape`), coberto pelo RNTL em "C62 (Android)"; no iOS o foco volta pelo mesmo `onDismiss` do Cancelar.
- O botão flutuante do Expo Go ("gearshape.fill") entra no fim da ordem de leitura. É do Expo Go, não do app.
