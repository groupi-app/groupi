import { ConvexError } from 'convex/values';
import type { MutationCtx } from '../_generated/server';
import { secretHash } from '../authorization/model';
/** Receipts expire at 30 days. Recognized IDs remain permanent mismatch tombstones.
 * No cleanup deletes their binding: an uncertain old intent cannot become a new write.
 * Call only after live authorization, within the same write transaction as the effect. */
export const receiptWindowMs = 30 * 24 * 60 * 60 * 1000;
export function operationError(code: string, message: string): never {
  throw new ConvexError({ code, message });
}
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object')
    return `{${Object.entries(value)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`)
      .join(',')}}`;
  return JSON.stringify(value);
}
export async function receiptBinding(value: unknown) {
  return secretHash(canonical(value));
}
export async function priorReceipt(
  ctx: MutationCtx,
  operationId: string,
  binding: string,
  now: number
) {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      operationId
    )
  )
    operationError('VALIDATION_ERROR', 'A UUID Idempotency-Key is required.');
  const receipt = await ctx.db
    .query('communityOperationReceipts')
    .withIndex('by_operationId', q => q.eq('operationId', operationId))
    .unique();
  if (!receipt) return null;
  if (receipt.binding !== binding)
    operationError(
      'IDEMPOTENCY_CONFLICT',
      'Operation ID is bound to a different intent.'
    );
  if (receipt.expiresAt <= now)
    operationError(
      'IDEMPOTENCY_EXPIRED',
      'Receipt expired. Reconcile authorized current state before creating a new intent.'
    );
  return receipt.result;
}
export async function saveReceipt(
  ctx: MutationCtx,
  operationId: string,
  binding: string,
  result: unknown,
  now: number
) {
  await ctx.db.insert('communityOperationReceipts', {
    operationId,
    binding,
    result: JSON.stringify(result),
    acceptedAt: now,
    expiresAt: now + receiptWindowMs,
  });
}
