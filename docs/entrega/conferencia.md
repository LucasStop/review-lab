# Conferência final de penalidades (#55)

Feita em 29/10/2026 sobre a `main` `4a42e0d` mais os arquivos de `docs/entrega/`. Regras em [ENUNCIADO.md](../ENUNCIADO.md).

| Item | Estado | Evidência |
|---|---|---|
| Tema/API diferente do Flutter (BrasilAPI/feriados) | Ok | O app usa a API REST do GitHub; o Flutter usou BrasilAPI. |
| Nome completo de todos na capa, igual ao do vídeo | Parcial | Capa do PDF tem "Lucas Stopinski da Silva" e "Lucas Bruno e Silva"; o vídeo ainda não existe (#51). |
| Dupla registrada no grupo 10 do Canvas | Aberto | Só o Lucas e o Bruno conferem no Canvas. |
| Os 6 itens do PDF (links, tema e configuração, autoavaliação, Flutter x RN, explicação técnica com minuto, screenshots) | Ok | `docs/entrega/review-lab-entrega.pdf`, 7 páginas, aberto página a página. |
| Link do repositório abre sem login | Ok | `gh repo view` devolve visibilidade PUBLIC; conferir em janela anônima. |
| Link do vídeo no PDF | Aberto | Marcado `[PREENCHER LINK DO VÍDEO]` na seção 1, até o #51. |
| Turma na capa | Ok | Turma U, na capa do PDF. |
| Vídeo entre 6:00 e 9:00 e público | Aberto | Depende do #51; roteiro de 8:00 em [roteiro-video.md](roteiro-video.md). |
| `.env` fora do repositório e do histórico | Ok | `gitleaks detect`: 228 commits, nenhum achado; só `.env.example` foi versionado (`git log --all --diff-filter=A`); sem `ghp_` nem `github_pat_` no histórico. |
| `.env.example` só com nomes | Ok | README e [AGENTS.md](../../AGENTS.md) exigem; o arquivo é o único `.env*` versionado. |
| Declaração de uso de IA no README | Ok | Seção "Uso de IA" do README. |
| Enviado antes de 02/11 23:59, pelo campo oficial do Canvas | Aberto | #56, só com aprovação do Lucas. Comentário em vez do campo custa -30%. |
| Revogar o token fino do GitHub usado em desenvolvimento | Aberto | A linha já saiu do `.env`; o Lucas revoga o token no GitHub. |

Antes de enviar: preencher turma e link do vídeo, rodar `docs/entrega/build-pdf.sh`, abrir o PDF e conferir as 6 seções e os 2 nomes.
