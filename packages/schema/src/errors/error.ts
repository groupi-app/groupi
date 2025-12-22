// ============================================================================
// SHARED/GENERIC ERROR CLASSES
// ============================================================================

import { Data } from 'effect';

export class ValidationError extends Data.TaggedError('ValidationError')<{
  message: string;
  cause?: unknown;
}> {}

export class DatabaseError extends Data.TaggedError('DatabaseError')<{
  message: string;
  cause?: unknown;
}> {}

export class UnauthorizedError extends Data.TaggedError('UnauthorizedError')<{
  message: string;
  cause?: unknown;
}> {}

export class AuthenticationError extends Data.TaggedError(
  'AuthenticationError'
)<{
  message?: string;
  cause?: unknown;
}> {}

export class NotFoundError extends Data.TaggedError('NotFoundError')<{
  message: string;
  cause?: unknown;
}> {}

export class ConnectionError extends Data.TaggedError('ConnectionError')<{
  message: string;
  cause?: unknown;
}> {}

export class ConflictError extends Data.TaggedError('ConflictError')<{
  message: string;
  cause?: unknown;
}> {}

export class ConstraintError extends Data.TaggedError('ConstraintError')<{
  message: string;
  cause?: unknown;
}> {}

export class OperationError extends Data.TaggedError('OperationError')<{
  message: string;
  cause?: unknown;
}> {}
