import pino from 'pino';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

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

// Create a logger for the web app
// Note: When using transport, Pino runs in worker thread mode
// We disable transport in development to avoid worker thread module resolution issues
// Transport is only enabled in production when LOKI_ENABLED=true
let logger: pino.Logger;

if (isLokiEnabled() && process.env.NODE_ENV === 'production') {
  // Resolve absolute path to transport worker file in services package
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const transportPath = resolve(
    __dirname,
    '../../../packages/services/src/infrastructure/loki-transport-worker.ts'
  );
  
  // Use pino.transport() with explicit worker options for better compatibility
  // This helps resolve module paths correctly in pnpm monorepos
  // The transport is passed as the second argument to pino()
  const transport = pino.transport({
    target: transportPath,
    options: {},
  });
  logger = pino(loggerConfig, transport);
} else {
  // No transport - use standard logger
  // In development, this avoids worker thread module resolution issues
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
