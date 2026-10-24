// Expo só embute EXPO_PUBLIC_* quando o acesso é literal (process.env.NOME), sem desestruturar.
const repo = process.env.EXPO_PUBLIC_GITHUB_REPO?.trim();
const token = process.env.EXPO_PUBLIC_GITHUB_TOKEN?.trim();

export const config = {
  repo: repo || 'expo/expo',
  token: token || undefined,
} as const;
