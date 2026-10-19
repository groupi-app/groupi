import { components } from '../_generated/api';
import type { Doc as AuthDoc } from '../betterAuth/_generated/dataModel';
import type { MutationCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';
import { accountActive } from '../authorization/model';
import { operationError } from '../groups/operationReceipts';
/** Recheck credential and resource scope inside the domain write transaction. */
export async function requireLegacyWriteCredential(
  ctx: MutationCtx,
  actorId: Id<'persons'>,
  credentialId: string,
  resource: 'groups' | 'events'
) {
  const person = await accountActive(ctx, actorId, Date.now());
  const records = await ctx.runQuery(components.betterAuth.adapter.findMany, {
    model: 'apikey',
    where: [{ field: '_id', operator: 'eq', value: credentialId }],
    paginationOpts: { cursor: null, numItems: 1 },
  });
  const key = records.page[0] as AuthDoc<'apikey'> | undefined;
  if (
    !key ||
    key.userId !== person.userId ||
    key.enabled === false ||
    (key.expiresAt != null && key.expiresAt <= Date.now())
  )
    operationError('FORBIDDEN', 'Current staff credential required.');
  if (key.permissions != null) {
    let permissions: unknown;
    try {
      permissions = JSON.parse(key.permissions);
    } catch {
      operationError('FORBIDDEN', `Current ${resource} write scope required.`);
    }
    if (
      !permissions ||
      typeof permissions !== 'object' ||
      !Array.isArray((permissions as Record<string, unknown>)[resource]) ||
      !(
        (permissions as Record<string, unknown>)[resource] as unknown[]
      ).includes('write')
    )
      operationError('FORBIDDEN', `Current ${resource} write scope required.`);
  }
}
