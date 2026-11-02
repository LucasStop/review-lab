# Roteiro do vídeo (YouTube, público, 6 a 9 min, meta 8:00)

Dupla: **Lucas Stopinski da Silva** (LucasStop) e **Lucas Bruno e Silva** (Luc-Bruno). Os dois aparecem e falam; os nomes ditos são iguais aos da capa do PDF. Fora de 6 a 9 min custa -5% por minuto: ensaiar com cronômetro e conferir a duração do arquivo final antes de publicar.

## Antes de gravar

- Simulador iPhone 17 limpo, Expo Go, `yarn start`, conta nova (e-mail de teste) ou o app sem sessão.
- Abrir a lista e 2 ou 3 PRs antes: o cache fica quente e a API (60 req/h sem token) não estoura no meio da gravação. Com limite esgotado o app mostra o horário de volta, mas o vídeo fica ruim.
- Fonte do sistema no padrão, modo avião desligado, notificações silenciadas, tela do computador sem dados pessoais.
- Se gravar a tela e as câmeras, combinar quem edita; o corte final precisa fechar entre 6:00 e 9:00.

## Linha do tempo

| Tempo | Quem | Conteúdo | RF |
|---|---|---|---|
| 0:00-0:30 | os dois | Cada um diz o nome completo e o que fez: "Lucas Stopinski da Silva, dados, login e entrega"; "Lucas Bruno e Silva, telas, estado e acessibilidade". Apresentar o Review Lab: catálogo de PRs reais para estudar code review. | |
| 0:30-2:00 | Stopinski opera, Bruno narra | **Demo.** Cadastro e login; grade com rolagem infinita até a página 2; pull-to-refresh; botão 1/2 colunas; abrir um PR (detalhe, título no header); salvar (estrela no card e no detalhe); marcar como estudado com nota 4; busca "router" com resultado e uma sem resultado; filtros Salvos e Estudados; **fechar o app e reabrir** (sessão e listas persistem); Perfil com totais; Sair com confirmação. | RF01 a RF08 |
| 2:00-3:45 | Stopinski | **Código, parte 1.** [services/github.ts](../../src/services/github.ts) (axios, paginação pelo header `Link`, busca) e [cache.ts](../../src/services/cache.ts) (TTL, limite de 60/h); [sanitizeHtml.ts](../../src/utils/sanitizeHtml.ts) (HTML do PR vira texto, nunca executado); [AuthContext](../../src/contexts/AuthContext.tsx), [credentials.ts](../../src/services/credentials.ts) (hash com sal, secure-store) e [RootNavigator](../../src/navigation/RootNavigator.tsx). | RF03, RF07 |
| 3:45-5:30 | Bruno | **Código, parte 2.** [CatalogScreen](../../src/screens/CatalogScreen.tsx) (FlatList, `numColumns`, `onEndReached`, filtros, busca); [FavoritesContext](../../src/contexts/FavoritesContext.tsx) e [StudiedContext](../../src/contexts/StudiedContext.tsx); [usePersistedList](../../src/hooks/usePersistedList.ts) (AsyncStorage e hidratação); [useFetch](../../src/hooks/useFetch.ts) e [ErrorState](../../src/components/ErrorState.tsx); acessibilidade (role, label, state, alvo 44x44, fonte grande). | RF01, RF04 a RF06, RF08 a RF10 |
| 5:30-8:00 | Stopinski | **Explicação técnica: navegação condicional com `AuthContext`.** Por que o logout só limpa a sessão e o `RootNavigator` troca AuthStack por AppStack, em vez de `navigate('Login')`: a AppStack deixa de existir, não há tela para voltar. Mostrar a hidratação do Context: o loader segura as telas até `hydrated`, então nunca aparece Login nem lista zerada por um instante. Mostrar o teste que cobre isso. Ligar ao RF07 e ao RF06. | RF07 |
| 8:00-8:30 | os dois | Fechamento: o que ficou de fora (nuvem e auth real, bônus); VoiceOver conferido só no simulador. | |

O minuto da explicação técnica no PDF (seção 5) é **5:30**; ajustar depois da edição.

## Checklist de ensaio e gravação

- [ ] Cronometrado com a demo de 90 s: se passar, cortar a busca sem resultado.
- [ ] Cada trecho de código aberto no editor antes de gravar, na linha certa, fonte grande.
- [ ] Os dois falam e dizem o nome completo.
- [ ] Nenhum token, `.env` ou e-mail pessoal na tela.
- [ ] Vídeo final entre 6:00 e 9:00, público, link testado em janela anônima.
- [ ] Link do vídeo no PDF (seção 1) e o minuto da seção 5 conferidos.
