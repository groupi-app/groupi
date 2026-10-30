import { v } from 'convex/values';
import type { Id } from '../_generated/dataModel';
import type { MutationCtx, QueryCtx } from '../_generated/server';
import { livePerson } from '../groups/model';
import {
  contentContext,
  requireContentInteraction,
} from '../groupTools/context';
import { fail, instance, resolvedOptions } from './access';

type ReadCtx = QueryCtx | MutationCtx;
const claimantPreviewLimit = 5;

export const bringClaimSummary = v.object({
  entryId: v.id('groupListEntries'),
  totalClaimed: v.number(),
  myQuantity: v.number(),
  myRevision: v.number(),
  hasMoreClaimants: v.boolean(),
  claimants: v.array(
    v.object({
      personId: v.id('persons'),
      name: v.string(),
      quantity: v.number(),
    })
  ),
});
export const bringClaimResult = v.object({
  revision: v.number(),
  quantity: v.number(),
  totalClaimed: v.number(),
});

async function requireBring(
  ctx: ReadCtx,
  personId: Id<'persons'>,
  toolId: Id<'groupTools'>
) {
  const data = await instance(ctx, toolId);
  await requireContentInteraction(ctx, personId, data.tool, 'LIST');
  if (resolvedOptions(data.state).listType !== 'BRING')
    fail('VALIDATION_ERROR', 'This list does not use quantity claims.');
  if (data.tool.resultsVisibility !== 'MEMBERS')
    fail('FORBIDDEN', 'Bring Lists require shared item visibility.');
  return data;
}
async function activeClaims(ctx: ReadCtx, entryId: Id<'groupListEntries'>) {
  return ctx.db
    .query('groupListClaims')
    .withIndex('by_entryId_and_quantity', q =>
      q.eq('entryId', entryId).gt('quantity', 0)
    )
    .collect();
}

/** Read only the requested, visible items. Zero tombstones do not inflate summaries. */
export async function claims(
  ctx: ReadCtx,
  personId: Id<'persons'>,
  input: { toolId: Id<'groupTools'>; entryIds: Id<'groupListEntries'>[] }
) {
  await requireBring(ctx, personId, input.toolId);
  if (
    input.entryIds.length > 100 ||
    new Set(input.entryIds).size !== input.entryIds.length
  )
    fail('VALIDATION_ERROR', 'Request at most 100 distinct Bring List items.');
  const names = new Map<Id<'persons'>, Promise<string>>();
  const name = (id: Id<'persons'>) => {
    let lookup = names.get(id);
    if (!lookup) {
      lookup = livePerson(ctx, id).then(
        identity =>
          identity?.user.name?.trim() ||
          identity?.user.username?.trim() ||
          'Member'
      );
      names.set(id, lookup);
    }
    return lookup;
  };
  return Promise.all(
    input.entryIds.map(async entryId => {
      const entry = await ctx.db.get(entryId);
      if (!entry || entry.toolId !== input.toolId)
        fail('NOT_FOUND', 'Bring List item is unavailable in this list.');
      const [rows, mine] = await Promise.all([
        ctx.db
          .query('groupListClaims')
          .withIndex('by_entryId_and_quantity', q =>
            q.eq('entryId', entryId).gt('quantity', 0)
          )
          .take(claimantPreviewLimit + 1),
        ctx.db
          .query('groupListClaims')
          .withIndex('by_entryId_and_personId', q =>
            q.eq('entryId', entryId).eq('personId', personId)
          )
          .unique(),
      ]);
      return {
        entryId,
        totalClaimed: entry.claimedQuantity ?? 0,
        myQuantity: mine?.quantity ?? 0,
        myRevision: mine?.revision ?? 0,
        hasMoreClaimants: rows.length > claimantPreviewLimit,
        claimants: await Promise.all(
          rows.slice(0, claimantPreviewLimit).map(async row => ({
            personId: row.personId,
            name: await name(row.personId),
            quantity: row.quantity,
          }))
        ),
      };
    })
  );
}

