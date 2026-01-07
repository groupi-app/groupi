/**
 * Loki Log Sender for Grafana Cloud
 *
 * This module sends logs to Grafana Cloud Loki using Basic authentication.
 * It batches logs and sends them asynchronously (fire-and-forget) to avoid blocking.
 *
 * This is used instead of Pino worker threads which don't work in Vercel serverless.
 */

interface LokiLogEntry {
  stream: Record<string, string>;
  values: [string, string][];
}

let batch: LokiLogEntry[] = [];
let batchTimeout: NodeJS.Timeout | null = null;
const batchSize = 10;
const batchInterval = 5000; // 5 seconds

// Cache config to avoid repeated env lookups
let cachedConfig: {
  url: string;
  authHeader: string;
  environment: string;
  service: string;
} | null = null;

function getConfig() {
  if (cachedConfig) return cachedConfig;

  const instanceId = process.env.LOKI_INSTANCE_ID;
  const token = process.env.LOKI_TOKEN;
  const url =
    process.env.LOKI_URL ||
    'https://logs-prod-036.grafana.net/loki/api/v1/push';
  const environment = process.env.NODE_ENV || 'development';
  const service = process.env.LOKI_SERVICE || 'services';

  if (!instanceId || !token) {
    return null;
  }

  cachedConfig = {
    url,
    authHeader: `Basic ${Buffer.from(`${instanceId}:${token}`).toString('base64')}`,
    environment,
    service,
  };

  return cachedConfig;
}

function flushBatch() {
  const config = getConfig();
  if (!config || batch.length === 0) return;

  const logsToSend = batch;
  batch = [];
  if (batchTimeout) {
    clearTimeout(batchTimeout);
    batchTimeout = null;
  }

  const logs = { streams: logsToSend };

  // Fire-and-forget: don't await to avoid blocking
  fetch(config.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: config.authHeader,
    },
    body: JSON.stringify(logs),
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

/**
 * Send a log entry to Loki (non-blocking)
 */
export function sendToLoki(logObj: {
  level: string;
  msg: string;
  module?: string;
  time?: number;
  [key: string]: unknown;
}) {
  const config = getConfig();
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
  // Pino time is in milliseconds, multiply by 1,000,000 to get nanoseconds
  const timestamp = logObj.time
    ? Math.floor(logObj.time * 1000000).toString()
    : Math.floor(Date.now() * 1000000).toString();

  batch.push({
    stream: streamLabels,
    values: [[timestamp, logObj.msg || JSON.stringify(logObj)]],
  });

  if (batch.length >= batchSize) {
    flushBatch();
  } else if (!batchTimeout) {
    batchTimeout = setTimeout(flushBatch, batchInterval);
  }
}

/**
 * Check if Loki is enabled and configured
 */
export function isLokiConfigured(): boolean {
  return getConfig() !== null;
}
