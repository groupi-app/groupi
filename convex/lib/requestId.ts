import { ConvexError } from 'convex/values';
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, canonical(item)])
    );
  return value;
}
export async function hash(value: unknown) {
  const bytes = new Uint8Array(
    await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(JSON.stringify(canonical(value)))
    )
  );
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

export function requestExpiry(
  requestId: string,
  recovery = 'Inspect invitations before using a new identifier.'
) {
  if (
    !/^\d{13}\.[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
      requestId
    )
  )
    throw new ConvexError({
      code: 'VALIDATION_ERROR',
      message: 'Idempotency-Key must be <unix-ms>.<uuid-v4>.',
    });
  const issued = Number(requestId.split('.')[0]);
  if (issued > Date.now() + 300000)
    throw new ConvexError({
      code: 'VALIDATION_ERROR',
      message: 'Idempotency-Key timestamp is too far in the future.',
    });
  const expiresAt = issued + 86400000;
  if (expiresAt <= Date.now())
    throw new ConvexError({
      code: 'IDEMPOTENCY_EXPIRED',
      message: `Request identifier expired after 24 hours. ${recovery}`,
    });
  return expiresAt;
}
