import { v } from 'convex/values';

export const bugReportSubmission = v.object({
  submissionId: v.string(),
  description: v.string(),
  reproductionSteps: v.optional(v.string()),
  replyEmail: v.optional(v.string()),
  images: v.optional(
    v.array(
      v.object({
        base64: v.string(),
        mimeType: v.union(
          v.literal('image/png'),
          v.literal('image/jpeg'),
          v.literal('image/webp')
        ),
      })
    )
  ),
  includeReplay: v.boolean(),
  replayId: v.optional(v.string()),
  context: v.optional(
    v.object({ platform: v.literal('web'), release: v.optional(v.string()) })
  ),
});
export const bugReportResult = v.union(
  v.object({ status: v.literal('accepted'), eventId: v.string() }),
  v.object({
    status: v.literal('failed'),
    code: v.string(),
    retryAfterMs: v.optional(v.number()),
  }),
  v.object({ status: v.literal('outcome-unknown'), code: v.string() }),
  v.object({ status: v.literal('in-progress'), retryAfterMs: v.number() }),
  v.object({ status: v.literal('not-found') })
);

/** Reconstruct only the public receipt fields; never relay upstream extras. */
export function parseBugReportResult(value: unknown) {
  if (!value || typeof value !== 'object' || !('status' in value)) return null;
  if (
    value.status === 'accepted' &&
    'eventId' in value &&
    typeof value.eventId === 'string' &&
    /^[0-9a-f]{32}$/.test(value.eventId)
  )
    return { status: 'accepted' as const, eventId: value.eventId };
  if (value.status === 'not-found') return { status: 'not-found' as const };
  if (
    value.status === 'in-progress' &&
    'retryAfterMs' in value &&
    typeof value.retryAfterMs === 'number' &&
    Number.isFinite(value.retryAfterMs) &&
    value.retryAfterMs >= 0 &&
    value.retryAfterMs <= 3_600_000
  )
    return { status: 'in-progress' as const, retryAfterMs: value.retryAfterMs };
  if (
    (value.status !== 'failed' && value.status !== 'outcome-unknown') ||
    !('code' in value) ||
    typeof value.code !== 'string'
  )
    return null;
  const codes = new Set([
    'description-required',
    'message-too-long',
    'invalid-email',
    'feedback-too-large',
    'invalid-submission-id',
    'replay-without-consent',
    'replay-unavailable',
    'invalid-replay',
    'invalid-context',
    'request-too-large',
    'image-count',
    'images-too-large',
    'invalid-image',
    'unavailable',
    'invalid-input',
    'forbidden',
    'submission-conflict',
    'rate-limited',
    'busy',
    'upstream-rejected',
    'upstream-unavailable',
    'network-uncertain',
    'interrupted',
  ]);
  if (!codes.has(value.code)) return null;
  if (value.status === 'outcome-unknown')
    return { status: 'outcome-unknown' as const, code: value.code };
  if ('retryAfterMs' in value) {
    if (
      typeof value.retryAfterMs !== 'number' ||
      !Number.isFinite(value.retryAfterMs) ||
      value.retryAfterMs < 0 ||
      value.retryAfterMs > 3_600_000
    )
      return null;
    return {
      status: 'failed' as const,
      code: value.code,
      retryAfterMs: value.retryAfterMs,
    };
  }
  return { status: 'failed' as const, code: value.code };
}
