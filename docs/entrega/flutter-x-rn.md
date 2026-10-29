# Flutter x React Native

Mesmo tipo de app nos dois projetos: lista paginada, detalhe, estado global e persistência. O que mudou ao trocar de Flutter para React Native, com exemplos do Review Lab:

**Provider x Context.** No Flutter o `ChangeNotifierProvider` expõe um objeto que notifica quem escuta. No RN o `createContext` + `Provider` + um hook faz o mesmo, mas o estado vive em `useState`/`useMemo` dentro do Provider e cada mudança renderiza de novo os consumidores. Em [FavoritesContext.tsx](../../src/contexts/FavoritesContext.tsx) o hook `useFavorites()` lança erro fora do Provider, o que o Flutter faz com o `context.read` sem Provider. O custo é que o `value` precisa de `useMemo`, senão todo consumidor renderiza sem necessidade.

**GridView x FlatList.** O `GridView.builder` do Flutter vira a `FlatList` com `numColumns`. Ela também só monta o que está na tela. Duas diferenças que apareceram: o `keyExtractor` precisa devolver uma chave estável, senão a lista remonta os itens (usamos o número do PR), e trocar `numColumns` na mesma lista lança erro, então o botão de 1 ou 2 colunas muda a `key` da lista em [CatalogScreen.tsx](../../src/screens/CatalogScreen.tsx). A rolagem infinita e o pull-to-refresh vêm como props (`onEndReached`, `refreshing`), sem `ScrollController`.

**FutureBuilder x useEffect/useState.** O `FutureBuilder` junta a requisição e os três estados num widget. No RN não há equivalente pronto: escrevemos o hook [useFetch](../../src/hooks/useFetch.ts), que devolve `loading | data | error` e um `retry`, e cancela com `AbortController` quando a tela sai. É mais código, mas fica reutilizável e testável sozinho.

**Hot reload x Fast Refresh / Expo Go.** O hot reload do Flutter preserva o estado ao recompilar. O Fast Refresh do RN faz parecido: edita o componente e mantém o estado, mas recarrega o arquivo inteiro, perdendo o estado, quando ele exporta algo além de componentes. O Expo Go dispensa Xcode e Android Studio para rodar no aparelho, mas só acessa módulos nativos que ele já traz, e é o que impôs o expo-secure-store e o AsyncStorage em vez de bibliotecas nativas avulsas.
