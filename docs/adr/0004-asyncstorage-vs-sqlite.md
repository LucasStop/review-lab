# ADR 0004: AsyncStorage ou expo-sqlite

Status: aceito (19/10/2026)

## Contexto

RF06 exige persistência local de favoritos e consumidos; o Canvas aceita AsyncStorage ou expo-sqlite.

## Decisão

AsyncStorage. Os dados são pequenos (dezenas de PRs salvos, notas), chave-valor por usuário (`rl.<userId>.favorites`, `rl.<userId>.studied`) e o cache HTTP. Carga num `useEffect` inicial com flag `hydrated`. Segredos (credencial, sessão) vão para expo-secure-store, não para AsyncStorage.

## Alternativas

- expo-sqlite: ganha em consulta, índice e volume, mas pede esquema, migração e mais código para dado que cabe num JSON.

## Consequências

Sem consulta relacional: filtrar estudados por nota é em memória. Se o volume crescer ou o bônus de nuvem exigir sincronização incremental, reavaliar. O valor lido é validado ao carregar (JSON corrompido vira lista vazia, sem travar o app).
