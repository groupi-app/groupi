import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import { requireAuth, requireEventRole } from '../auth';
import { getAddonHandler } from './registry';
import { dispatchSingleAddonLifecycle } from './lifecycle';

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
 * Enable an add-on for an event. Creates or updates the config row.
 * Requires MODERATOR+ role.
 */
export const enableAddon = mutation({
  args: {
    eventId: v.id('events'),
    addonType: v.string(),
    config: v.any(),
  },
  handler: async (ctx, { eventId, addonType, config }) => {
    await requireEventRole(ctx, eventId, 'MODERATOR');

    // Validate the config with the handler
    const handler = getAddonHandler(addonType);
    if (!handler) {
      throw new Error(`Unknown add-on type: ${addonType}`);
    }
    if (!handler.validateConfig(config)) {
      throw new Error(`Invalid config for add-on: ${addonType}`);
    }

    // Validate config size
    validateDataSize(config);

    const now = Date.now();

    // Check for existing config
    const existing = await ctx.db
      .query('eventAddonConfigs')
      .withIndex('by_event_addon', q =>
        q.eq('eventId', eventId).eq('addonType', addonType)
      )
      .first();

    if (existing) {
      // Re-enable and update config
      await ctx.db.patch(existing._id, {
        enabled: true,
        config,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert('eventAddonConfigs', {
        eventId,
        addonType,
        enabled: true,
        config,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Dispatch lifecycle
    await dispatchSingleAddonLifecycle(
      ctx,
      eventId,
      addonType,
      'onEnabled',
      config
    );

    return { success: true };
  },
});

/**
 * Disable an add-on for an event.
 * Requires MODERATOR+ role.
 */
export const disableAddon = mutation({
  args: {
    eventId: v.id('events'),
    addonType: v.string(),
  },
  handler: async (ctx, { eventId, addonType }) => {
    await requireEventRole(ctx, eventId, 'MODERATOR');

    const existing = await ctx.db
      .query('eventAddonConfigs')
      .withIndex('by_event_addon', q =>
        q.eq('eventId', eventId).eq('addonType', addonType)
      )
      .first();

    if (!existing || !existing.enabled) {
      return { success: true };
    }

    await ctx.db.patch(existing._id, {
      enabled: false,
      updatedAt: Date.now(),
    });

    // Dispatch lifecycle
    await dispatchSingleAddonLifecycle(ctx, eventId, addonType, 'onDisabled');

    return { success: true };
  },
});

/**
 * Update the config for an already-enabled add-on.
 * Requires MODERATOR+ role.
 */
export const updateAddonConfig = mutation({
  args: {
    eventId: v.id('events'),
    addonType: v.string(),
    config: v.any(),
  },
  handler: async (ctx, { eventId, addonType, config }) => {
    await requireEventRole(ctx, eventId, 'MODERATOR');

    const handler = getAddonHandler(addonType);
    if (!handler) {
      throw new Error(`Unknown add-on type: ${addonType}`);
    }
    if (!handler.validateConfig(config)) {
      throw new Error(`Invalid config for add-on: ${addonType}`);
    }

    // Validate config size
    validateDataSize(config);

    const existing = await ctx.db
      .query('eventAddonConfigs')
      .withIndex('by_event_addon', q =>
        q.eq('eventId', eventId).eq('addonType', addonType)
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

    // Dispatch lifecycle
    await dispatchSingleAddonLifecycle(
      ctx,
      eventId,
      addonType,
      'onConfigUpdated',
      config,
      oldConfig
    );

    return { success: true };
  },
});

/**
 * Toggle add-on opt-out for the current user.
 * Requires event membership.
 */
export const toggleAddonOptOut = mutation({
  args: {
    eventId: v.id('events'),
    addonType: v.string(),
  },
  handler: async (ctx, { eventId, addonType }) => {
    const { person } = await requireAuth(ctx);

    // Check event exists
    const event = await ctx.db.get(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    // Check membership
    const membership = await ctx.db
      .query('memberships')
      .withIndex('by_person_event', q =>
        q.eq('personId', person._id).eq('eventId', eventId)
      )
      .first();

    if (!membership) {
      throw new Error('You are not a member of this event');
    }

    // Check current opt-out status
    const existing = await ctx.db
      .query('addonOptOuts')
      .withIndex('by_person_event_addon', q =>
        q
          .eq('personId', person._id)
          .eq('eventId', eventId)
          .eq('addonType', addonType)
      )
      .first();

    if (existing) {
      // Currently opted out - opt back in
      await ctx.db.delete(existing._id);
      return { isOptedOut: false };
    } else {
      // Currently opted in - opt out
      const now = Date.now();
      await ctx.db.insert('addonOptOuts', {
        personId: person._id,
        eventId,
        addonType,
        optedOutAt: now,
        updatedAt: now,
      });
      return { isOptedOut: true };
    }
  },
});

// ===== ADD-ON DATA MUTATIONS =====

/**
 * Set a data entry for an add-on (upsert by key).
 * - Requires event membership
 * - Add-on must be enabled and registered
 * - Updates to existing entries require creator or MODERATOR+ role
 * - Data payload is limited to 64KB
 */
export const setAddonData = mutation({
  args: {
    eventId: v.id('events'),
    addonType: v.string(),
    key: v.string(),
    data: v.any(),
  },
  handler: async (ctx, { eventId, addonType, key, data }) => {
    const { person } = await requireAuth(ctx);

    // Verify addon type is registered
    const handler = getAddonHandler(addonType);
    if (!handler) {
      throw new Error(`Unknown add-on type: ${addonType}`);
    }

    // Verify membership
    const membership = await ctx.db
      .query('memberships')
      .withIndex('by_person_event', q =>
        q.eq('personId', person._id).eq('eventId', eventId)
      )
      .first();
    if (!membership) {
      throw new Error('You are not a member of this event');
    }

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

    // Validate data size
    validateDataSize(data);

    const now = Date.now();

    // Check for existing entry
    const existing = await ctx.db
      .query('addonData')
      .withIndex('by_event_addon_key', q =>
        q.eq('eventId', eventId).eq('addonType', addonType).eq('key', key)
      )
      .first();

    if (existing) {
      // Only the creator or a MODERATOR+ can update existing entries
      const isCreator = existing.createdBy === person._id;
      if (!isCreator) {
        await requireEventRole(ctx, eventId, 'MODERATOR');
      }

      await ctx.db.patch(existing._id, {
        data,
        updatedAt: now,
      });
      return { id: existing._id, created: false };
    } else {
      const id = await ctx.db.insert('addonData', {
        eventId,
        addonType,
        key,
        data,
        createdBy: person._id,
        createdAt: now,
        updatedAt: now,
      });
      return { id, created: true };
    }
  },
});

/**
 * Delete a data entry for an add-on.
 * - Requires event membership
 * - Only the creator or a MODERATOR+ can delete
 */
export const deleteAddonData = mutation({
  args: {
    eventId: v.id('events'),
    addonType: v.string(),
    key: v.string(),
  },
  handler: async (ctx, { eventId, addonType, key }) => {
    const { person } = await requireAuth(ctx);

    // Verify membership first
    const membership = await ctx.db
      .query('memberships')
      .withIndex('by_person_event', q =>
        q.eq('personId', person._id).eq('eventId', eventId)
      )
      .first();
    if (!membership) {
      throw new Error('You are not a member of this event');
    }

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
    const isCreator = entry.createdBy === person._id;
    if (!isCreator) {
      await requireEventRole(ctx, eventId, 'MODERATOR');
    }

    await ctx.db.delete(entry._id);
    return { success: true };
  },
});
