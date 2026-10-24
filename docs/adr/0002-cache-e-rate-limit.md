# ADR 0002: Cache e rate limit

Status: aceito (19/10/2026)

## Contexto

Sem token, a API do GitHub dá 60 requisições por hora por IP (medido: `x-ratelimit-limit: 60`); a busca tem limite próprio de 10 por minuto. A demo e o vídeo podem esgotar isso.

## Decisão

- Cache em AsyncStorage por URL: TTL de 10 min na lista, 1 h no detalhe; cache expirado serve de fallback se a rede ou o limite falharem.
- Requisição condicional com `ETag`/`If-None-Match`; resposta 304 economiza banda e renova a cópia. Medido em 24/10/2026: sem token o 304 ainda desconta do limite (remaining 53 para 52); a gratuidade vale só autenticado, então quem protege os 60/h sem token é o TTL.
- Interceptor axios lê `x-ratelimit-remaining` e `x-ratelimit-reset`. Com 403/429 e remaining 0, o erro vira mensagem amigável com a hora de reset.
- Token opcional em `EXPO_PUBLIC_GITHUB_TOKEN` (5.000/h), somente leitura e sem escopo, porque vai no bundle.
- Busca só pelo botão "Buscar", nunca a cada tecla.

## Alternativas

- Sem cache: estoura o limite em minutos.
- Backend proxy com token: fora do escopo e esconderia o ponto da rubrica.
- Trocar de API (dev.to): plano B se o limite inviabilizar.

## Consequências

Dados podem ficar até 10 min velhos; pull-to-refresh ignora o TTL da lista. O cache ocupa AsyncStorage, então precisa de limite de tamanho (issue de dados).
