'use client';

type ConnectionEvent =
  | 'connected'
  | 'disconnected'
  | 'state_change'
  | 'error'
  | 'subscribe'
  | 'unsubscribe';

interface TelemetryData {
  event: ConnectionEvent;
  userId?: string;
  socketId?: string;
  channel?: string;
  state?: string;
  previousState?: string;
  error?: string;
}

/**
 * Send Pusher connection telemetry to the server for Loki logging
 * Fire-and-forget - errors are silently ignored to not affect UX
 */
export function logPusherEvent(data: TelemetryData): void {
  // Don't log in development to reduce noise
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  const payload = {
    ...data,
    timestamp: Date.now(),
    userAgent:
      typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    pathname:
      typeof window !== 'undefined' ? window.location.pathname : undefined,
  };

  // Use sendBeacon for reliability (works even on page unload)
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    navigator.sendBeacon('/api/pusher/connection-log', JSON.stringify(payload));
  } else {
    // Fallback to fetch
    fetch('/api/pusher/connection-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true, // Allows request to outlive the page
    }).catch(() => {
      // Silently ignore errors
    });
  }
}
