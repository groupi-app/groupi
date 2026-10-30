import { ConvexError } from 'convex/values';

/** Legacy settings transports encode headers as JSON text. Store only string maps. */
export function parseWebhookHeaders(text: string | undefined) {
  if (text === undefined || text === '') return undefined;
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new ConvexError('Webhook headers must be a JSON object of strings');
  }
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    !Object.values(value).every(item => typeof item === 'string')
  ) {
    throw new ConvexError('Webhook headers must be a JSON object of strings');
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, String(item)])
  );
}
