# Entrega: roteiro do vídeo e esqueleto do PDF

Regras de [ENUNCIADO.md](ENUNCIADO.md). Prazo: 02/11/2026 23:59 (trava 09/11 23:59). Enviar pelo campo oficial de submissão, nunca por comentário (-30%). Nada é submetido sem aprovação explícita do Lucas.

## Vídeo (YouTube, público, 6 a 9 min; meta 8:00)

Os dois integrantes (Lucas Stopinski e Lucas Bruno e Silva) aparecem e falam; ~1:45 por pessoa no bloco de código. Menos de 6 ou mais de 9 min custa -5% por minuto.

| Janela | Conteúdo | RF mostrado |
|---|---|---|
| 0:00-0:30 | Lucas Stopinski da Silva e Lucas Bruno e Silva dizem o nome completo, igual ao da capa | |
| 0:30-2:00 | Demo: cadastro, login, grade com rolagem infinita, pull-to-refresh, detalhe, salvar, marcar estudado com nota, busca com e sem resultado, filtros Salvos e Estudados no Catálogo, fechar e reabrir o app (sessão e dados persistem), Perfil com os totais e Sair com confirmação | RF01 a RF08 |
| 2:00-5:30 | Código por pessoa, cada um ligando o trecho ao RF: `services/github.ts` e `hooks/` (RF01, RF03), `navigation/` (RF02, RF07), `contexts/` (RF04, RF06), `screens/Catalog` com busca e filtros (RF05, RF08), `components/` e acessibilidade (RF09, RF10) | |
| 5:30-8:00 | Explicação técnica (tema abaixo) ligada ao código | |
| 8:00-8:30 | Fechamento e o que ficou de fora | |

Tema sugerido da explicação técnica: **navegação condicional com `AuthContext`** (por que o logout limpa a sessão em vez de `navigate('Login')`), com a hidratação do Context como gancho. Alternativa: tratamento de falha de rede/rate limit na rolagem infinita, que é o ponto mais original do app. Decidir em grupo.

Roteiro de gravação: ensaiar com cronômetro, gravar a demo antes com o cache quente para não gastar o limite de 60 req/h, conferir a duração final antes de publicar, deixar o vídeo público.

## Esqueleto do PDF (um arquivo)

Todo item abaixo ausente custa -20%.

1. **Capa**: disciplina (Desenvolvimento Mobile Híbrido), turma, data de entrega, nome do projeto (Review Lab) e tema, **nome completo de todos os integrantes** (quem faltar leva zero).
2. **Seção 1, links**: repositório GitHub **público** (README com `npx expo start`; o `yarn start` do README é equivalente) e vídeo YouTube **público**. O repositório é público desde antes de 29/10/2026; conferir em janela anônima antes de enviar (#54, #55).
3. **Seção 2, tema e configuração**: tema (catálogo de PRs para estudar code review) e API (GitHub REST); persistência Local (AsyncStorage); login Local (hash + expo-secure-store), ou o serviço de nuvem se houver bônus.
4. **Seção 3, autoavaliação**: tabela RF | Sim/Não/Parcial | arquivo principal, de RF01 a RF10.
5. **Seção 4, Flutter x React Native**: meia página sobre Provider x Context, GridView x FlatList, FutureBuilder x useEffect/useState, hot reload x Fast Refresh/Expo Go.
6. **Seção 5, explicação técnica**: tema escolhido e o minuto do vídeo.
7. **Seção 6, screenshots**: login, catálogo, detalhes, busca, favoritos, consumidos.

## Conferência de penalidades (antes de enviar)

- [ ] Tema/API diferente do Flutter (BrasilAPI/feriados).
- [ ] Todos os nomes na capa, iguais aos do vídeo.
- [ ] Dupla registrada no grupo 10 do Canvas (Lucas Stopinski da Silva e Lucas Bruno e Silva).
- [ ] Os 6 itens do PDF presentes, links abrindo em janela anônima.
- [ ] Vídeo entre 6:00 e 9:00 e público.
- [ ] Enviado antes de 02/11 23:59 pelo campo oficial.
- [ ] `.env` fora do repositório e do histórico; `.env.example` só com nomes.
- [ ] Declaração de uso de IA no README.
