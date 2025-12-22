import * as Sentry from '@sentry/node';
import { isDEBUG_ENABLED } from './env';

// ============================================================================
// REPORTING TYPES
// ============================================================================

export type ReportLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface ReportOptions {
  message: string;
  level: ReportLevel;
  category: string;
  data?: Record<string, unknown>;
  error?: Error;
  userId?: string;
  tags?: Record<string, string | number | boolean>;
}

// ============================================================================
// ENVIRONMENT CONFIGURATION
// ============================================================================

const isProduction = process.env.NODE_ENV === 'production';
const isDebugEnabled = isDEBUG_ENABLED();

// ============================================================================
// SENTRY INTEGRATION CORE
// ============================================================================

/**
 * Handles Sentry integration for reporting (without direct logging)
 * Returns the Sentry event ID if an error was captured
 */
export function handleSentryReporting(options: ReportOptions): string | null {
  const {
    message,
    level,
    category,
    data = {},
    error,
    userId,
    tags = {},
  } = options;

  // Skip debug logs in production or when DEBUG is not enabled
  if (level === 'debug' && (isProduction || !isDebugEnabled)) {
    return null;
  }

  // Skip Sentry for debug logs entirely
  if (level === 'debug') {
    return null;
  }

  // Set Sentry context
  if (userId) {
    Sentry.setUser({ id: userId });
  }

  if (Object.keys(tags).length > 0) {
    Object.entries(tags).forEach(([key, value]) => {
      Sentry.setTag(key, String(value));
    });
  }

  if (Object.keys(data).length > 0) {
    Sentry.setContext(category, data);
  }

  let sentryEventId: string | null = null;

  // Handle based on level
  switch (level) {
    case 'info':
    case 'warn':
      // Add as breadcrumb for info and warnings
      Sentry.addBreadcrumb({
        message,
        category,
        level: level as 'info' | 'warning',
        data: {
          ...data,
          ...(userId && { userId }),
          ...tags,
        },
      });
      break;

    case 'error':
    case 'fatal':
      // Capture as error for error and fatal levels
      if (error) {
        sentryEventId = Sentry.captureException(error, {
          level: level as 'error' | 'fatal',
          tags,
          contexts: {
            [category]: data,
          },
          extra: {
            originalMessage: message,
            category,
          },
        });
      } else {
        sentryEventId = Sentry.captureMessage(message, {
          level: level as 'error' | 'fatal',
          tags,
          contexts: {
            [category]: data,
          },
        });
      }
      break;
  }

  return sentryEventId;
}

/**
 * Checks if a log level should be processed
 */
export function shouldProcessLevel(level: ReportLevel): boolean {
  // Skip debug logs in production or when DEBUG is not enabled
  if (level === 'debug' && (isProduction || !isDebugEnabled)) {
    return false;
  }
  return true;
}

/**
 * Prepares log data for structured logging
 */
export function prepareLogData(
  options: ReportOptions
): Record<string, unknown> {
  const { category, level, data = {}, error, userId, tags = {} } = options;

  return {
    category,
    level,
    ...data,
    ...(userId && { userId }),
    ...(Object.keys(tags).length > 0 && { tags }),
    ...(error && {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    }),
  };
}
