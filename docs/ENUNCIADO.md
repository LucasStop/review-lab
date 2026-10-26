# Enunciado: Somativo 2, Catálogo Interativo 2.0 (React Native)

Fonte: Canvas, curso 71190, assignment 365836, lido em 19/10/2026. Disciplina Desenvolvimento Mobile Híbrido (BSI), professor Mark Joselli. Vale 10 pontos e 50% da nota final. Upload de um único PDF pelo campo oficial. Grupo de até 4, um posta. Vence 02/11/2026 23:59; disponível até 09/11/2026 23:59.

Este arquivo parafraseia o enunciado. Em dúvida, vale o Canvas.

## Regra do tema

Tema livre, API pública gratuita com lista paginada, busca e detalhe. Não pode repetir tema ou API do Somativo de Flutter (BrasilAPI/feriados, "Prazo Certo"). A lista de sugestões do enunciado inclui Rick and Morty, mas isso não vale para quem já usou no Flutter; este grupo não usou, então "Review Lab" (GitHub REST) está livre.

## Requisitos funcionais

| RF | Peso | Resumo |
|---|---|---|
| RF01 Catálogo | 15% | Após o login, `FlatList` em grade (`numColumns`) com imagem e título num componente próprio (`ItemCard`, via props). Rolagem infinita (`onEndReached` + `onEndReachedThreshold`) anexando a próxima página. Pull-to-refresh (`refreshing` + `onRefresh`) recarrega a página 1. Placeholder para item sem imagem. `keyExtractor` único e estável. |
| RF02 Navegação | 10% (junto com RF03) | `@react-navigation/native-stack`. Tocar no item navega ao detalhe passando o id em `route.params`. Título do header definido com `navigation.setOptions`. |
| RF03 Detalhes | 10% (junto com RF02) | Segunda requisição (axios) pelo id. Imagem maior e atributos principais. HTML da API exibido limpo, sem tags. |
| RF04 Favoritos (Context) | 15% (junto com RF05) | Botão favoritar/desfavoritar no detalhe. Estado global com `createContext` + Provider + hook (`useFavorites()`). O ícone no card do catálogo reflete o mesmo estado. |
| RF05 Tela de Favoritos | 15% (junto com RF04) | Acessível pela tela principal, lista os favoritos do Context, atualiza ao desfavoritar. Estado vazio amigável (`ListEmptyComponent`). |
| RF06 Persistência | 10% | Favoritos e consumidos sobrevivem ao reinício. AsyncStorage ou expo-sqlite. Carga inicial num `useEffect`, sem mostrar dado "zerado" enquanto carrega. Bônus de nuvem (+10%): Firebase, Supabase ou API própria. |
| RF07 Login, sessão e consumidos | 10% | Login obrigatório, navegação condicional (Stack de auth ou do app conforme o `AuthContext`). Sessão persiste, botão de logout. No detalhe, marcar como "consumido" com nota de 1 a 5; tela própria ou aba lista os consumidos com nota. Login local: senha nunca em texto puro (expo-secure-store ou, no mínimo, hash). Bônus de auth real (+10%, exige a nuvem do RF06): Firebase Auth ou Supabase Auth. |
| RF08 Busca | 10% | `TextInput` controlado (`value` + `onChangeText`) e botão "Buscar" chamam o endpoint de busca. Resultados numa lista; tocar abre o detalhe (não navega direto ao primeiro). Mensagem clara quando não há resultado. |
| RF09 Feedback de UI | 10% | `ActivityIndicator` em carga inicial, próxima página (`ListFooterComponent`), busca, detalhe e login. Falha de rede/API mostra erro amigável com "Tentar novamente". loading/error/data tratados explicitamente (ex.: `useFetch`). |
| RF10 Acessibilidade | 10% | `accessible`, `accessibilityLabel`, `accessibilityRole` em imagens e tocáveis. Botões de estado informam o estado (`accessibilityState={{ selected }}` ou label que muda). Contraste adequado. Layout não quebra com fonte do sistema aumentada (sem desligar `allowFontScaling`, sem altura fixa que corte texto). Toque mínimo ~44x44 pt (`hitSlop` em ícone pequeno). |

