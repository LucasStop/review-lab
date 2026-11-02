# Autoavaliação RF01 a RF10

Estado verificado em 28/10/2026 no simulador iPhone 17 (iOS 26.5, Expo Go), `main` `4a42e0d`. Evidência: [MAPA.md](../MAPA.md), [TESTES.md](../TESTES.md) e os prints de [execucoes/](../execucoes/).

| RF | Implementado | Arquivo principal | Observação |
|---|---|---|---|
| RF01 Catálogo | Sim | [src/screens/CatalogScreen.tsx](../../src/screens/CatalogScreen.tsx) | `FlatList` com `numColumns` (2 colunas, botão para 1), `PullRequestCard` com avatar do autor e placeholder, `onEndReached`, pull-to-refresh e `keyExtractor` pelo número do PR. |
| RF02 Navegação | Sim | [src/navigation/AppStack.tsx](../../src/navigation/AppStack.tsx) | native-stack; o detalhe recebe o número em `route.params` e define o título com `navigation.setOptions`. |
| RF03 Detalhes | Sim | [src/screens/DetailScreen.tsx](../../src/screens/DetailScreen.tsx) | Segunda requisição com axios; `body_html` convertido em blocos de texto sem tags ([src/utils/sanitizeHtml.ts](../../src/utils/sanitizeHtml.ts)). A imagem é o avatar do autor, porque PR não tem imagem. |
| RF04 Favoritos (Context) | Sim | [src/contexts/FavoritesContext.tsx](../../src/contexts/FavoritesContext.tsx) | `createContext` + Provider + `useFavorites()`; a estrela do card e o botão do detalhe usam o mesmo estado. |
| RF05 Tela de Favoritos | Parcial | [src/screens/CatalogScreen.tsx](../../src/screens/CatalogScreen.tsx) | Em vez de tela própria, o filtro "Salvos" fica na tela principal, atualiza ao desfavoritar e tem estado vazio ([src/components/EmptyState.tsx](../../src/components/EmptyState.tsx)). |
| RF06 Persistência | Sim | [src/hooks/usePersistedList.ts](../../src/hooks/usePersistedList.ts) | AsyncStorage por usuário; carga num `useEffect` e um portão no [RootNavigator](../../src/navigation/RootNavigator.tsx) segura as telas até hidratar, sem lista zerada. Sem bônus de nuvem. |
| RF07 Login, sessão e consumidos | Sim | [src/contexts/AuthContext.tsx](../../src/contexts/AuthContext.tsx) | Login local: hash SHA-256 com sal ([src/services/credentials.ts](../../src/services/credentials.ts)) e sessão em expo-secure-store; navegação condicional; logout. "Consumidos" são os PRs "Estudados" com nota de 1 a 5 ([src/contexts/StudiedContext.tsx](../../src/contexts/StudiedContext.tsx)), listados pelo filtro "Estudados" e pelo Perfil. Sem bônus de auth real. |
| RF08 Busca | Sim | [src/screens/CatalogScreen.tsx](../../src/screens/CatalogScreen.tsx) | `TextInput` controlado e botão "Buscar" chamam `/search/issues` ([src/services/github.ts](../../src/services/github.ts)); tocar abre o detalhe; mensagem "Nenhum resultado para" o termo. |
| RF09 Feedback de UI | Sim | [src/hooks/useFetch.ts](../../src/hooks/useFetch.ts) | `loading | data | error` explícitos, `ActivityIndicator`, rodapé da página seguinte e [ErrorState](../../src/components/ErrorState.tsx) com "Tentar novamente"; conferido sem rede e com o limite da API esgotado. O loader em rede lenta só tem teste automatizado. |
| RF10 Acessibilidade | Sim | [src/components/Button.tsx](../../src/components/Button.tsx) | `accessibilityRole`, `accessibilityLabel` e `accessibilityState` nos tocáveis, alvos de 44x44, fonte do sistema ampliada sem desligar `allowFontScaling`, contraste testado em [src/theme/index.ts](../../src/theme/index.ts). VoiceOver conferido no simulador, não em aparelho físico. |

Código e organização: pastas `services/`, `contexts/`, `hooks/`, `components/`, `screens/`, TypeScript, 114 testes de lógica e 174 de componente, suíte E2E com Maestro (9 de 9) e CI no GitHub. Sem segredos no repositório.
