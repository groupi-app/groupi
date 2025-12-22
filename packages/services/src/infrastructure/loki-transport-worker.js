/**
 * Loki Transport Worker for Grafana Cloud (JavaScript version)
 *
 * This file is loaded by Pino as a worker thread transport.
 * It sends logs to Grafana Cloud Loki using Bearer token authentication.
 *
 * This is the JavaScript version used in production where TypeScript isn't available.
 */

/* eslint-disable no-console */
/* eslint-disable @next/next/no-assign-module-variable */

const build = require('pino-abstract-transport');

module.exports = async function () {
  // Get configuration from environment variables
  const instanceId = process.env.LOKI_INSTANCE_ID;
  const token = process.env.LOKI_TOKEN;
  const url =
    process.env.LOKI_URL ||
    'https://logs-prod-036.grafana.net/loki/api/v1/push';
  const environment = process.env.NODE_ENV || 'development';
  const service = process.env.LOKI_SERVICE || 'services';

  if (!instanceId || !token) {
    throw new Error(
      'Loki credentials missing: LOKI_INSTANCE_ID and LOKI_TOKEN must be set'
    );
  }

  const batchSize = 10;
  const batchInterval = 5000; // 5 seconds
  let batch = [];
  let batchTimeout = null;

  const flushBatch = async () => {
    if (batch.length === 0) return;

    const logs = {
      streams: batch,
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${instanceId}:${token}`,
        },
        body: JSON.stringify(logs),
      });

      if (!response.ok) {
        console.error(
          `[Loki Transport] Failed to send logs: ${response.status} ${response.statusText}`
        );
      }
    } catch (error) {
      // Log to console as fallback when transport fails
      console.error('[Loki Transport] Connection error:', error);
    }

    batch = [];
    if (batchTimeout) {
      clearTimeout(batchTimeout);
      batchTimeout = null;
    }
  };

  return build(
    async function (source) {
      for await (const obj of source) {
        // Extract module from log object if available
        const module = obj.module || 'default';
        const level = obj.level || 'INFO';
        const message = obj.msg || JSON.stringify(obj);

        // Create stream labels matching Grafana Cloud format
        const streamLabels = {
          Language: 'NodeJS',
          source: 'Code',
          environment: environment,
          service: service,
          module: String(module),
          level: String(level),
        };

        // Convert timestamp to nanoseconds (Loki format)
        // Pino time is in milliseconds since epoch, convert to nanoseconds (multiply by 1,000,000,000)
        const timestamp = obj.time
          ? Math.floor(obj.time * 1000000000).toString()
          : Math.floor(Date.now() * 1000000000).toString();

        // Add log entry to batch
        batch.push({
          stream: streamLabels,
          values: [[timestamp, message]],
        });

        // Flush batch if it reaches the size limit
        if (batch.length >= batchSize) {
          await flushBatch();
        } else if (!batchTimeout) {
          // Set timeout to flush batch after interval
          batchTimeout = setTimeout(flushBatch, batchInterval);
        }
      }

      // Flush any remaining logs
      await flushBatch();
    },
    {
      close: async () => {
        await flushBatch();
      },
    }
  );
};
