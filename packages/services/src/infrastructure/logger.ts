import pino from 'pino';
import { Effect, Logger } from 'effect';
import {
  handleSentryReporting,
  shouldProcessLevel,
  prepareLogData,
  type ReportLevel,
  type ReportOptions,
} from './report-core';
import { isDEBUG_ENABLED } from './env';
import { isLokiEnabled } from './loki-transport';
import { sendToLoki, isLokiConfigured } from './loki-sender';

/**
 * Logger Configuration with Grafana Cloud Loki Integration
 *
 * This logger sends logs to Grafana Cloud Loki when enabled via environment variables.
 * To enable Loki logging, set the following environment variables:
 * - LOKI_ENABLED=true
 * - LOKI_INSTANCE_ID=<your-instance-id>
 * - LOKI_TOKEN=<your-token>
 * - LOKI_URL=<optional-url-defaults-to-prod>
 *
 * Logs are batched and sent asynchronously to avoid blocking the application.
 * Only server-side logs are sent to Loki (client-side logs use browser console).
 */

const getLogLevel = () => {
  if (process.env.NODE_ENV === 'production') {
    return 'info';
  }
  return isDEBUG_ENABLED() ? 'debug' : 'info';
};

// Base logger configuration
const loggerConfig: pino.LoggerOptions = {
  level: getLogLevel(),
  formatters: {
    level: label => {
      return { level: label.toUpperCase() };
    },
  },
  timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
};

// Create logger with Loki integration if enabled
// We use an inline approach instead of worker threads for Vercel serverless compatibility
let logger: pino.Logger;

// Check if we should send to Loki (production + enabled + configured)
const shouldSendToLoki =
  isLokiEnabled() &&
  process.env.NODE_ENV === 'production' &&
  isLokiConfigured();

if (shouldSendToLoki) {
  // Create a custom destination that sends to both console and Loki
  const lokiDestination = {
    write(msg: string) {
      // Write to stdout for Vercel logs
      process.stdout.write(msg);

      // Parse and send to Loki (non-blocking)
      try {
        const logObj = JSON.parse(msg);
        sendToLoki(logObj);
      } catch {
        // If parsing fails, still send raw message
        sendToLoki({ level: 'INFO', msg: msg.trim(), time: Date.now() });
      }
    },
  };

  logger = pino(loggerConfig, lokiDestination);
} else {
  // Standard logger without Loki
  logger = pino(loggerConfig);
}

// Create child loggers for different parts of the application
export const createLogger = (module: string) => {
  return logger.child({ module });
};

// Export default logger
export { logger };

// Convenience methods for different log levels
export const log = {
  debug: (message: string, data?: object) => logger.debug(data, message),
  info: (message: string, data?: object) => logger.info(data, message),
  warn: (message: string, data?: object) => logger.warn(data, message),
  error: (message: string, error?: Error | object) => {
    if (error instanceof Error) {
      logger.error({ err: error }, message);
    } else {
      logger.error(error, message);
    }
  },
  fatal: (message: string, error?: Error | object) => {
    if (error instanceof Error) {
      logger.fatal({ err: error, stack: error.stack }, message);
    } else {
      logger.fatal(error, message);
    }
  },
};

