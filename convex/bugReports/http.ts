import { z } from 'zod';
import type { Infer } from 'convex/values';
import { httpAction } from '../_generated/server';
import { internal } from '../_generated/api';
import { BUG_REPORT_LIMITS } from '@groupi/shared/utils';
import { submission } from './contracts';

// The HTTP adapter owns strict wire decoding; the internal action independently
// validates its Convex arguments. No arbitrary identity/context can cross here.
const wire: z.ZodType<Infer<typeof submission>> = z.strictObject({
  submissionId: z.string(),
  description: z.string(),
  reproductionSteps: z.string().optional(),
  replyEmail: z.string().optional(),
  images: z
    .array(
      z.strictObject({
        base64: z.string(),
        mimeType: z.enum(['image/png', 'image/jpeg', 'image/webp']),
      })
    )
    .optional(),
  includeReplay: z.boolean(),
  replayId: z.string().optional(),
  context: z
    .strictObject({
      platform: z.literal('web'),
      release: z.string().optional(),
    })
    .optional(),
});
const receiptWire = z.strictObject({
  submissionId: z
    .string()
    .regex(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    ),
});
const json = (value: unknown, status = 200) =>
  Response.json(value, { status, headers: { 'Cache-Control': 'no-store' } });

export const submit = httpAction(async (ctx, request) => {
  const secret = process.env.BUG_REPORT_PROXY_SECRET;
  if (!secret || secret.length < 32 || secret.length > 256)
    return json({ status: 'failed', code: 'unavailable' }, 503);
  const proof = request.headers.get('x-groupi-bug-proxy') ?? '';
  if (proof.length > 256)
    return json({ status: 'failed', code: 'forbidden' }, 403);
  // Compare fixed-length digests, not a prefix-sensitive secret string.
  const digest = async (value: string) =>
    new Uint8Array(
      await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
    );
  const [expected, actual] = await Promise.all([digest(secret), digest(proof)]);
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) mismatch |= expected[i] ^ actual[i];
  const networkKey = request.headers.get('x-groupi-bug-network') ?? '';
  if (mismatch || !/^[0-9a-f]{64}$/.test(networkKey))
    return json({ status: 'failed', code: 'forbidden' }, 403);
  if (
    request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !==
    'application/json'
  )
    return json({ status: 'failed', code: 'invalid-input' }, 415);
  const isReceipt = new URL(request.url).pathname === '/bug-reports/receipt';
  const maxBytes = isReceipt ? 1024 : BUG_REPORT_LIMITS.requestBytes;
  if (Number(request.headers.get('content-length')) > maxBytes)
    return json({ status: 'failed', code: 'request-too-large' }, 413);
  const reader = request.body?.getReader();
  if (!reader) return json({ status: 'failed', code: 'invalid-input' }, 400);
  const chunks: Uint8Array[] = [];
  let size = 0;
  let input: unknown;
  try {
    // Default Convex runtime does not expose Node timers. The authenticated
    // managed proxy bounds upload time; this boundary independently bounds bytes.
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes)
        return json({ status: 'failed', code: 'request-too-large' }, 413);
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    input = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch {
    return json({ status: 'failed', code: 'invalid-input' }, 400);
  } finally {
    void reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
  if (isReceipt) {
    const decoded = receiptWire.safeParse(input);
    if (!decoded.success)
      return json({ status: 'failed', code: 'invalid-submission-id' }, 400);
    try {
      return json(
        await ctx.runMutation(internal.bugReports.receipts.lookup, {
          submissionId: decoded.data.submissionId,
          networkKey,
        })
      );
    } catch {
      return json(
        { status: 'outcome-unknown', code: 'network-uncertain' },
        503
      );
    }
  }
  const decoded = wire.safeParse(input);
  if (!decoded.success)
    return json({ status: 'failed', code: 'invalid-input' }, 400);
  try {
    return json(
      await ctx.runAction(internal.bugReports.actions.submit, {
        report: decoded.data,
        networkKey,
      })
    );
  } catch {
    // Includes a failure to persist the receipt after upstream acceptance. Never
    // label this a definite failure or invite an automatic duplicate submission.
    return json({ status: 'outcome-unknown', code: 'network-uncertain' }, 503);
  }
});
