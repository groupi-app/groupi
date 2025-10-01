import pino from 'pino';

const getLogLevel = () => {
  if (process.env.NODE_ENV === 'production') {
    return 'info';
  }
  return process.env.DEBUG === 'true' ? 'debug' : 'info';
};

// Create a logger for the web app
const logger = pino({
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
});

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
  error: (message: string, error?: Error | object) => {
    if (error instanceof Error) {
      logger.error(
        {
          err: error,
          stack: error.stack,
          name: error.name,
          cause: error.cause,
          // Include any additional properties on the error
          ...Object.getOwnPropertyNames(error).reduce(
            (acc, prop) => {
              if (!['message', 'stack', 'name'].includes(prop)) {
                try {
                  acc[prop] = (error as any)[prop];
                } catch (e) {
                  // Ignore properties that can't be serialized
                }
              }
              return acc;
            },
            {} as Record<string, any>
          ),
        },
        message
      );
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

// Specialized loggers for different parts of the web app
export const pageLogger = createLogger('pages');
export const componentLogger = createLogger('components');
export const apiLogger = createLogger('api');
export const authLogger = createLogger('auth');
export const pusherLogger = createLogger('pusher');
export const hookLogger = createLogger('hooks');
