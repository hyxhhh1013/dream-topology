import { HTTPException } from 'hono/http-exception';

export class AppError extends HTTPException {
  public readonly code: string;

  constructor(status: number, message: string, code?: string) {
    super(status as any, { message });
    this.code = code || 'ERROR';
    this.name = 'AppError';
  }
}

export class AuthError extends AppError {
  constructor(message = 'Authentication required') {
    super(401, message, 'AUTH_REQUIRED');
    this.name = 'AuthError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(403, message, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(404, message, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends AppError {
  public readonly details?: unknown;

  constructor(message = 'Validation failed', details?: unknown) {
    super(400, message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
    this.details = details;
  }
}

export class AIError extends AppError {
  constructor(message = 'AI service error', code = 'AI_ERROR') {
    super(502, message, code);
    this.name = 'AIError';
  }
}
