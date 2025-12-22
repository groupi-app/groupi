// ============================================================================
// REPLY DOMAIN ERRORS
// ============================================================================

export class ReplyNotFoundError extends Error {
  readonly _tag = 'ReplyNotFoundError';
  constructor(replyId: string) {
    super(`Reply not found: ${replyId}`);
  }
}

export class ReplyUserNotFoundError extends Error {
  readonly _tag = 'ReplyUserNotFoundError';
  constructor() {
    super('User not found');
  }
}

export class ReplyUnauthorizedError extends Error {
  readonly _tag = 'ReplyUnauthorizedError';
  constructor(message: string) {
    super(message);
  }
}

export class ReplyCreationError extends Error {
  readonly _tag = 'ReplyCreationError';
  declare cause?: unknown;
  constructor(cause?: unknown) {
    super('Failed to create reply');
    if (cause) {
      this.cause = cause;
    }
  }
}

export class ReplyUpdateError extends Error {
  readonly _tag = 'ReplyUpdateError';
  declare cause?: unknown;
  constructor(cause?: unknown) {
    super('Failed to update reply');
    if (cause) {
      this.cause = cause;
    }
  }
}

export class ReplyDeletionError extends Error {
  readonly _tag = 'ReplyDeletionError';
  declare cause?: unknown;
  constructor(cause?: unknown) {
    super('Failed to delete reply');
    if (cause) {
      this.cause = cause;
    }
  }
}
