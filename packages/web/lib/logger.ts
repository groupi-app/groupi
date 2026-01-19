/**
 * Simple Console Logger
 *
 * Simplified logger using console methods for client-only architecture.
 * Removed Pino and Loki dependencies for Convex migration.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
// Logger uses 'any' for flexible extra data parameter to log arbitrary objects

// Simple trace ID for development
let currentTraceId: string | undefined;

export function setTraceId(traceId: string) {
  currentTraceId = traceId;
}

export function clearTraceId() {
  currentTraceId = undefined;
}

function formatMessage(message: string, extra?: any) {
  const prefix = currentTraceId ? `[${currentTraceId}] ` : '';
  return extra ? `${prefix}${message} ${JSON.stringify(extra)}` : `${prefix}${message}`;
}

// Logger interface compatible with previous implementation
export const logger = {
  info: (message: string, extra?: any) => {
    console.info(formatMessage(message, extra));
  },
  warn: (message: string, extra?: any) => {
    console.warn(formatMessage(message, extra));
  },
  error: (message: string, extra?: any) => {
    console.error(formatMessage(message, extra));
  },
  debug: (message: string, extra?: any) => {
    console.debug(formatMessage(message, extra));
  },
};

export default logger;

// Legacy exports for compatibility
export function createLogger(component: string) {
  return {
    info: (message: string, extra?: any) => logger.info(`[${component}] ${message}`, extra),
    warn: (message: string, extra?: any) => logger.warn(`[${component}] ${message}`, extra),
    error: (message: string, extra?: any) => logger.error(`[${component}] ${message}`, extra),
    debug: (message: string, extra?: any) => logger.debug(`[${component}] ${message}`, extra),
  };
}

export const componentLogger = {
  info: (component: string, message: string, extra?: any) =>
    logger.info(`[${component}] ${message}`, extra),
  warn: (component: string, message: string, extra?: any) =>
    logger.warn(`[${component}] ${message}`, extra),
  error: (component: string, message: string, extra?: any) =>
    logger.error(`[${component}] ${message}`, extra),
  debug: (component: string, message: string, extra?: any) =>
    logger.debug(`[${component}] ${message}`, extra),
};

// Performance timing utilities
export function createPerformanceTimer(label: string) {
  const start = performance.now();

  return {
    end: () => {
      const duration = performance.now() - start;
      logger.info(`Performance: ${label}`, { duration: `${duration.toFixed(2)}ms` });
      return duration;
    }
  };
}