// Effect Logger integration with Pino and Sentry reporting
const createEffectLogger = (pinoLogger: pino.Logger, module?: string) =>
  Logger.make(({ logLevel, message, cause, context, spans, annotations }) => {
    // Convert message array to string, handling objects properly
    let logMessage: string;
    let messageData: Record<string, unknown> = {};

    if (Array.isArray(message)) {
      // Separate string parts from object parts
      const stringParts: string[] = [];
      message.forEach((part, index) => {
        if (typeof part === 'string') {
          stringParts.push(part);
        } else if (typeof part === 'object' && part !== null) {
          // Add objects to messageData instead of converting to [object Object]
          Object.assign(messageData, part);
        } else if (part !== undefined && part !== null) {
          stringParts.push(String(part));
        }
      });
      logMessage = stringParts.join(' ');
    } else {
      logMessage = String(message);
    }

    // Map Effect log levels to our ReportLevel
    let reportLevel: ReportLevel;
    switch (logLevel.label) {
      case 'FATAL':
        reportLevel = 'fatal';
        break;
      case 'ERROR':
        reportLevel = 'error';
        break;
      case 'WARN':
        reportLevel = 'warn';
        break;
      case 'INFO':
        reportLevel = 'info';
        break;
      case 'DEBUG':
      case 'TRACE':
        reportLevel = 'debug';
        break;
      default:
        reportLevel = 'info';
    }

    // Skip if level should not be processed
    if (!shouldProcessLevel(reportLevel)) {
      return;
    }

    // Prepare data for reporting
    const reportData: Record<string, unknown> = {};

    // Add data extracted from message array (objects passed to Effect.logInfo, etc.)
    if (Object.keys(messageData).length > 0) {
      Object.assign(reportData, messageData);
    }

    // Add context data
    if (context && typeof context === 'object' && context !== null) {
      Object.assign(reportData, context);
    }

    // Add spans for tracing
    const spansArray = Array.from(spans);
    if (spansArray.length > 0) {
      const spansObj: Record<string, number> = {};
      spansArray.forEach(span => {
        spansObj[span.label] = 0; // Effect spans don't have timing in the log callback
      });
      reportData.spans = spansObj;
    }

    // Add annotations (skip empty HashMap from Effect)
    if (
      annotations &&
      typeof annotations === 'object' &&
      annotations !== null
    ) {
      // Check if it's an Effect HashMap and has actual values
      const annotationsObj = annotations as Record<string, unknown>;
      if (annotationsObj._id === 'HashMap') {
        // Effect HashMap - check if it has values
        const values = annotationsObj.values;
        if (Array.isArray(values) && values.length > 0) {
          reportData.annotations = values;
        }
      } else {
        // Regular object - only add if it has keys
        const keys = Object.keys(annotationsObj);
        if (keys.length > 0) {
          reportData.annotations = annotations;
        }
      }
    }

    // Extract error from cause
    let error: Error | undefined;
    if (cause && cause._tag !== 'Empty') {
      if (cause._tag === 'Die') {
        error =
          cause.defect instanceof Error
            ? cause.defect
            : new Error(String(cause.defect));
        reportData.cause = cause.defect;
      } else if (cause._tag === 'Fail') {
        error =
          cause.error instanceof Error
            ? cause.error
            : new Error(String(cause.error));
        reportData.cause = cause.error;
      }
    }

    // Extract userId from context if available
    const userId = reportData.userId as string | undefined;

    // Create report options
    const reportOptions: ReportOptions = {
      message: logMessage,
      level: reportLevel,
      category: module || 'effect',
      data: reportData,
      error,
      userId,
    };

    // Prepare log data for Pino
    const pinoLogData = prepareLogData(reportOptions);

    // Log with Pino
    switch (reportLevel) {
      case 'fatal':
        pinoLogger.fatal(pinoLogData, logMessage);
        break;
      case 'error':
        pinoLogger.error(pinoLogData, logMessage);
        break;
      case 'warn':
        pinoLogger.warn(pinoLogData, logMessage);
        break;
      case 'info':
        pinoLogger.info(pinoLogData, logMessage);
        break;
      case 'debug':
        pinoLogger.debug(pinoLogData, logMessage);
        break;
    }

    // Handle Sentry reporting
    const sentryEventId = handleSentryReporting(reportOptions);

    // Log the Sentry event ID for correlation if an error was captured
    if (sentryEventId) {
      pinoLogger.info(
        { sentryEventId, category: reportOptions.category, level: reportLevel },
        `Sentry event captured: ${sentryEventId}`
      );
    }
  });

// Create Effect Logger instances for different domains
export const createEffectLoggerLayer = (module: string) => {
  const pinoLogger = createLogger(module);
  return Logger.replace(
    Logger.defaultLogger,
    createEffectLogger(pinoLogger, module)
  );
};

// Default Effect logger using the main logger
export const DefaultEffectLogger = Logger.replace(
  Logger.defaultLogger,
  createEffectLogger(logger, 'default')
);

// Domain-specific Effect Logger layers
export const AuthLoggerLayer = createEffectLoggerLayer('auth');
export const DbLoggerLayer = createEffectLoggerLayer('database');
export const ApiLoggerLayer = createEffectLoggerLayer('api');
export const EventLoggerLayer = createEffectLoggerLayer('events');
export const NotificationLoggerLayer = createEffectLoggerLayer('notifications');
export const EmailLoggerLayer = createEffectLoggerLayer('email');
export const ServiceLoggerLayer = createEffectLoggerLayer('services');
export const RealtimeLoggerLayer = createEffectLoggerLayer('realtime');
export const SettingsLoggerLayer = createEffectLoggerLayer('settings');
export const PageLoggerLayer = createEffectLoggerLayer('pages');

// Specialized loggers for different domains (existing Pino loggers)
export const authLogger = createLogger('auth');
export const dbLogger = createLogger('database');
export const apiLogger = createLogger('api');
export const eventLogger = createLogger('events');
export const notificationLogger = createLogger('notifications');
export const emailLogger = createLogger('email');

// Helper function to create an Effect with proper logging context
export const withLogging = <A, E, R>(
  effect: Effect.Effect<A, E, R>,
  loggerLayer = DefaultEffectLogger
): Effect.Effect<A, E, R> => {
  return Effect.provide(effect, loggerLayer);
};
