# Fluxos Maestro

E2E local no simulador iOS com o Expo Go. Fora do CI: precisa de simulador e do Metro de pé. Os fluxos cobrem os cenários de nível E2E de [docs/TESTES.md](../docs/TESTES.md).

## Preparar (uma vez)

```bash
brew tap mobile-dev-inc/tap && brew install mobile-dev-inc/tap/maestro   # precisa de Java
defaults write com.apple.iphonesimulator ConnectHardwareKeyboard -bool false
```

- O `brew install maestro` sem o tap instala outro programa (o cask "Maestro", agente de IA). Use o tap.
- Teclado de hardware ligado no simulador faz o `inputText` falhar; o comando acima desliga.
- O Expo Go do simulador tem que ser o do SDK 58 (`~/.expo/ios-simulator-app-cache/` pode ter uma versão velha). `yarn start` e `i` baixa a certa.
- O botão flutuante de ferramentas do Expo Go (a engrenagem) nasce no canto de cima, em cima do botão Perfil do header: o toque em `catalog.profile` abre o menu do Expo e o fluxo falha. Arraste a engrenagem para um canto de baixo uma vez; o Expo Go guarda a posição entre as aberturas.

## Rodar

```bash
yarn start --localhost          # Metro em localhost:8081 (a porta do painel é 3000, não confunda)
maestro test .maestro/smoke.yaml
maestro test .maestro/          # suíte inteira, antes de #52, #51 e #56
```

Com mais de um simulador ligado: `maestro --device <UDID> test ...` (`xcrun simctl list devices booted`).

## Convenções

- `appId` é `host.exp.Exponent` (Expo Go).
- O Metro escuta em IPv6; o link é `exp://localhost:8081`, nunca `127.0.0.1`.
- Seletor por `id:` com o `testID` no formato `tela.elemento` (`login.email`, `catalog.card.0`, o índice do card). Texto só quando não há `testID`.
- Na primeira abertura o Expo Go cobre o app com o menu de dev; o fluxo toca no fundo para fechar.
- Todo fluxo começa com `launchApp: stopApp: true` (`subflows/open-app.yaml`), que reinicia o app mas não limpa o estado: o AsyncStorage e o SecureStore continuam, então a sessão e os dados salvos sobrevivem entre fluxos. Por isso os fluxos partem de `subflows/session.yaml` e de e-mails novos, em vez de supor um app zerado.
- `subflows/session.yaml` abre o app e garante uma sessão: com sessão salva segue no Catálogo; no Login, cadastra um e-mail novo e guarda em `output.email`. Os fluxos que precisam de login começam por ele, e o regex de espera (`login\.screen|catalog\.profile`) fica só ali.
- `auth.yaml` e `profile.yaml` saem pelo Perfil para começar de uma conta nova; `profile.yaml` termina logado com essa conta.
