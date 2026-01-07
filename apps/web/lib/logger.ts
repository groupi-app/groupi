import pino from 'pino';

/**
 * Web App Logger with Grafana Cloud Loki Integration
 *
 * This logger sends server-side logs to Grafana Cloud Loki when enabled.
 * Client-side (browser) logs continue to use console methods and are NOT sent to Loki.
 *
 * Transaction Tracing:
 * All logs automatically include a `traceId` field when running within a request context.
 * Use this in Grafana to filter logs for a single transaction:
 *   {service="groupi"} | json | traceId="abc123"
 *
 * To enable Loki logging, set the following environment variables:
 * - LOKI_ENABLED=true
 * - LOKI_INSTANCE_ID=<your-instance-id>
 * - LOKI_TOKEN=<your-token>
 * - LOKI_URL=<optional-url-defaults-to-prod>
 *
 * All credentials MUST be stored in environment variables, never hardcoded.
 */

// Lazily load request-context on server only to avoid client-side bundling issues
let getTraceId: (() => string | undefined) | undefined;
if (typeof window === 'undefined') {
  // Server-side: dynamically import to get trace ID from AsyncLocalStorage
  import('@groupi/services/request-context').then(module => {
    getTraceId = module.getTraceId;
  });
}

// ============================================================================
// Inline Loki Sender (avoids worker threads which don't work in Vercel serverless)
// ============================================================================

interface LokiLogEntry {
  stream: Record<string, string>;
  values: [string, string][];
}

let lokiBatch: LokiLogEntry[] = [];
let lokiBatchTimeout: ReturnType<typeof setTimeout> | null = null;
const LOKI_BATCH_SIZE = 10;
const LOKI_BATCH_INTERVAL = 5000;

let cachedLokiConfig: {
  url: string;
  authHeader: string;
  environment: string;
  service: string;
} | null = null;

function getLokiConfig() {
  if (cachedLokiConfig) return cachedLokiConfig;

  const instanceId = process.env.LOKI_INSTANCE_ID;
  const token = process.env.LOKI_TOKEN;
  const url =
    process.env.LOKI_URL ||
    'https://logs-prod-036.grafana.net/loki/api/v1/push';
  const environment = process.env.NODE_ENV || 'development';
  const service = process.env.LOKI_SERVICE || 'web';

  if (!instanceId || !token) {
    return null;
  }

  cachedLokiConfig = {
    url,
    authHeader: `Basic ${Buffer.from(`${instanceId}:${token}`).toString('base64')}`,
    environment,
    service,
  };

  return cachedLokiConfig;
}

function flushLokiBatch() {
  const config = getLokiConfig();
  if (!config || lokiBatch.length === 0) return;

  const logsToSend = lokiBatch;
  lokiBatch = [];
  if (lokiBatchTimeout) {
    clearTimeout(lokiBatchTimeout);
    lokiBatchTimeout = null;
  }

  // Fire-and-forget: don't await to avoid blocking
  fetch(config.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: config.authHeader,
    },
    body: JSON.stringify({ streams: logsToSend }),
  })
    .then(response => {
      if (!response.ok) {
        // eslint-disable-next-line no-console
        console.error(
          `[Loki] Failed to send logs: ${response.status} ${response.statusText}`
        );
      }
    })
    .catch(error => {
      // eslint-disable-next-line no-console
      console.error('[Loki] Connection error:', error);
    });
}

function sendToLoki(logObj: {
  level: string;
  msg: string;
  module?: string;
  time?: number;
  [key: string]: unknown;
}) {
  const config = getLokiConfig();
  if (!config) return;

  const streamLabels: Record<string, string> = {
    Language: 'NodeJS',
    source: 'Code',
    environment: config.environment,
    service: config.service,
    module: String(logObj.module || 'default'),
    level: String(logObj.level || 'INFO'),
  };

  // Convert timestamp to nanoseconds (Loki format)
  const timestamp = logObj.time
    ? Math.floor(logObj.time * 1000000).toString()
    : Math.floor(Date.now() * 1000000).toString();

  // Send full JSON log line - Grafana can parse with LogQL: {service="..."} | json
  // This preserves all structured data for querying and display
  const logLine = JSON.stringify(logObj);

  lokiBatch.push({
    stream: streamLabels,
    values: [[timestamp, logLine]],
  });

  if (lokiBatch.length >= LOKI_BATCH_SIZE) {
    flushLokiBatch();
  } else if (!lokiBatchTimeout) {
    lokiBatchTimeout = setTimeout(flushLokiBatch, LOKI_BATCH_INTERVAL);
  }
}

function isLokiConfigured(): boolean {
  return getLokiConfig() !== null;
}

// ============================================================================
// Pino Logger Configuration
// ============================================================================

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
  // Add traceId to every log entry if within a request context (server-side only)
  mixin() {
    const traceId = getTraceId?.();
    return traceId ? { traceId } : {};
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
