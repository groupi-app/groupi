import pino from 'pino';
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
export const createLogger = (module) => {
    return logger.child({ module });
};
// Export default logger
export { logger };
// Convenience methods for different log levels
export const log = {
    debug: (message, data) => logger.debug(data, message),
    info: (message, data) => logger.info(data, message),
    warn: (message, data) => logger.warn(data, message),
    error: (message, error) => {
        if (error instanceof Error) {
            logger.error({ err: error }, message);
        }
        else {
            logger.error(error, message);
        }
    },
    fatal: (message, error) => {
        if (error instanceof Error) {
            logger.fatal({ err: error, stack: error.stack }, message);
        }
        else {
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
