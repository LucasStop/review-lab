# ADR 0003: Hash de senha e sessão

Status: aceito (19/10/2026)

## Contexto

RF07 pede login local, sessão persistente, senha fora de texto puro (expo-secure-store ou, no mínimo, hash). Não há servidor, então a segurança é a do aparelho.

## Decisão

- Cadastro gera salt aleatório (`expo-crypto`) e guarda salt e hash da senha (SHA-256 com salt, repetido N vezes) no expo-secure-store, chave `rl.cred.<SHA-256 do e-mail normalizado>` (SecureStore só aceita `A-Za-z0-9._-` em chave, e o hash evita e-mail em texto puro; o mesmo hash é o `userId`). Verificação em tempo constante; 2000 voltas de SHA-256. Senha nunca é gravada nem logada.
- Sessão é o `userId` e o e-mail normalizado, em JSON, em expo-secure-store (`rl.session`), cifrado. O e-mail serve só para o Perfil mostrar e nunca vai ao AsyncStorage nem a `rl.cred.*`, nem a log ou mensagem de erro. Sessão gravada no formato antigo (só o `userId`) continua válida, sem e-mail; valor corrompido vira "sem sessão" (#125). O `AuthContext` lê no `useEffect` inicial e expõe `hydrated`; o `RootNavigator` escolhe AuthStack ou AppStack. Logout apaga a chave de sessão.
- Dados do usuário ficam em AsyncStorage com prefixo do `userId`, ver [0004](0004-asyncstorage-vs-sqlite.md).

## Alternativas

- Só hash em AsyncStorage: atende o mínimo, mas o SecureStore custa quase nada a mais.
- PBKDF2/bcrypt/argon2: `expo-crypto` não expõe PBKDF2; biblioteca nativa nova pede checagem de versão, licença e CVE. A conferir na issue; as iterações sobre SHA-256 são o piso aceito.
- Auth real (Supabase/Firebase): bônus, `cat:nuvem-bonus`.

## Consequências

Login local não protege contra quem tem o aparelho desbloqueado; é suficiente para a rubrica e deve ser dito no PDF. Teste primeiro: hash determinístico com salt, senha errada recusada, senha nunca no storage.
