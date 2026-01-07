import pino from 'pino';
import {
  sendToLoki,
  isLokiConfigured,
} from '@groupi/services/infrastructure/loki-sender';

/**
 * Web App Logger with Grafana Cloud Loki Integration
 *
 * This logger sends server-side logs to Grafana Cloud Loki when enabled.
 * Client-side (browser) logs continue to use console methods and are NOT sent to Loki.
 *
 * To enable Loki logging, set the following environment variables:
 * - LOKI_ENABLED=true
 * - LOKI_INSTANCE_ID=<your-instance-id>
 * - LOKI_TOKEN=<your-token>
 * - LOKI_URL=<optional-url-defaults-to-prod>
 *
 * All credentials MUST be stored in environment variables, never hardcoded.
 */

const getLogLevel = () => {
  if (process.env.NODE_ENV === 'production') {
    return 'info';
  }
  return process.env.DEBUG === 'true' ? 'debug' : 'info';
};

/**
 * Check if Loki logging is enabled (server-side only)
 * Client-side logs will not be sent to Loki
 */
const isLokiEnabled = (): boolean => {
  // Only enable Loki on server-side (Node.js environment)
  if (typeof window !== 'undefined') {
    return false;
  }
  const enabled = process.env.LOKI_ENABLED === 'true';
  const hasCredentials =
    !!process.env.LOKI_INSTANCE_ID && !!process.env.LOKI_TOKEN;
  return enabled && hasCredentials;
};

// Base logger configuration
const loggerConfig: pino.LoggerOptions = {
  level: getLogLevel(),
  browser: {
    // For browser environments, we want to use console methods
    // but with pino's structured logging format
    asObject: true,
  },
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

// Check if we should send to Loki (server-side + production + enabled + configured)
const shouldSendToLoki =
  typeof window === 'undefined' &&
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

// Create child loggers for different parts of the web application
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
  error: (message: string, data?: Error | object) => {
    if (data instanceof Error) {
      logger.error(
        { err: data, stack: data.stack, cause: data.cause },
        message
      );
    } else {
      logger.error(data, message);
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

// Specialized loggers for different parts of the web app
export const pageLogger = createLogger('pages');
export const componentLogger = createLogger('components');
export const apiLogger = createLogger('api');
export const authLogger = createLogger('auth');
export const pusherLogger = createLogger('pusher');
export const hookLogger = createLogger('hooks');
