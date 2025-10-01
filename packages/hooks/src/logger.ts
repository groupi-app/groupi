import pino from 'pino';

const getLogLevel = () => {
  if (process.env.NODE_ENV === 'production') {
    return 'info';
  }
  return process.env.DEBUG === 'true' ? 'debug' : 'info';
};

// Create a logger for the hooks package
const logger = pino({
  level: getLogLevel(),
  formatters: {
    level: label => {
      return { level: label.toUpperCase() };
    },
  },
  timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
});

// Create child loggers for different parts of the hooks package
export const createLogger = (module: string) => {
  return logger.child({ module, package: 'hooks' });
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
      logger.error({ err: error, stack: error.stack }, message);
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

// Specialized loggers for hooks
export const prefetchLogger = createLogger('prefetch');
export const queryLogger = createLogger('query');
