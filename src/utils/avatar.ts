// Cores de fundo do avatar sem foto: todas com 4.5:1 ou mais contra o branco da inicial
// (conferido em avatar.test.ts). São ilustração, não tokens.
export const AVATAR_COLORS = [
  '#1d4ed8',
  '#047857',
  '#6d28d9',
  '#b45309',
  '#be123c',
  '#0f766e',
  '#4338ca',
  '#a21caf',
] as const;

// Mesma pessoa, mesma cor em toda tela e em toda execução.
export function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function initialOf(name: string): string {
  const first = name.trim().charAt(0);
  return first ? first.toUpperCase() : '?';
}
