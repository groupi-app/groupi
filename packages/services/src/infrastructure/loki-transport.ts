/**
 * Loki Transport Configuration for Grafana Cloud
 *
 * This module provides utilities for Loki transport configuration.
 * The actual transport implementation is in loki-transport-worker.ts
 *
 * Environment Variables Required:
 * - LOKI_ENABLED: Set to "true" to enable Loki logging
 * - LOKI_URL: Loki endpoint URL (defaults to Grafana Cloud prod URL)
 * - LOKI_INSTANCE_ID: Grafana Cloud instance ID
 * - LOKI_TOKEN: Grafana Cloud token (glc_... format)
 *
 * Security: All credentials MUST be stored in environment variables, never hardcoded.
 */

/**
 * Check if Loki logging is enabled and credentials are available
 */
export const isLokiEnabled = (): boolean => {
  const enabled = process.env.LOKI_ENABLED === 'true';
  const hasCredentials =
    !!process.env.LOKI_INSTANCE_ID && !!process.env.LOKI_TOKEN;
  return enabled && hasCredentials;
};

/**
 * Get Loki configuration from environment variables
 * This is used by the transport worker file
 */
export const getLokiConfig = () => {
  const instanceId = process.env.LOKI_INSTANCE_ID;
  const token = process.env.LOKI_TOKEN;
  const url =
    process.env.LOKI_URL ||
    'https://logs-prod-036.grafana.net/loki/api/v1/push';

  if (!instanceId || !token) {
    throw new Error(
      'Loki credentials missing: LOKI_INSTANCE_ID and LOKI_TOKEN must be set'
    );
  }

  return {
    url,
    instanceId,
    token,
    environment: process.env.NODE_ENV || 'development',
    service: process.env.LOKI_SERVICE || 'services',
  };
};
