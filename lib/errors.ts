export class AuthError extends Error {
  constructor(public code: 'UNAUTHORIZED' | 'FORBIDDEN', message?: string) {
    super(message ?? code);
    this.name = 'AuthError';
  }
}

export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError;
}