Código e organização: 5%. UI/UX: 5%. RF01 a RF10 somam 90%, total 100%. Bônus somado à nota, limitado a 100%: +10% nuvem, +10% auth real.

Qualidade do código pede componentes reutilizáveis, hooks customizados, pastas `services/`, `contexts/`, `hooks/`, `components/`, `screens/` e nenhum segredo no repositório. TypeScript não é obrigatório, mas conta para qualidade.

## Ferramentas

Obrigatórios: `axios`, `@react-navigation/native` + `@react-navigation/native-stack`, e `@react-native-async-storage/async-storage` ou `expo-sqlite`. Opcionais: `@react-navigation/bottom-tabs`, `expo-secure-store`, `@expo/vector-icons`. Bônus: `firebase` ou `@supabase/supabase-js`. Chaves em `.env` com `EXPO_PUBLIC_`, nunca commitadas. Testes não são exigidos.

## PDF de entrega (um arquivo)

- Capa: disciplina, turma, data de entrega, nome do projeto e tema, nome completo de todos os integrantes.
- Seção 1, links: repositório GitHub público com README (`npx expo start`) e vídeo no YouTube público.
- Seção 2, tema e configuração: tema e API; persistência (local ou nuvem, qual serviço); login (local ou real, qual serviço).
- Seção 3, autoavaliação RF01 a RF10: tabela RF | Implementado (Sim/Não/Parcial) | caminho do arquivo principal.
- Seção 4, Flutter x React Native: meia página (Provider x Context, GridView x FlatList, FutureBuilder x useEffect/useState, hot reload x Fast Refresh/Expo Go).
- Seção 5, tema da explicação técnica e o minuto do vídeo em que aparece.
- Seção 6, screenshots: login, catálogo, detalhes, busca, favoritos, consumidos.

## Vídeo (YouTube, público, 6 a 9 min)

Todos aparecem e falam, cada um explicando ao menos uma parte que implementou; todos se apresentam com nome completo igual ao da capa. Não há defesa individual nem apresentação ao vivo no enunciado. Roteiro cronometrado:

| Janela | Conteúdo |
|---|---|
| 0:00-0:30 | Cada integrante diz o nome completo. |
| 0:30-2:00 | Demonstração: login, catálogo com rolagem infinita, busca, detalhes, favoritos, consumidos, reabrir o app mostrando a persistência. |
| 2:00-5:30 | Cada integrante explica seu trecho ligado ao RF (~50 s por pessoa em grupo de 4). |
| 5:30-8:00 | Explicação técnica em profundidade, tema escolhido da lista do enunciado (ou combinado com o professor). |

## Penalidades

| Falta | Desconto |
|---|---|
| Entrega por comentário em vez do campo oficial | -30% da nota final |
| Item ausente no PDF (links, seções, tabela, screenshots) | -20% por item |
| Atraso após 02/11 | -20% por semana ou fração |
| Nome faltando na capa | nota zero para a pessoa, mesmo aparecendo no vídeo |
| Mesmo tema/API do Flutter | -20% |
| Vídeo fora de 6 a 9 min | -5% por minuto fora |

## Pontos de atenção para este projeto

- RF01 exige imagem no card: PR não tem imagem, então o card usa o avatar do autor (`user.avatar_url`) com placeholder.
- RF01 pede grade com `numColumns`. Em 26/10/2026 o professor aprovou um botão que alterna o Catálogo entre 1 e 2 colunas (padrão 2): a grade continua atendida e o aluno escolhe a leitura. Issue #140, cenário C66.
- RF03 pede HTML "sem tags": `body_html` é convertido em texto/blocos simples e sanitizado, ver [adr/0001-html-do-pr.md](adr/0001-html-do-pr.md).
- RF07 mistura login e consumidos; RF06 cobre favoritos e consumidos. A divisão por categoria está no [AGENTS.md](../AGENTS.md).
