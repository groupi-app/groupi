import { internalQuery, internalMutation } from '../../../_generated/server';
import { v } from 'convex/values';
import { Id } from '../../../_generated/dataModel';
import { getAddonHandler } from '../../../addons/registry';
import { dispatchSingleAddonLifecycle } from '../../../addons/lifecycle';
import {
  validatedConfiguration,
  publicConfiguration,
  requireConfigurationRole,
} from './addonConfiguration';
import { disableAddonConfiguration } from '../../../addons/mutations';

/** Max size for addon config/data payloads (64KB stringified) */
const MAX_DATA_SIZE = 64 * 1024;

function validateDataSize(data: unknown): void {
  const size = JSON.stringify(data).length;
  if (size > MAX_DATA_SIZE) {
    throw new Error(
      `Data payload too large (${size} bytes). Maximum is ${MAX_DATA_SIZE} bytes.`
    );
  }
}

/**
 * List all addon configs for an event.
 */
export const listEventAddons = internalQuery({
  args: {
    eventId: v.string(),
  },
  handler: async (ctx, { eventId }) => {
    const configs = await ctx.db
      .query('eventAddonConfigs')
      .withIndex('by_event', q => q.eq('eventId', eventId as Id<'events'>))
      .collect();

    return configs.map(c => ({
      id: c._id,
      addonType: c.addonType,
      enabled: c.enabled,
      config: publicConfiguration(c.addonType, c.config),
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));
  },
});

/**
 * Enable an addon for an event.
 * Validates config with the handler before persisting.
 */
export const enableAddon = internalMutation({
  args: {
    eventId: v.string(),
    personId: v.string(),
    addonType: v.string(),
    config: v.any(),
  },
  handler: async (ctx, { eventId, personId, addonType, config }) => {
    const typedEventId = eventId as Id<'events'>;

    config = await validatedConfiguration(
      ctx,
      typedEventId,
      personId as Id<'persons'>,
      addonType,
      config,
      true
    );

    const now = Date.now();

    const existing = await ctx.db
      .query('eventAddonConfigs')
      .withIndex('by_event_addon', q =>
        q.eq('eventId', typedEventId).eq('addonType', addonType)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        enabled: true,
        config,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert('eventAddonConfigs', {
        eventId: typedEventId,
        addonType,
        enabled: true,
        config,
        createdAt: now,
        updatedAt: now,
      });
    }

    await dispatchSingleAddonLifecycle(
      ctx,
      typedEventId,
      addonType,
      existing?.enabled ? 'onConfigUpdated' : 'onEnabled',
      config,
      existing?.config,
      undefined,
      personId as Id<'persons'>
    );

    return { success: true };
  },
});

/**
 * Disable an addon for an event.
 */
export const disableAddon = internalMutation({
  args: {
    eventId: v.string(),
    addonType: v.string(),
    personId: v.string(),
  },
  handler: async (ctx, { eventId, addonType, personId }) => {
    const typedEventId = eventId as Id<'events'>;

    await requireConfigurationRole(
      ctx,
      typedEventId,
      personId as Id<'persons'>
    );
    return disableAddonConfiguration(ctx, typedEventId, addonType);
  },
});

/**
 * Update config for an already-enabled addon.
 */
export const updateAddonConfig = internalMutation({
  args: {
    eventId: v.string(),
    personId: v.string(),
    addonType: v.string(),
    config: v.any(),
  },
  handler: async (ctx, { eventId, personId, addonType, config }) => {
    const typedEventId = eventId as Id<'events'>;

    config = await validatedConfiguration(
      ctx,
      typedEventId,
      personId as Id<'persons'>,
      addonType,
      config,
      false
    );

    const existing = await ctx.db
      .query('eventAddonConfigs')
      .withIndex('by_event_addon', q =>
        q.eq('eventId', typedEventId).eq('addonType', addonType)
      )
      .first();

    if (!existing || !existing.enabled) {
      throw new Error(`Add-on ${addonType} is not enabled for this event`);
    }

    const oldConfig = existing.config;

    await ctx.db.patch(existing._id, {
      config,
      updatedAt: Date.now(),
    });

    await dispatchSingleAddonLifecycle(
      ctx,
      typedEventId,
      addonType,
      'onConfigUpdated',
      config,
      oldConfig,
      undefined,
      personId as Id<'persons'>
    );

    // Return updated config
    const updated = await ctx.db.get(existing._id);
    return {
      id: updated!._id,
      addonType: updated!.addonType,
      enabled: updated!.enabled,
      config: publicConfiguration(updated!.addonType, updated!.config),
      createdAt: updated!.createdAt,
      updatedAt: updated!.updatedAt,
    };
  },
});

/**
 * Get all data entries for an addon on an event.
 */
export const getAddonData = internalQuery({
  args: {
    eventId: v.string(),
    addonType: v.string(),
  },
  handler: async (ctx, { eventId, addonType }) => {
    const entries = await ctx.db
      .query('addonData')
      .withIndex('by_event_addon', q =>
        q.eq('eventId', eventId as Id<'events'>).eq('addonType', addonType)
      )
      .collect();

    return entries.map(e => ({
      id: e._id,
      key: e.key,
      data: e.data,
      createdBy: e.createdBy ?? null,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    }));
  },
});

/**
 * Set (upsert) a data entry for an addon.
 */
export const setAddonData = internalMutation({
  args: {
    eventId: v.string(),
    addonType: v.string(),
    key: v.string(),
    data: v.any(),
    personId: v.string(),
  },
  handler: async (ctx, { eventId, addonType, key, data, personId }) => {
    const typedEventId = eventId as Id<'events'>;
    const typedPersonId = personId as Id<'persons'>;

    // Verify addon type is registered
    const handler = getAddonHandler(addonType);
    if (!handler) {
      throw new Error(`Unknown add-on type: ${addonType}`);
    }

    // Verify addon is enabled
    const addonConfig = await ctx.db
      .query('eventAddonConfigs')
      .withIndex('by_event_addon', q =>
        q.eq('eventId', typedEventId).eq('addonType', addonType)
      )
      .first();
    if (!addonConfig?.enabled) {
      throw new Error(`Add-on ${addonType} is not enabled for this event`);
    }

    validateDataSize(data);

    const now = Date.now();

    const existing = await ctx.db
      .query('addonData')
      .withIndex('by_event_addon_key', q =>
        q.eq('eventId', typedEventId).eq('addonType', addonType).eq('key', key)
      )
      .first();

    if (existing) {
      // Only the creator or a MODERATOR+ can update
      if (existing.createdBy !== typedPersonId) {
        // Check role — caller must be MODERATOR+
        const membership = await ctx.db
          .query('memberships')
          .withIndex('by_person_event', q =>
            q.eq('personId', typedPersonId).eq('eventId', typedEventId)
          )
          .first();
        const roleHierarchy: Record<string, number> = {
          ORGANIZER: 3,
          MODERATOR: 2,
          ATTENDEE: 1,
        };
        if (!membership || (roleHierarchy[membership.role] ?? 0) < 2) {
          throw new Error(
            'Only the creator or a moderator can update this entry'
          );
        }
      }

      await ctx.db.patch(existing._id, { data, updatedAt: now });
      return {
        id: existing._id,
        key: existing.key,
        data,
        createdBy: (existing.createdBy as string) ?? null,
        createdAt: existing.createdAt,
        updatedAt: now,
        created: false,
      };
    } else {
      const id = await ctx.db.insert('addonData', {
        eventId: typedEventId,
        addonType,
        key,
        data,
        createdBy: typedPersonId,
        createdAt: now,
        updatedAt: now,
      });
      return {
        id,
        key,
        data,
        createdBy: personId,
        createdAt: now,
        updatedAt: now,
        created: true,
      };
    }
  },
});

/**
 * Delete a data entry for an addon.
 */
export const deleteAddonData = internalMutation({
  args: {
    eventId: v.string(),
    addonType: v.string(),
    key: v.string(),
    personId: v.string(),
  },
  handler: async (ctx, { eventId, addonType, key, personId }) => {
    const typedEventId = eventId as Id<'events'>;
    const typedPersonId = personId as Id<'persons'>;

    const entry = await ctx.db
      .query('addonData')
      .withIndex('by_event_addon_key', q =>
        q.eq('eventId', typedEventId).eq('addonType', addonType).eq('key', key)
      )
      .first();

    if (!entry) {
      return { success: true };
    }

    // Only the creator or MODERATOR+ can delete
    if (entry.createdBy !== typedPersonId) {
      const membership = await ctx.db
        .query('memberships')
        .withIndex('by_person_event', q =>
          q.eq('personId', typedPersonId).eq('eventId', typedEventId)
        )
        .first();
      const roleHierarchy: Record<string, number> = {
        ORGANIZER: 3,
        MODERATOR: 2,
        ATTENDEE: 1,
      };
      if (!membership || (roleHierarchy[membership.role] ?? 0) < 2) {
        throw new Error(
          'Only the creator or a moderator can delete this entry'
        );
      }
    }

    await ctx.db.delete(entry._id);
    return { success: true };
  },
});

/** Existing owned published templates available to attach to an event. */
export const listPublishedTemplates = internalQuery({
  args: { personId: v.string() },
  handler: async (ctx, { personId }) => {
    const templates = await ctx.db
      .query('addonTemplates')
      .withIndex('by_owner_published', q =>
        q.eq('ownerId', personId as Id<'persons'>).eq('isPublished', true)
      )
      .collect();
    return templates.map(t => ({
      id: t._id,
      addonType: `custom:${t._id}`,
      name: t.name,
      description: t.description,
      version: t.version,
      template: (
        publicConfiguration(`custom:${t._id}`, {
          template: t.template,
        }) as Record<string, unknown>
      ).template,
    }));
  },
});

export const listEventAddonsPage = internalQuery({
  args: {
    eventId: v.string(),
    limit: v.number(),
    cursor: v.union(v.string(), v.null()),
  },
  handler: async (ctx, { eventId, limit, cursor }) => {
    const page = await ctx.db
      .query('eventAddonConfigs')
      .withIndex('by_event', q => q.eq('eventId', eventId as Id<'events'>))
      .paginate({ numItems: limit, cursor });
    return {
      items: page.page.map(c => ({
        id: c._id,
        addonType: c.addonType,
        enabled: c.enabled,
        config: publicConfiguration(c.addonType, c.config),
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
      nextCursor: page.isDone ? null : page.continueCursor,
    };
  },
});
export const listPublishedTemplatesPage = internalQuery({
  args: {
    personId: v.string(),
    limit: v.number(),
    cursor: v.union(v.string(), v.null()),
  },
  handler: async (ctx, { personId, limit, cursor }) => {
    const page = await ctx.db
      .query('addonTemplates')
      .withIndex('by_owner_published', q =>
        q.eq('ownerId', personId as Id<'persons'>).eq('isPublished', true)
      )
      .paginate({ numItems: limit, cursor });
    return {
      items: page.page.map(t => ({
        id: t._id,
        addonType: `custom:${t._id}`,
        name: t.name,
        description: t.description,
        version: t.version,
        template: (
          publicConfiguration(`custom:${t._id}`, {
            template: t.template,
          }) as Record<string, unknown>
        ).template,
      })),
      nextCursor: page.isDone ? null : page.continueCursor,
    };
  },
});
