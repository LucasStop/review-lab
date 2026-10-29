# Plano de edição do vídeo (#51)

Entrada: as gravações feitas a partir do [roteiro](roteiro-video.md). Saída: um MP4 de **6:00 a 9:00** (meta 8:00), público no YouTube. Fora da janela custa -5% por minuto, então o alvo é 7:45 a 8:15 e nunca encostar em 9:00.

## Material a gravar (separar em arquivos)

| Arquivo | Conteúdo | Quem |
|---|---|---|
| `01-abertura` | Apresentação com nome completo e o que fez | os dois |
| `02-demo-tela` | Tela do simulador na ordem da demo, sem voz | Stopinski opera |
| `02-demo-voz` | Narração da demo (ou gravar junto) | Bruno |
| `03-codigo-stopinski` | Editor com `services/`, `sanitizeHtml`, `AuthContext`, `credentials` | Stopinski |
| `04-codigo-bruno` | Editor com `CatalogScreen`, Contexts, `usePersistedList`, `useFetch`, acessibilidade | Bruno |
| `05-tecnico` | Explicação de `AuthContext` + hidratação, com o teste na tela | Stopinski |
| `06-fechamento` | O que ficou de fora | os dois |

Gravar cada bloco em tomada separada, com 2 s de silêncio no começo e no fim. Gravar a tela em 1080p ou mais e o áudio com fone com microfone, na mesma sala, sem eco.

## Ordem na linha do tempo e orçamento

| Alvo | Bloco | Corte |
|---|---|---|
| 0:00-0:30 | abertura | cada nome completo aparece como legenda ("Lucas Stopinski da Silva", "Lucas Bruno e Silva") |
| 0:30-2:00 | demo | acelerar 1,5x só carregamentos e digitação, nunca a rolagem infinita nem o fechar e reabrir |
| 2:00-3:45 | código Stopinski | título de cada arquivo em legenda, com o RF ao lado |
| 3:45-5:30 | código Bruno | idem |
| 5:30-8:00 | explicação técnica | o teste de hidratação em tela dividida com o trecho do `RootNavigator` |
| 8:00-8:30 | fechamento | |

Se a soma passar de 8:30: cortar primeiro a busca sem resultado, depois pausas e "é...", por último reduzir o código de acessibilidade. Se ficar abaixo de 7:00: acrescentar o teste de rede (modo avião) na demo.

## Edição, passo a passo

1. Importar tudo no editor (DaVinci Resolve, iMovie ou CapCut, o que os dois já usam). Projeto 1080p, 30 fps.
2. Montar a ordem acima e cortar silêncio e erros. Manter cortes secos; sem transições chamativas.
3. Normalizar o áudio das duas vozes para o mesmo volume; tirar ruído de fundo.
4. Acelerar só trechos de espera. Deixar a rolagem infinita, o refresh e o reabrir o app em tempo real.
5. Legendas curtas: nome na abertura, arquivo e RF no trecho de código, **minuto 5:30 marcado** na explicação técnica.
6. Conferir que não aparece token, `.env`, e-mail pessoal, notificação ou aba pessoal do navegador. Borrar se aparecer.
7. Exportar MP4 H.264, 1080p. **Ler a duração do arquivo exportado**, não a da linha do tempo.

## Publicação

1. YouTube, visibilidade **Pública** (não "Não listado").
2. Título: "Review Lab: Somativo 2 Mobile Híbrido (grupo 10, turma U)". Descrição com o link do repositório.
3. Abrir o link em janela anônima, confirmar a duração entre 6:00 e 9:00 e que o áudio sai nos dois.
4. Anotar o **minuto real da explicação técnica** (alvo 5:30).

## Depois da publicação

- No `docs/entrega/build-pdf.sh`: trocar `[PREENCHER LINK DO VÍDEO]` pelo link e `5:30` pelo minuto real; rodar o script e abrir o PDF.
- Atualizar o item de vídeo em [conferencia.md](conferencia.md).
- Só então o Lucas aprova e envia o PDF pelo campo oficial do Canvas (#56), antes de 02/11 às 23:59.
