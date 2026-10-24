// Tokens do design system (docs/design/DESIGN-SYSTEM.md). Sem import nativo: o teste de
// contraste roda no node:test.

export const colors = {
  background: '#ffffff',
  surface: '#f3f4f6',
  text: '#111827',
  textMuted: '#4b5563',
  primary: '#1f2937',
  onPrimary: '#ffffff',
  link: '#1d4ed8',
  danger: '#b91c1c',
  dangerSurface: '#fef2f2',
  star: '#b45309',
  border: '#6b7280',
} as const;

// Todo par texto/fundo que aparece em tela. O teste exige 4.5:1 de cada um (WCAG AA).
export const textPairs = [
  ['text', 'background'],
  ['text', 'surface'],
  ['textMuted', 'background'],
  ['textMuted', 'surface'],
  ['onPrimary', 'primary'],
  ['link', 'background'],
  ['danger', 'dangerSurface'],
  ['star', 'background'],
] as const satisfies readonly (readonly [keyof typeof colors, keyof typeof colors])[];

// Escala de 4.
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radius = { sm: 4, md: 8, lg: 12, pill: 999 } as const;

// Sem lineHeight fixo em texto de conteúdo e sem allowFontScaling={false}: o RF10 pede que a
// fonte ampliada do sistema não corte nada.
export const typography = {
  title: { fontSize: 22, fontWeight: '700' },
  heading: { fontSize: 18, fontWeight: '600' },
  body: { fontSize: 16, fontWeight: '400' },
  caption: { fontSize: 14, fontWeight: '400' },
  button: { fontSize: 16, fontWeight: '600' },
} as const;

export const touch = { min: 44 } as const;
