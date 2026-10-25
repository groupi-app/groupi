import { AddonDataSchema } from './schemas';
import { ConvexError } from 'convex/values';
import type { MutationCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';
import { getAddonHandler } from './registry';
import { dispatchSingleAddonLifecycle } from './lifecycle';
import { validateParticipationData, claimItems } from './participation';
function forbidden(message: string): never {
  throw new ConvexError({ code: 'FORBIDDEN', message });
}
const MAX_DATA_SIZE = 64 * 1024;
function validateDataSize(data: unknown): void {
  const size = new TextEncoder().encode(JSON.stringify(data)).byteLength;
  if (size > MAX_DATA_SIZE) {
    throw new Error(
      `Data payload too large (${size} bytes). Maximum is ${MAX_DATA_SIZE} bytes.`
    );
  }
}

const RESERVED_PERSON_KEY_PREFIXES = ['response:', 'claims:'] as const;

/**
 * Response and claim keys are identity-bearing records. Their person suffix
 * must always match the authenticated caller, including for moderators.
 */
function requireOwnedReservedKey(key: string, personId: string): boolean {
  for (const prefix of RESERVED_PERSON_KEY_PREFIXES) {
    if (key.startsWith(prefix)) {
      if (key.slice(prefix.length) !== personId) {
        forbidden('Reserved add-on data key must belong to the current user');
      }
      return true;
    }
  }
  if (/^(vote|toggle):/.test(key)) {
    if (!key.endsWith(`:${personId}`))
      forbidden('Reserved add-on data key must belong to the current user');
    return true;
  }
  return false;
}

export async function setAddonDataForPerson(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  {
    eventId,
    addonType,
    key,
    data,
  }: { eventId: Id<'events'>; addonType: string; key: string; data: unknown }
) {
  // Verify addon type is registered
  const handler = getAddonHandler(addonType);
  if (!handler) {
    throw new Error(`Unknown add-on type: ${addonType}`);
  }

  // Verify membership
  const membership = await ctx.db
    .query('memberships')
    .withIndex('by_person_event', q =>
      q.eq('personId', personId).eq('eventId', eventId)
    )
    .first();
  if (!membership) {
    forbidden('Event membership required: you are not a member of this event');
  }

  const isOwnedReservedKey = requireOwnedReservedKey(key, personId);

  // Verify addon is enabled
  const addonConfig = await ctx.db
    .query('eventAddonConfigs')
    .withIndex('by_event_addon', q =>
      q.eq('eventId', eventId).eq('addonType', addonType)
    )
    .first();
  if (!addonConfig?.enabled) {
    throw new Error(`Add-on ${addonType} is not enabled for this event`);
  }

  validateParticipationData(addonType, addonConfig.config, key, data, personId);

  // Validate data size
  validateDataSize(data);
  if (key === `claims:${personId}`) {
    const entries = await ctx.db
      .query('addonData')
      .withIndex('by_event_addon', q =>
        q.eq('eventId', eventId).eq('addonType', addonType)
      )
      .collect();
    for (const item of claimItems(addonType, addonConfig.config)) {
      const requested = (data as Record<string, number>)[item.id] ?? 0;
      const others = entries
        .filter(e => e.key.startsWith('claims:') && e.key !== key)
        .reduce((total, e) => {
          const quantity =
            typeof e.data === 'object' ? e.data[item.id] : undefined;
          return total + (typeof quantity === 'number' ? quantity : 0);
        }, 0);
      if (requested > 0 && requested + others > item.quantity)
        throw new Error(`Not enough remaining quantity for ${item.id}`);
    }
  }

  const now = Date.now();

  // Check for existing entry
  const existing = await ctx.db
    .query('addonData')
    .withIndex('by_event_addon_key', q =>
      q.eq('eventId', eventId).eq('addonType', addonType).eq('key', key)
    )
    .first();

  let resultId: Id<'addonData'>;
  let created;

  if (existing) {
    // Only the creator or a MODERATOR+ can update existing entries
    const isCreator = existing.createdBy === personId || isOwnedReservedKey;
    if (!isCreator) {
      if (membership.role !== 'MODERATOR' && membership.role !== 'ORGANIZER')
        throw new Error(
          'Only the creator or a moderator can change this entry'
        );
    }

    await ctx.db.patch(existing._id, {
      data: AddonDataSchema.parse(data),
      ...(isOwnedReservedKey && { createdBy: personId }),
      updatedAt: now,
    });
    resultId = existing._id;
    created = false;
  } else {
    resultId = await ctx.db.insert('addonData', {
      eventId,
      addonType,
      key,
      data: AddonDataSchema.parse(data),
      createdBy: personId,
      createdAt: now,
      updatedAt: now,
    });
    created = true;
  }

  // Dispatch onDataSubmitted lifecycle to all enabled addons of this type
  await dispatchSingleAddonLifecycle(
    ctx,
    eventId,
    addonType,
    'onDataSubmitted',
    undefined,
    undefined,
    { key, data, submitterId: personId },
    personId
  );

  return { id: resultId, created };
}

export async function deleteAddonDataForPerson(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  {
    eventId,
    addonType,
    key,
  }: { eventId: Id<'events'>; addonType: string; key: string }
) {
  // Verify membership first
  const membership = await ctx.db
    .query('memberships')
    .withIndex('by_person_event', q =>
      q.eq('personId', personId).eq('eventId', eventId)
    )
    .first();
  if (!membership) {
    forbidden('Event membership required: you are not a member of this event');
  }

  const isOwnedReservedKey = requireOwnedReservedKey(key, personId);
  const config = await ctx.db
    .query('eventAddonConfigs')
    .withIndex('by_event_addon', q =>
      q.eq('eventId', eventId).eq('addonType', addonType)
    )
    .first();
  if (!config?.enabled) throw new Error('Add-on is not enabled');
  if (
    !isOwnedReservedKey ||
    addonType === 'discord' ||
    addonType === 'reminders'
  )
    throw new Error('Only participant records can be cleared');

  const entry = await ctx.db
    .query('addonData')
    .withIndex('by_event_addon_key', q =>
      q.eq('eventId', eventId).eq('addonType', addonType).eq('key', key)
    )
    .first();

  if (!entry) {
    return { success: true };
  }

  // Only the creator or a MODERATOR+ can delete
  const isCreator = entry.createdBy === personId || isOwnedReservedKey;
  if (!isCreator) {
    if (membership.role !== 'MODERATOR' && membership.role !== 'ORGANIZER')
      throw new Error('Only the creator or a moderator can change this entry');
  }

  await ctx.db.delete(entry._id);
  return { success: true };
}
