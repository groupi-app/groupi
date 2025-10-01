// ============================================================================
// SHARED/GENERIC ERROR CLASSES
// ============================================================================

export class ValidationError extends Error {
  readonly _tag = 'ValidationError' as const;
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class DatabaseError extends Error {
  readonly _tag = 'DatabaseError' as const;
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'DatabaseError';
    if (cause) {
      this.cause = cause;
    }
  }
}

export class UnauthorizedError extends Error {
  readonly _tag = 'UnauthorizedError' as const;
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'UnauthorizedError';
    if (cause) {
      this.cause = cause;
    }
  }
}

export class AuthenticationError extends Error {
  readonly _tag = 'AuthenticationError' as const;
  constructor(
    message: string = 'User not authenticated',
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class NotFoundError extends Error {
  readonly _tag = 'NotFoundError' as const;
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'NotFoundError';
    if (cause) {
      this.cause = cause;
    }
  }
}

export class ConnectionError extends Error {
  readonly _tag = 'ConnectionError' as const;
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'ConnectionError';
    if (cause) {
      this.cause = cause;
    }
  }
}

export class ConflictError extends Error {
  readonly _tag = 'ConflictError' as const;
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'ConflictError';
    if (cause) {
      this.cause = cause;
    }
  }
}

export class ConstraintError extends Error {
  readonly _tag = 'ConstraintError' as const;
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'ConstraintError';
    if (cause) {
      this.cause = cause;
    }
  }
}

export class OperationError extends Error {
  readonly _tag = 'OperationError' as const;
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'OperationError';
    if (cause) {
      this.cause = cause;
    }
  }
}
