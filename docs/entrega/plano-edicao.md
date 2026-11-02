# Plano de edição do vídeo (#51)

Entrada: as gravações feitas a partir do [roteiro](roteiro-video.md). Saída: um MP4 de **6:00 a 9:00** (meta 8:00), público no YouTube. Fora da janela custa -5% por minuto, então o alvo é 7:45 a 8:15 e nunca encostar em 9:00.

## Material gravado (separar em arquivos)

Os brutos ficam em `docs/entrega/video-bruto/` (o git ignora a pasta; os arquivos são pesados). As telas e o código já estão gravados, sem voz. Falta só a voz.

| Arquivo | Conteúdo | Bruto | Fala prevista | Quem |
|---|---|---|---|---|
| `01-abertura` | Apresentação com nome completo e o que fez; usar o início da demo ou do código como fundo | a gravar | 30 s | os dois |
| `02-demo-tela.mp4` | Tela do simulador na ordem da demo, sem voz | 210 s | 90 s | Stopinski opera, Bruno narra |
| `03-codigo-stopinski.mp4` | Editor com `services/`, `sanitizeHtml`, `AuthContext`, `credentials`, `RootNavigator` | 199 s | 105 s | Stopinski |
| `04-codigo-bruno.mp4` | Editor com `CatalogScreen`, Contexts, `usePersistedList`, `useFetch` | 200 s | 105 s | Bruno |
| `06-acessibilidade.mp4` | `CatalogScreen` (role, label, state) e `RootNavigator.test.tsx` (só o loader); entra no fim do bloco do Bruno | 35 s | 20 s | Bruno |
| `05-tecnico.mp4` | `AuthContext` + hidratação, com o teste na tela | 169 s | 150 s | Stopinski |
| `07-fechamento` | O que ficou de fora; usar o último quadro ou um trecho do código como fundo | a gravar | 30 s | os dois |

Gravar só a voz de cada bloco em tomada separada, com 2 s de silêncio no começo e no fim, lendo [falas.md](falas.md) olhando o vídeo do bloco. Fone com microfone, mesma sala, sem eco. Os brutos têm 1080p ou mais (a demo é 1206x2622, vertical).

## Ordem na linha do tempo e orçamento

Os brutos somam 13:33, contra a meta de 8:00. A duração de cada bloco é a da voz; o vídeo é cortado para caber nela, nunca a voz acelerada.

| Alvo | Bloco | Corte |
|---|---|---|
| 0:00-0:30 | abertura | cada nome completo aparece como legenda ("Lucas Stopinski da Silva", "Lucas Bruno e Silva") |
| 0:30-2:00 | demo (210 s para 90 s) | cortar esperas e acelerar só carregamentos e digitação, nunca a rolagem infinita nem o fechar e reabrir |
| 2:00-3:45 | código Stopinski (199 s para 105 s) | título de cada arquivo em legenda, com o RF ao lado |
| 3:45-5:30 | código Bruno e acessibilidade (235 s para 105 s) | idem; a acessibilidade entra por último, perto do minuto 5:10 |
| 5:30-8:00 | explicação técnica (169 s para 150 s) | o teste de hidratação em tela dividida com o trecho do `RootNavigator` |
| 8:00-8:30 | fechamento | |

Se a soma passar de 8:30: cortar pausas e "é...", depois reduzir o código de acessibilidade. A busca sem resultado já ficou fora das falas e da demo. Se ficar abaixo de 7:00: a demo já tem folga para segurar mais tempo nos trechos que a voz pede.

## Edição, passo a passo

1. Importar tudo no editor (DaVinci Resolve, iMovie ou CapCut, o que os dois já usam). Projeto 1080p, 30 fps.
2. Montar a ordem acima e cortar silêncio e erros. Manter cortes secos; sem transições chamativas.
3. Normalizar o áudio das duas vozes para o mesmo volume; tirar ruído de fundo.
4. Acelerar só trechos de espera. Deixar a rolagem infinita, o refresh e o reabrir o app em tempo real.
5. Legendas curtas: nome na abertura, arquivo e RF no trecho de código, **minuto 5:30 marcado** na explicação técnica.
6. Conferir que não aparece token, `.env`, e-mail pessoal, notificação ou aba pessoal do navegador. **Borrar a engrenagem azul do Expo Go**, no canto inferior esquerdo da demo inteira (ou recortar a borda). Só o e-mail `revisor@exemplo.com` pode aparecer.
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
