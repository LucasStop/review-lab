# Falas do vídeo

Texto para ler ou adaptar, na ordem do [roteiro](roteiro-video.md). Ritmo de fala: cerca de 150 palavras por minuto; o tempo ao lado de cada bloco é a estimativa. Falar com as próprias palavras vale mais que decorar; o que não pode mudar são os **nomes completos**, os **arquivos citados** e a **frase do tema técnico**.

## 0:00-0:30 Abertura (os dois)

**Stopinski:** Olá. Eu sou o Lucas Stopinski da Silva, e este é o Review Lab, o nosso Somativo 2 de Desenvolvimento Mobile Híbrido, turma U, grupo 10. Eu fiz a parte de dados, login e entrega.

**Bruno:** E eu sou o Lucas Bruno e Silva. Fiz as telas, o estado e a acessibilidade.

**Stopinski:** O Review Lab é um catálogo de pull requests reais de projetos open source, feito para estudar code review. Os dados vêm da API REST do GitHub. Vamos mostrar o app funcionando e depois o código.

## 0:30-2:00 Demo (Stopinski opera, Bruno narra)

**Bruno:** Primeiro o cadastro e o login. A senha fica guardada só como hash. Entrando, a grade carrega os pull requests. Rolando até o fim, ela busca a página 2 sozinha, é a rolagem infinita. Puxando para baixo, o pull-to-refresh recarrega a lista.

Este botão alterna entre uma e duas colunas. Abrindo um pull request, o detalhe mostra a descrição já limpa, sem HTML solto, e o título aparece no header.

Aqui eu salvo para estudar, com a estrela, tanto no card quanto no detalhe. Depois marco como estudado e dou nota 4. A busca por "router" traz resultados. Os filtros Salvos e Estudados mostram só as nossas listas.

Agora o teste que importa: vou fechar o app e abrir de novo. A sessão e as listas continuam ali. No Perfil estão os totais, e o Sair pede confirmação antes de encerrar.

> Se passar de 8:30 no total: cortar a busca sem resultado (não está neste texto de propósito).

## 2:00-3:45 Código, parte 1 (Stopinski)

Abrir cada arquivo na linha certa, fonte grande.

**Stopinski:** Começando pelos dados. Em `services/github.ts` está o cliente axios. A paginação lê o header `Link` da resposta, em vez de eu calcular o número da página, e a busca usa o endpoint de search da API.

No `cache.ts`, as respostas ficam guardadas com um tempo de validade e com o etag do GitHub: quando nada mudou, a API responde 304, que não gasta o limite. Isso importa porque, sem token, a API libera só 60 requisições por hora. Se a rede falha, a cópia vencida ainda serve de reserva.

O `sanitizeHtml.ts` trata a descrição do pull request como dado não confiável: o HTML vira texto, e nunca é executado.

Agora o login. O `AuthContext` guarda a sessão. Em `credentials.ts`, a senha passa por um hash com sal, SHA-256 repetido 2000 vezes. Em `secureCredentials.ts`, o que persiste vai para o secure-store, nunca em texto puro. E o `RootNavigator` decide qual pilha de telas aparece, conforme existe sessão ou não. Esse ponto eu explico melhor mais adiante.

## 3:45-5:30 Código, parte 2 (Bruno)

**Bruno:** Eu fiquei com as telas e o estado. A `CatalogScreen` usa uma `FlatList`, com `numColumns` para uma ou duas colunas e `onEndReached` para a rolagem infinita. Os filtros Salvos e Estudados e a busca também estão aqui.

O estado fica em dois Contexts: `FavoritesContext` e `StudiedContext`. Os dois usam o hook `usePersistedList`, que grava no AsyncStorage e lê de volta na abertura, a hidratação. É isso que faz as listas voltarem depois de fechar o app.

O `useFetch` junta o carregamento e o erro. Quando falha, o `ErrorState` mostra a mensagem com o botão "Tentar novamente". Em rede lenta, um indicador de carregamento aparece.

Por fim, a acessibilidade: os elementos têm role, label e state, os alvos de toque têm pelo menos 44 por 44, e a fonte grande do sistema não quebra o layout.

## 5:30-8:00 Explicação técnica (Stopinski)

Marcar o minuto **5:30** na edição e anotar o minuto real no PDF (seção 5).

**Stopinski:** O tema técnico é a navegação condicional com `AuthContext`.

No Flutter, o jeito comum é chamar uma navegação para a tela de login ao sair. Aqui é diferente. Quando o usuário toca em Sair, o logout só limpa a sessão no `AuthContext`. Quem decide o que aparece é o `RootNavigator`: se não há sessão, ele mostra a AuthStack; se há, mostra a AppStack. Ao limpar a sessão, a AppStack deixa de existir. Não existe tela para voltar, nem rota para esquecer de proteger. Não preciso chamar `navigate('Login')` em lugar nenhum.

Tem um detalhe que dá problema. Quando o app abre, a sessão ainda está sendo lida do secure-store. Se o `RootNavigator` decidisse nesse instante, mostraria o Login por um piscar mesmo para quem já está logado. Por isso o contexto tem o estado `hydrated`. Enquanto ele é falso, o app mostra só o loader. Só depois da leitura as telas aparecem. O mesmo vale para as listas de salvos e estudados: nunca aparece uma lista zerada por um instante.

Dois testes cobrem isso. O `RootNavigator.test.tsx` garante que, enquanto a sessão é lida, só aparece o loader, nunca o Login. Este aqui, o `RootNavigator.hydration.test.tsx`, garante o mesmo para as listas e o layout: o portão espera as duas listas e o layout antes de abrir, e Salvos e Estudados nunca mostram o vazio enquanto carregam. Se a leitura falha, o portão abre no padrão em vez de travar.

Isso liga o RF07, o login com sessão, ao RF06, a persistência: os dois dependem de ler o armazenamento antes de decidir o que mostrar.

## 8:00-8:30 Fechamento (os dois)

**Bruno:** O que ficou de fora foi o bônus de nuvem e autenticação real. O login aqui é local.

**Stopinski:** E o VoiceOver foi conferido só no simulador. O código, o roteiro e este material estão no repositório público do grupo 10.

**Os dois:** Obrigado!

## Conferir antes de gravar

- Cada afirmação sobre o código bate com o arquivo aberto na tela (principalmente cache, hash e o teste de hidratação): abrir o arquivo e ler de novo antes de falar.
- Cronometrar lendo em voz alta; ajustar o texto, não a velocidade.
- Nenhum token, `.env` ou e-mail pessoal na tela.
