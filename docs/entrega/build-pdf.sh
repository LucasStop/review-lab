#!/bin/sh
# Monta review-lab-entrega.pdf a partir dos .md desta pasta (pandoc + Chrome headless).
set -e
cd "$(dirname "$0")"
B=https://github.com/LucasStop/review-lab/blob/main
body() { tail -n +2 "$1" | sed "s#](\.\./\.\./#]($B/#g; s#](\.\./#]($B/docs/#g"; }
{
cat <<'HEAD'
<div class="capa">
<p class="disc">Desenvolvimento Mobile Híbrido (BSI) · PUCPR · Turma: <strong>U</strong></p>
<h1>Review Lab</h1>
<p class="sub">Somativo 2, Catálogo Interativo 2.0 (React Native)<br>Catálogo de pull requests reais para estudar code review</p>
<p>Data de entrega: <strong>02/11/2026</strong></p>
<p>Integrantes (grupo 10):</p>
<ul><li>Lucas Stopinski da Silva</li><li>Lucas Bruno e Silva</li></ul>
</div>

# 1. Links

- Repositório (público): <https://github.com/LucasStop/review-lab>. O README tem como rodar: `yarn start` (equivale a `npx expo start`).
- Vídeo (YouTube, público): **[PREENCHER LINK DO VÍDEO]**

# 2. Tema e configuração

- **Tema:** Review Lab, um catálogo de pull requests reais de repositórios open source (padrão `expo/expo`) para estudar code review. Cada card é um PR; o detalhe mostra a descrição em texto limpo; o aluno salva PRs para estudar e marca os que estudou com uma nota de utilidade de 1 a 5.
- **API:** GitHub REST, somente leitura (`/repos/{o}/{r}/pulls`, detalhe com `Accept: application/vnd.github.html+json` e `/search/issues`). Sem token são 60 requisições por hora; o app usa cache e mostra o horário de volta quando o limite acaba.
- **Persistência:** local, AsyncStorage (favoritos, estudados com nota e colunas, por usuário).
- **Login:** local, com senha em hash SHA-256 com sal e sessão em expo-secure-store. Sem bônus de nuvem nem de auth real.

# 3. Autoavaliação RF01 a RF10
HEAD
body autoavaliacao.md | sed '1,2d'
echo; echo '# 4. Flutter x React Native'; echo
body flutter-x-rn.md | sed '1,2d'
cat <<'TEC'

# 5. Explicação técnica

Tema: **navegação condicional com `AuthContext`**: o `RootNavigator` escolhe a AuthStack ou a AppStack pelo estado do contexto, e o logout só limpa a sessão, sem `navigate('Login')`. Aparece no vídeo a partir de **5:30**.

# 6. Screenshots

<div class="shots">
<figure><img src="screenshots/1-login.jpg"><figcaption>Login</figcaption></figure>
<figure><img src="screenshots/2-catalogo.jpg"><figcaption>Catálogo</figcaption></figure>
<figure><img src="screenshots/3-detalhe.jpg"><figcaption>Detalhes (salvo, estudado, nota 4)</figcaption></figure>
<figure><img src="screenshots/4-busca.jpg"><figcaption>Busca</figcaption></figure>
<figure><img src="screenshots/5-favoritos.jpg"><figcaption>Favoritos (filtro Salvos)</figcaption></figure>
<figure><img src="screenshots/6-consumidos.jpg"><figcaption>Consumidos (filtro Estudados)</figcaption></figure>
</div>
TEC
} > /tmp/rl-entrega.md
cat > /tmp/rl.css <<'CSS'
body{font-family:-apple-system,Helvetica,Arial,sans-serif;font-size:10.5pt;line-height:1.4;color:#111}
h1{font-size:16pt;border-bottom:1px solid #ccc;padding-bottom:3px;break-after:avoid}
table{border-collapse:collapse;width:100%;font-size:8.5pt}td,th{border:1px solid #bbb;padding:3px 5px;vertical-align:top}
code{font-size:90%}a{color:#1d4ed8}
.capa{min-height:90vh;break-after:page}.capa h1{font-size:34pt;border:0;margin-top:30vh}.sub{font-size:13pt}
.shots{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.shots img{width:100%;border:1px solid #ccc}figcaption{font-size:8.5pt;text-align:center}figure{margin:0}
CSS
pandoc /tmp/rl-entrega.md -f markdown+raw_html -t html5 -s --metadata pagetitle="Review Lab" -c /tmp/rl.css --embed-resources --resource-path=. -o /tmp/rl-entrega.html 2>&1 | grep -v "^$" | head
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf=review-lab-entrega.pdf /tmp/rl-entrega.html 2>&1 | tail -1
