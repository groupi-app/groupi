import { query } from '../_generated/server';
import { v } from 'convex/values';
import { requireAuth, requireEventMembership } from '../auth';
import { getAddonHandler } from './registry';

/**
 * Get all add-on configs for an event.
 * Requires event membership.
 */
export const getEventAddons = query({
  args: {
    eventId: v.id('events'),
  },
  handler: async (ctx, { eventId }) => {
    await requireEventMembership(ctx, eventId);

    return await ctx.db
      .query('eventAddonConfigs')
      .withIndex('by_event', q => q.eq('eventId', eventId))
      .collect();
  },
});

/**
 * Get a specific add-on config for an event.
 * Requires event membership.
 */
export const getAddonConfig = query({
  args: {
    eventId: v.id('events'),
    addonType: v.string(),
  },
  handler: async (ctx, { eventId, addonType }) => {
    await requireEventMembership(ctx, eventId);

    return await ctx.db
      .query('eventAddonConfigs')
      .withIndex('by_event_addon', q =>
        q.eq('eventId', eventId).eq('addonType', addonType)
      )
      .first();
  },
});

/**
 * Check if the current user has opted out of a specific add-on for an event.
 * Requires authentication.
 */
export const isAddonOptedOut = query({
  args: {
    eventId: v.id('events'),
    addonType: v.string(),
  },
  handler: async (ctx, { eventId, addonType }) => {
    const { person } = await requireAuth(ctx);

    const optOut = await ctx.db
      .query('addonOptOuts')
      .withIndex('by_person_event_addon', q =>
        q
          .eq('personId', person._id)
          .eq('eventId', eventId)
          .eq('addonType', addonType)
      )
      .first();

    return { isOptedOut: !!optOut };
  },
});

// ===== ADD-ON DATA QUERIES =====

/**
 * Get all data entries for an add-on on a specific event.
 * Requires event membership.
 */
export const getAddonData = query({
  args: {
    eventId: v.id('events'),
    addonType: v.string(),
  },
  handler: async (ctx, { eventId, addonType }) => {
    await requireEventMembership(ctx, eventId);

    return await ctx.db
      .query('addonData')
      .withIndex('by_event_addon', q =>
        q.eq('eventId', eventId).eq('addonType', addonType)
      )
      .collect();
  },
});

/**
 * Get a specific data entry by key for an add-on.
 * Requires event membership.
 */
export const getAddonDataByKey = query({
  args: {
    eventId: v.id('events'),
    addonType: v.string(),
    key: v.string(),
  },
  handler: async (ctx, { eventId, addonType, key }) => {
    await requireEventMembership(ctx, eventId);

    return await ctx.db
      .query('addonData')
      .withIndex('by_event_addon_key', q =>
        q.eq('eventId', eventId).eq('addonType', addonType).eq('key', key)
      )
      .first();
  },
});

/**
 * Get all data entries created by the current user for an add-on.
 * Requires event membership.
 */
export const getMyAddonData = query({
  args: {
    eventId: v.id('events'),
    addonType: v.string(),
  },
  handler: async (ctx, { eventId, addonType }) => {
    const { person } = await requireAuth(ctx);
    await requireEventMembership(ctx, eventId);

    return await ctx.db
      .query('addonData')
      .withIndex('by_event_addon_creator', q =>
        q
          .eq('eventId', eventId)
          .eq('addonType', addonType)
          .eq('createdBy', person._id)
      )
      .collect();
  },
});

// ===== COMPLETION STATUS =====

/**
 * Get addon completion status for the current user.
 * Used by the gating system to determine if the user needs to
 * complete any required addons before accessing event content.
 */
export const getAddonCompletionStatus = query({
  args: {
    eventId: v.id('events'),
  },
  handler: async (ctx, { eventId }) => {
    const { person } = await requireAuth(ctx);

    // Get user's membership and role
    const membership = await ctx.db
      .query('memberships')
      .withIndex('by_person_event', q =>
        q.eq('personId', person._id).eq('eventId', eventId)
      )
      .first();

    if (!membership) {
      return null;
    }

    const isOrganizer = membership.role === 'ORGANIZER';

    // Check availability completion
    const event = await ctx.db.get(eventId);
    const potentialDates = await ctx.db
      .query('potentialDateTimes')
      .withIndex('by_event', q => q.eq('eventId', eventId))
      .collect();

    const availabilityRequired =
      potentialDates.length > 0 && !event?.chosenDateTime;
    let availabilityCompleted = false;

    if (availabilityRequired) {
      const userAvailabilities = await ctx.db
        .query('availabilities')
        .withIndex('by_membership', q => q.eq('membershipId', membership._id))
        .collect();
      availabilityCompleted = userAvailabilities.length > 0;
    }

    // Check each enabled addon
    const addonConfigs = await ctx.db
      .query('eventAddonConfigs')
      .withIndex('by_event', q => q.eq('eventId', eventId))
      .collect();

    const addons: Array<{ addonType: string; completed: boolean }> = [];

    for (const config of addonConfigs) {
      if (!config.enabled) continue;

      // Only check addons that have a registered handler
      const handler = getAddonHandler(config.addonType);
      if (!handler) continue;

      // Check if user has a response entry (key starting with 'response:')
      const responseEntry = await ctx.db
        .query('addonData')
        .withIndex('by_event_addon_key', q =>
          q
            .eq('eventId', eventId)
            .eq('addonType', config.addonType)
            .eq('key', `response:${person._id}`)
        )
        .first();

      addons.push({
        addonType: config.addonType,
        completed: !!responseEntry,
      });
    }

    return {
      isOrganizer,
      availability: {
        required: availabilityRequired,
        completed: availabilityCompleted,
      },
      addons,
    };
  },
});
