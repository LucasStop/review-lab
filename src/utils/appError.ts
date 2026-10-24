export type ErrorKind =
  'network' | 'timeout' | 'rate-limit' | 'forbidden' | 'not-found' | 'server' | 'unknown';

// Só mensagem fixa e kind: nada do erro original (URL, header, token) é guardado.
export class AppError extends Error {
  kind: ErrorKind;
  resetAt?: Date;

  constructor(kind: ErrorKind, message: string, resetAt?: Date) {
    super(message);
    this.name = 'AppError';
    this.kind = kind;
    this.resetAt = resetAt;
  }
}

type Failure = {
  code?: string;
  request?: unknown;
  response?: { status?: number; headers?: Record<string, unknown> };
};

const pad = (n: number) => String(n).padStart(2, '0');

function rateLimit(headers: Record<string, unknown> = {}): AppError {
  const reset = Number(headers['x-ratelimit-reset']);
  if (!Number.isFinite(reset) || reset <= 0) {
    return new AppError(
      'rate-limit',
      'Limite de requisições do GitHub atingido. Tente em alguns minutos.',
    );
  }
  const resetAt = new Date(reset * 1000);
  const time = `${pad(resetAt.getHours())}:${pad(resetAt.getMinutes())}`;
  return new AppError(
    'rate-limit',
    `Limite de requisições do GitHub atingido. Volta às ${time}.`,
    resetAt,
  );
}

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  if (typeof error !== 'object' || error === null) {
    return new AppError('unknown', 'Algo deu errado. Tente novamente.');
  }

  const { code, request, response } = error as Failure;

  if (response?.status === undefined) {
    if (code === 'ECONNABORTED' || code === 'ETIMEDOUT') {
      return new AppError('timeout', 'A requisição demorou demais. Tente novamente.');
    }
    if (request !== undefined || code === 'ERR_NETWORK') {
      return new AppError('network', 'Sem conexão. Verifique a internet e tente novamente.');
    }
    return new AppError('unknown', 'Algo deu errado. Tente novamente.');
  }

  const { status, headers } = response;
  if (status === 429 || (status === 403 && String(headers?.['x-ratelimit-remaining']) === '0')) {
    return rateLimit(headers);
  }
  if (status === 403 || status === 401) {
    return new AppError('forbidden', 'O GitHub recusou o acesso a este conteúdo.');
  }
  if (status === 404) return new AppError('not-found', 'Conteúdo não encontrado.');
  if (status >= 500) {
    return new AppError('server', 'O GitHub está com problemas. Tente novamente mais tarde.');
  }
  return new AppError('unknown', 'Algo deu errado. Tente novamente.');
}
