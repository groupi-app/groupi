// Common error classes for the entire application
// These provide better type safety and semantic meaning than generic Error objects

import { ZodError, ZodIssue } from 'zod';

export class AuthenticationError extends Error {
  readonly _tag = 'AuthenticationError';
  constructor() {
    super('User not authenticated');
  }
}

export class AuthorizationError extends Error {
  readonly _tag = 'AuthorizationError';
  constructor(message: string = 'Access denied') {
    super(message);
  }
}

export class ValidationError extends Error {
  readonly _tag = 'ValidationError';
  constructor(message: string) {
    super(message);
  }
}

export class ZodValidationError extends Error {
  readonly _tag = 'ZodValidationError';
  readonly issues: ZodIssue[];
  readonly formattedErrors: Record<string, string[]>;

  constructor(zodError: ZodError) {
    const message = `Validation failed: ${zodError.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')}`;

    super(message);
    this.issues = zodError.issues;
    this.formattedErrors = zodError.format() as Record<string, string[]>;
  }

  // Helper methods for easy error handling
  getFieldErrors(field: string): string[] {
    return this.issues
      .filter(issue => issue.path.join('.') === field)
      .map(issue => issue.message);
  }

  hasFieldError(field: string): boolean {
    return this.issues.some(issue => issue.path.join('.') === field);
  }

  getFirstError(): string | null {
    return this.issues[0]?.message || null;
  }
}

export class NotFoundError extends Error {
  readonly _tag = 'NotFoundError';
  constructor(resource: string, id: string) {
    super(`${resource} not found: ${id}`);
  }
}

export class ConflictError extends Error {
  readonly _tag = 'ConflictError';
  constructor(message: string) {
    super(message);
  }
}

export class OperationError extends Error {
  readonly _tag = 'OperationError';
  declare cause?: unknown;
  constructor(operation: string, cause?: unknown) {
    super(`Failed to ${operation}`);
    if (cause) {
      this.cause = cause;
    }
  }
}

export class RateLimitError extends Error {
  readonly _tag = 'RateLimitError';
  constructor(resource: string) {
    super(`Rate limit exceeded for ${resource}`);
  }
}

export class NetworkError extends Error {
  readonly _tag = 'NetworkError';
  constructor(message: string) {
    super(message);
  }
}

export class TimeoutError extends Error {
  readonly _tag = 'TimeoutError';
  constructor(operation: string) {
    super(`Operation timed out: ${operation}`);
  }
}

// Type guard helpers for error handling
export const isAuthenticationError = (
  error: Error
): error is AuthenticationError => error instanceof AuthenticationError;

export const isAuthorizationError = (
  error: Error
): error is AuthorizationError => error instanceof AuthorizationError;

export const isValidationError = (error: Error): error is ValidationError =>
  error instanceof ValidationError;

export const isZodValidationError = (
  error: Error
): error is ZodValidationError => error instanceof ZodValidationError;

export const isNotFoundError = (error: Error): error is NotFoundError =>
  error instanceof NotFoundError;

export const isConflictError = (error: Error): error is ConflictError =>
  error instanceof ConflictError;

export const isOperationError = (error: Error): error is OperationError =>
  error instanceof OperationError;

export const isRateLimitError = (error: Error): error is RateLimitError =>
  error instanceof RateLimitError;

export const isNetworkError = (error: Error): error is NetworkError =>
  error instanceof NetworkError;

export const isTimeoutError = (error: Error): error is TimeoutError =>
  error instanceof TimeoutError;