/** Capacity and the authenticated person's claim change in the same transaction. */
export async function setClaim(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  input: {
    toolId: Id<'groupTools'>;
    entryId: Id<'groupListEntries'>;
    version: number;
    expectedClaimRevision: number;
    quantity: number;
  }
) {
  const { tool, state } = await requireBring(ctx, personId, input.toolId);
  if (!Number.isInteger(input.version) || input.version !== state.version)
    fail('CONFLICT', 'List settings changed. Reload before changing claims.');
  if (
    !Number.isInteger(input.expectedClaimRevision) ||
    input.expectedClaimRevision < 0
  )
    fail('VALIDATION_ERROR', 'Claim revision must be a nonnegative integer.');
  if (
    !Number.isInteger(input.quantity) ||
    input.quantity < 0 ||
    input.quantity > 999
  )
    fail(
      'VALIDATION_ERROR',
      'Claim quantity must be an integer from 0 to 999.'
    );
  const entry = await ctx.db.get(input.entryId);
  if (!entry || entry.toolId !== input.toolId)
    fail('NOT_FOUND', 'Bring List item is unavailable in this list.');
  if (
    !Number.isInteger(entry.quantity) ||
    !entry.quantity ||
    entry.quantity < 1 ||
    entry.quantity > 999
  )
    fail('VALIDATION_ERROR', 'Set an item quantity before claiming it.');
  const [mine, rows] = await Promise.all([
    ctx.db
      .query('groupListClaims')
      .withIndex('by_entryId_and_personId', q =>
        q.eq('entryId', entry._id).eq('personId', personId)
      )
      .unique(),
    activeClaims(ctx, entry._id),
  ]);
  const current = rows.reduce((total, row) => total + row.quantity, 0);
  if ((mine?.quantity ?? 0) === input.quantity)
    return {
      revision: mine?.revision ?? 0,
      quantity: input.quantity,
      totalClaimed: current,
    };
  if ((mine?.revision ?? 0) !== input.expectedClaimRevision)
    fail('CONFLICT', 'Your claim changed. Review it before trying again.');
  const totalClaimed = current - (mine?.quantity ?? 0) + input.quantity;
  if (totalClaimed > entry.quantity)
    fail('CONFLICT', 'Not enough items remain to claim this quantity.');
  const now = Date.now();
  const revision = (mine?.revision ?? 0) + 1;
  if (mine)
    await ctx.db.patch(mine._id, {
      quantity: input.quantity,
      revision,
      updatedAt: now,
    });
  else
    await ctx.db.insert('groupListClaims', {
      toolId: tool._id,
      ...contentContext(tool),
      entryId: entry._id,
      personId,
      quantity: input.quantity,
      revision,
      createdAt: now,
      updatedAt: now,
    });
  await ctx.db.patch(entry._id, { claimedQuantity: totalClaimed });
  return { revision, quantity: input.quantity, totalClaimed };
}

export async function purgeEntryClaims(
  ctx: MutationCtx,
  entryId: Id<'groupListEntries'>
) {
  for await (const row of ctx.db
    .query('groupListClaims')
    .withIndex('by_entryId', q => q.eq('entryId', entryId)))
    await ctx.db.delete(row._id);
  if (await ctx.db.get(entryId))
    await ctx.db.patch(entryId, { claimedQuantity: 0 });
}
export async function purgeListClaims(
  ctx: MutationCtx,
  toolId: Id<'groupTools'>
) {
  const entries = new Set<Id<'groupListEntries'>>();
  for await (const row of ctx.db
    .query('groupListClaims')
    .withIndex('by_toolId', q => q.eq('toolId', toolId))) {
    entries.add(row.entryId);
    await ctx.db.delete(row._id);
  }
  for (const entryId of entries)
    if (await ctx.db.get(entryId))
      await ctx.db.patch(entryId, { claimedQuantity: 0 });
}
export async function cleanupPersonClaims(
  ctx: MutationCtx,
  personId: Id<'persons'>
) {
  for await (const row of ctx.db
    .query('groupListClaims')
    .withIndex('by_personId', q => q.eq('personId', personId))) {
    const entry = await ctx.db.get(row.entryId);
    if (entry) {
      const rows = await activeClaims(ctx, entry._id);
      const total = rows.reduce((sum, claim) => sum + claim.quantity, 0);
      await ctx.db.patch(entry._id, {
        claimedQuantity: Math.max(0, total - row.quantity),
      });
    }
    await ctx.db.delete(row._id);
  }
}
