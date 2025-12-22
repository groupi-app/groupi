import { createLogger } from './logger';
import {
  handleSentryReporting,
  shouldProcessLevel,
  prepareLogData,
  type ReportLevel,
  type ReportOptions,
} from './report-core';

// Re-export types
export type { ReportLevel, ReportOptions };

// ============================================================================
// LOGGER SETUP
// ============================================================================

const reportLogger = createLogger('report');

// ============================================================================
// CORE REPORTING FUNCTION
// ============================================================================

/**
 * Universal reporting function that handles logging and error tracking
 * based on the severity level provided.
 *
 * Level behaviors:
 * - debug: Console/log file only (disabled in production)
 * - info: Log + Sentry breadcrumb (app working as intended)
 * - warn: Log + Sentry breadcrumb (potential future issues)
 * - error: Log + Sentry error capture (unexpected errors)
 * - fatal: Log + Sentry error capture (critical failures)
 */
export function report(options: ReportOptions): string | null {
  const { message, level } = options;

  // Skip if level should not be processed
  if (!shouldProcessLevel(level)) {
    return null;
  }

  // Prepare log data
  const logData = prepareLogData(options);

  // Always log to our logger
  switch (level) {
    case 'debug':
      reportLogger.debug(logData, message);
      break;
    case 'info':
      reportLogger.info(logData, message);
      break;
    case 'warn':
      reportLogger.warn(logData, message);
      break;
    case 'error':
      reportLogger.error(logData, message);
      break;
    case 'fatal':
      reportLogger.fatal(logData, message);
      break;
  }

  // Handle Sentry reporting
  const sentryEventId = handleSentryReporting(options);

  // Log the Sentry event ID for correlation if an error was captured
  if (sentryEventId) {
    reportLogger.info(
      { sentryEventId, category: options.category, level },
      `Sentry event captured: ${sentryEventId}`
    );
  }

  return sentryEventId;
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

export const reportDebug = (
  message: string,
  category: string,
  data?: Record<string, unknown>
) => report({ message, level: 'debug', category, data });

export const reportInfo = (
  message: string,
  category: string,
  data?: Record<string, unknown>,
  tags?: Record<string, string | number | boolean>
) => report({ message, level: 'info', category, data, tags });

export const reportWarn = (
  message: string,
  category: string,
  data?: Record<string, unknown>,
  tags?: Record<string, string | number | boolean>
) => report({ message, level: 'warn', category, data, tags });

export const reportError = (
  message: string,
  category: string,
  error?: Error,
  data?: Record<string, unknown>,
  tags?: Record<string, string | number | boolean>
) => report({ message, level: 'error', category, error, data, tags });

export const reportFatal = (
  message: string,
  category: string,
  error?: Error,
  data?: Record<string, unknown>,
  tags?: Record<string, string | number | boolean>
) => report({ message, level: 'fatal', category, error, data, tags });

// ============================================================================
// DOMAIN-SPECIFIC REPORTING HELPERS
// ============================================================================

export const reportAuth = {
  unauthorized: (
    userId: string,
    resource: string,
    data?: Record<string, unknown>
  ) =>
    reportInfo(
      `User unauthorized for resource: ${resource}`,
      'auth',
      { ...data, resource },
      { userId }
    ),

  loginSuccess: (userId: string, data?: Record<string, unknown>) =>
    reportInfo('User login successful', 'auth', data, { userId }),

  loginFailure: (error: Error, data?: Record<string, unknown>) =>
    reportWarn('User login failed', 'auth', data, { error: error.message }),
};

export const reportDatabase = {
  queryError: (query: string, error: Error, data?: Record<string, unknown>) =>
    reportError(`Database query failed: ${query}`, 'database', error, {
      ...data,
      query,
    }),

  connectionError: (error: Error, data?: Record<string, unknown>) =>
    reportError('Database connection failed', 'database', error, data),

  slowQuery: (
    query: string,
    duration: number,
    data?: Record<string, unknown>
  ) =>
    reportWarn(
      `Slow database query detected: ${query}`,
      'database',
      { ...data, query, duration },
      { duration }
    ),
};

export const reportEvent = {
  created: (eventId: string, userId: string, data?: Record<string, unknown>) =>
    reportInfo(
      'Event created successfully',
      'events',
      { ...data, eventId },
      { eventId, userId }
    ),

  updated: (eventId: string, userId: string, data?: Record<string, unknown>) =>
    reportInfo(
      'Event updated successfully',
      'events',
      { ...data, eventId },
      { eventId, userId }
    ),

  deleted: (eventId: string, userId: string, data?: Record<string, unknown>) =>
    reportInfo(
      'Event deleted successfully',
      'events',
      { ...data, eventId },
      { eventId, userId }
    ),
};

export const reportNotification = {
  sent: (type: string, recipientId: string, data?: Record<string, unknown>) =>
    reportInfo(
      `Notification sent: ${type}`,
      'notifications',
      { ...data, type, recipientId },
      { type, recipientId }
    ),

  failed: (type: string, error: Error, data?: Record<string, unknown>) =>
    reportError(
      `Notification failed to send: ${type}`,
      'notifications',
      error,
      { ...data, type }
    ),

  deliveryError: (
    provider: string,
    error: Error,
    data?: Record<string, unknown>
  ) =>
    reportError(
      `Notification delivery failed via ${provider}`,
      'notifications',
      error,
      { ...data, provider }
    ),
};

// ============================================================================
// EFFECT INTEGRATION
// ============================================================================

import { Effect } from 'effect';

/**
 * Effect-based reporting that integrates with the Effect ecosystem
 */
export const reportEffect = {
  debug: (message: string, category: string, data?: Record<string, unknown>) =>
    Effect.sync(() => reportDebug(message, category, data)),

  info: (
    message: string,
    category: string,
    data?: Record<string, unknown>,
    tags?: Record<string, string | number | boolean>
  ) => Effect.sync(() => reportInfo(message, category, data, tags)),

  warn: (
    message: string,
    category: string,
    data?: Record<string, unknown>,
    tags?: Record<string, string | number | boolean>
  ) => Effect.sync(() => reportWarn(message, category, data, tags)),

  error: (
    message: string,
    category: string,
    error?: Error,
    data?: Record<string, unknown>,
    tags?: Record<string, string | number | boolean>
  ) => Effect.sync(() => reportError(message, category, error, data, tags)),

  fatal: (
    message: string,
    category: string,
    error?: Error,
    data?: Record<string, unknown>,
    tags?: Record<string, string | number | boolean>
  ) => Effect.sync(() => reportFatal(message, category, error, data, tags)),
};

/**
 * Wraps an Effect with automatic error reporting
 */
export function withErrorReporting<A, E, R>(
  effect: Effect.Effect<A, E, R>,
  category: string,
  operation: string,
  userId?: string
): Effect.Effect<A, E, R> {
  return effect.pipe(
    Effect.tapError(error => {
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      return reportEffect.error(
        `Operation failed: ${operation}`,
        category,
        errorObj,
        { operation },
        { ...(userId && { userId }) }
      );
    })
  );
}
