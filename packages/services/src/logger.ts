import pino from 'pino';
import { Effect, Logger } from 'effect';

const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  formatters: {
    level: label => {
      return { level: label.toUpperCase() };
    },
  },
  timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
});

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

// Effect Logger integration with Pino
const createEffectLogger = (pinoLogger: pino.Logger) =>
  Logger.make(({ logLevel, message, cause, context, spans, annotations }) => {
    const logData: Record<string, unknown> = {};

    // Add context data
    if (context && typeof context === 'object' && context !== null) {
      Object.assign(logData, context);
    }

    // Add spans for tracing
    const spansArray = Array.from(spans);
    if (spansArray.length > 0) {
      const spansObj: Record<string, number> = {};
      spansArray.forEach(span => {
        spansObj[span.label] = 0; // Effect spans don't have timing in the log callback
      });
      logData.spans = spansObj;
    }

    // Add annotations
    if (
      annotations &&
      typeof annotations === 'object' &&
      annotations !== null
    ) {
      Object.assign(logData, { annotations });
    }

    // Add error/cause information
    if (cause && cause._tag !== 'Empty') {
      if (cause._tag === 'Die') {
        logData.cause = cause.defect;
      } else if (cause._tag === 'Fail') {
        logData.cause = cause.error;
      }
    }

    // Convert message array to string
    const logMessage = Array.isArray(message)
      ? message.join(' ')
      : String(message);

    // Map Effect log levels to Pino log levels and log the message
    switch (logLevel.label) {
      case 'FATAL':
        pinoLogger.fatal(logData, logMessage);
        break;
      case 'ERROR':
        pinoLogger.error(logData, logMessage);
        break;
      case 'WARN':
        pinoLogger.warn(logData, logMessage);
        break;
      case 'INFO':
        pinoLogger.info(logData, logMessage);
        break;
      case 'DEBUG':
        pinoLogger.debug(logData, logMessage);
        break;
      case 'TRACE':
        if (pinoLogger.trace) {
          pinoLogger.trace(logData, logMessage);
        }
        break;
      default:
        pinoLogger.info(logData, logMessage);
    }
  });

// Create Effect Logger instances for different domains
export const createEffectLoggerLayer = (module: string) => {
  const pinoLogger = createLogger(module);
  return Logger.replace(Logger.defaultLogger, createEffectLogger(pinoLogger));
};

// Default Effect logger using the main logger
export const DefaultEffectLogger = Logger.replace(
  Logger.defaultLogger,
  createEffectLogger(logger)
);

// Domain-specific Effect Logger layers
export const AuthLoggerLayer = createEffectLoggerLayer('auth');
export const DbLoggerLayer = createEffectLoggerLayer('database');
export const ApiLoggerLayer = createEffectLoggerLayer('api');
export const EventLoggerLayer = createEffectLoggerLayer('events');
export const NotificationLoggerLayer = createEffectLoggerLayer('notifications');
export const EmailLoggerLayer = createEffectLoggerLayer('email');

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
