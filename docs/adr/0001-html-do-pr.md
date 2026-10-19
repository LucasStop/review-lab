# ADR 0001: HTML da descrição do PR

Status: aceito (19/10/2026)

## Contexto

RF03 exige HTML da API exibido limpo, sem tags. O GitHub entrega `body_html` com `Accept: application/vnd.github.html+json`, texto de terceiros e não confiável. React Native não renderiza HTML.

## Decisão

Pedir `body_html`, passar por um sanitizador com lista de tags permitidas e renderizar blocos tipados com componentes `Text`. Sem `WebView`, sem `dangerouslySetInnerHTML`. Tag fora da lista, atributo, `on*`, `script`, `style`, `iframe` e imagens do corpo são descartados; links só `http(s)`.

## Alternativas

- Remover tags com regex: frágil e perde listas e código.
- `react-native-render-html` ou `WebView`: dependência pesada e superfície de ataque maior.
- Pedir o markdown cru e renderizar: o markdown do GitHub tem extensões; `body_html` já vem resolvido.

## Consequências

Parser próprio pequeno (ou `htmlparser2`, a decidir na issue após checar versão, licença e `yarn audit`). Teste primeiro com entradas hostis. Perde-se imagem e tabela do corpo; aceitável para o objetivo de estudo.
