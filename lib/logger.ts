import pino from 'pino';

// Only use pino-pretty transport if explicitly enabled (e.g., for local dev CLI)
const usePretty = Boolean(process.env.PINO_PRETTY);

const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  ...(usePretty
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            ignore: 'pid,hostname',
            translateTime: 'yyyy-mm-dd HH:MM:ss',
            singleLine: true,
          },
        },
      }
    : {}),
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

// Specialized loggers for different domains
export const authLogger = createLogger('auth');
export const dbLogger = createLogger('database');
export const apiLogger = createLogger('api');
export const eventLogger = createLogger('events');
export const notificationLogger = createLogger('notifications');
export const emailLogger = createLogger('email');
