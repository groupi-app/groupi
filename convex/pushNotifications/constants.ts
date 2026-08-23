import { v } from 'convex/values';

export const NOTIFICATION_TYPES = [
  'EVENT_EDITED',
  'NEW_POST',
  'NEW_REPLY',
  'DATE_CHOSEN',
  'DATE_CHANGED',
  'DATE_RESET',
  'USER_JOINED',
  'USER_LEFT',
  'USER_PROMOTED',
  'USER_DEMOTED',
  'USER_RSVP',
  'USER_MENTIONED',
  'EVENT_REMINDER',
  'FRIEND_REQUEST_RECEIVED',
  'FRIEND_REQUEST_ACCEPTED',
  'EVENT_INVITE_RECEIVED',
  'EVENT_INVITE_ACCEPTED',
  'ADDON_CONFIG_RESET',
  'ADDON_AUTOMATION',
] as const;

export const notificationTypeValidator = v.union(
  v.literal('EVENT_EDITED'),
  v.literal('NEW_POST'),
  v.literal('NEW_REPLY'),
  v.literal('DATE_CHOSEN'),
  v.literal('DATE_CHANGED'),
  v.literal('DATE_RESET'),
  v.literal('USER_JOINED'),
  v.literal('USER_LEFT'),
  v.literal('USER_PROMOTED'),
  v.literal('USER_DEMOTED'),
  v.literal('USER_RSVP'),
  v.literal('USER_MENTIONED'),
  v.literal('EVENT_REMINDER'),
  v.literal('FRIEND_REQUEST_RECEIVED'),
  v.literal('FRIEND_REQUEST_ACCEPTED'),
  v.literal('EVENT_INVITE_RECEIVED'),
  v.literal('EVENT_INVITE_ACCEPTED'),
  v.literal('ADDON_CONFIG_RESET'),
  v.literal('ADDON_AUTOMATION')
);

export const pushDeliveryStatusValidator = v.union(
  v.literal('PENDING'),
  v.literal('SENDING'),
  v.literal('RETRY_SCHEDULED'),
  v.literal('TICKET_OK'),
  v.literal('TICKET_ERROR'),
  v.literal('RECEIPT_OK'),
  v.literal('RECEIPT_ERROR')
);

export const MAX_PUSH_ATTEMPTS = 3;
export const MAX_RECEIPT_CHECK_ATTEMPTS = 3;
export const MAX_ACTIVE_PUSH_DEVICES = 10;
export const RECEIPT_CHECK_DELAY_MS = 15 * 60 * 1000;
export const DELIVERY_LEASE_MS = 5 * 60 * 1000;

export function getRetryDelayMs(attempt: number): number {
  const boundedAttempt = Math.max(1, Math.min(attempt, MAX_PUSH_ATTEMPTS));
  return 2_000 * 2 ** (boundedAttempt - 1);
}

export function isTransientPushError(errorCode?: string): boolean {
  return (
    errorCode === 'MessageRateExceeded' ||
    errorCode === 'ProviderError' ||
    errorCode === 'ExpoError' ||
    errorCode === 'TOO_MANY_REQUESTS' ||
    errorCode === 'ExpoUnavailable'
  );
}

const TRANSIENT_NETWORK_ERROR_CODES = new Set([
  'ECONNRESET',
  'ECONNREFUSED',
  'ETIMEDOUT',
  'EAI_AGAIN',
  'ENOTFOUND',
  'UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_SOCKET',
]);

/** Normalize transient fetch/Undici failures into the bounded retry category. */
export function classifyPushTransportError(error: unknown): string {
  const candidates: unknown[] = [error];
  let explicitCode: string | undefined;

  for (let index = 0; index < candidates.length && index < 2; index += 1) {
    const value = candidates[index];
    if (typeof value !== 'object' || value === null) continue;

    const candidate = value as {
      cause?: unknown;
      code?: unknown;
      message?: unknown;
      statusCode?: unknown;
    };
    if (index === 0 && candidate.cause !== undefined) {
      candidates.push(candidate.cause);
    }
    if (candidate.statusCode === 429) return 'TOO_MANY_REQUESTS';
    if (
      typeof candidate.statusCode === 'number' &&
      candidate.statusCode >= 500
    ) {
      return 'ExpoUnavailable';
    }
    if (typeof candidate.code === 'string') {
      if (TRANSIENT_NETWORK_ERROR_CODES.has(candidate.code)) {
        return 'ExpoUnavailable';
      }
      explicitCode ??= candidate.code;
    }
    if (
      typeof candidate.message === 'string' &&
      /fetch failed|network|socket|timed? ?out|timeout/i.test(candidate.message)
    ) {
      return 'ExpoUnavailable';
    }
  }

  return explicitCode ?? 'ExpoRequestFailed';
}

export function isValidExpoPushToken(token: string): boolean {
  return (
    (token.startsWith('ExponentPushToken[') ||
      token.startsWith('ExpoPushToken[')) &&
    token.endsWith(']') &&
    token.length <= 256
  );
}

export function sanitizePushErrorMessage(message?: string): string | undefined {
  if (!message) return undefined;

  return message
    .replace(/(?:Exponent|Expo)PushToken\[[^\]]+\]/g, '[redacted-push-token]')
    .replace(
      /\b[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}\b/gi,
      '[redacted-push-token]'
    )
    .slice(0, 500);
}
