import { internalQuery, internalMutation } from '../../../_generated/server';
import { v } from 'convex/values';
import { Id } from '../../../_generated/dataModel';
import {
  setAddonDataForPerson,
  deleteAddonDataForPerson,
  executeFieldActionsForPerson,
} from '../../../addons/mutations';
import { dispatchSingleAddonLifecycle } from '../../../addons/lifecycle';
import {
  validatedConfiguration,
  publicConfiguration,
  requireConfigurationRole,
} from './addonConfiguration';
import { disableAddonConfiguration } from '../../../addons/mutations';

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
    const result = await setAddonDataForPerson(ctx, personId as Id<'persons'>, {
      eventId: eventId as Id<'events'>,
      addonType,
      key,
      data,
    });
    const entry = (await ctx.db.get(result.id))!;
    return {
      id: entry._id,
      key: entry.key,
      data: entry.data,
      createdBy: entry.createdBy ?? null,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      created: result.created,
    };
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
    return deleteAddonDataForPerson(ctx, personId as Id<'persons'>, {
      eventId: eventId as Id<'events'>,
      addonType,
      key,
    });
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

export const participate = internalMutation({
  args: {
    eventId: v.string(),
    personId: v.string(),
    addonType: v.string(),
    action: v.string(),
    data: v.any(),
    fieldId: v.optional(v.string()),
  },
  handler: async (
    ctx,
    { eventId, personId, addonType, action, data, fieldId }
  ) => {
    const eid = eventId as Id<'events'>,
      pid = personId as Id<'persons'>;
    const member = await ctx.db
      .query('memberships')
      .withIndex('by_person_event', q =>
        q.eq('personId', pid).eq('eventId', eid)
      )
      .first();
    if (!member) throw new Error('Event membership required');
    const config = await ctx.db
      .query('eventAddonConfigs')
      .withIndex('by_event_addon', q =>
        q.eq('eventId', eid).eq('addonType', addonType)
      )
      .first();
    if (!config?.enabled) throw new Error('Add-on is not enabled');
    const allowed =
      addonType === 'reminders'
        ? ['opt-in', 'opt-out']
        : addonType === 'questionnaire'
          ? ['respond', 'clear-response']
          : addonType === 'bring-list'
            ? ['claim', 'clear-claims']
            : addonType.startsWith('custom:')
              ? [
                  'respond',
                  'claim',
                  'vote',
                  'toggle',
                  'execute',
                  'clear-response',
                  'clear-claims',
                ]
              : [];
    if (!allowed.includes(action))
      throw new Error('This add-on does not support that participant action');

    if (action === 'opt-out' || action === 'opt-in') {
      if (addonType !== 'reminders')
        throw new Error('Only reminders supports opt-out');
      const row = await ctx.db
        .query('addonOptOuts')
        .withIndex('by_person_event_addon', q =>
          q.eq('personId', pid).eq('eventId', eid).eq('addonType', addonType)
        )
        .first();
      if (action === 'opt-out' && !row)
        await ctx.db.insert('addonOptOuts', {
          personId: pid,
          eventId: eid,
          addonType,
          optedOutAt: Date.now(),
          updatedAt: Date.now(),
        });
      if (action === 'opt-in' && row) await ctx.db.delete(row._id);
      return { isOptedOut: action === 'opt-out' };
    }
    if (action === 'execute') {
      if (!addonType.startsWith('custom:') || !fieldId)
        throw new Error('Provide a custom action button fieldId');
      return executeFieldActionsForPerson(ctx, pid, {
        eventId: eid,
        addonType,
        fieldId,
      });
    }
    if (
      ![
        'respond',
        'claim',
        'vote',
        'toggle',
        'clear-response',
        'clear-claims',
      ].includes(action)
    )
      throw new Error('Unsupported participant action');
    if ((action === 'vote' || action === 'toggle') && !fieldId)
      throw new Error('Provide fieldId');
    const key =
      action.includes('response') || action === 'respond'
        ? `response:${personId}`
        : action.includes('claim')
          ? `claims:${personId}`
          : `${action}:${fieldId}:${personId}`;
    if (action.startsWith('clear-'))
      return deleteAddonDataForPerson(ctx, pid, {
        eventId: eid,
        addonType,
        key,
      });
    return setAddonDataForPerson(ctx, pid, {
      eventId: eid,
      addonType,
      key,
      data,
    });
  },
});

export const participantDataPage = internalQuery({
  args: {
    eventId: v.string(),
    addonType: v.string(),
    personId: v.string(),
    limit: v.number(),
    cursor: v.union(v.string(), v.null()),
  },
  handler: async (ctx, { eventId, addonType, personId, limit, cursor }) => {
    const eid = eventId as Id<'events'>,
      pid = personId as Id<'persons'>;
    const member = await ctx.db
      .query('memberships')
      .withIndex('by_person_event', q =>
        q.eq('personId', pid).eq('eventId', eid)
      )
      .first();
    if (!member) throw new Error('Event membership required');
    const page = await ctx.db
      .query('addonData')
      .withIndex('by_event_addon', q =>
        q.eq('eventId', eid).eq('addonType', addonType)
      )
      .paginate({ numItems: limit, cursor });
    const optout = await ctx.db
      .query('addonOptOuts')
      .withIndex('by_person_event_addon', q =>
        q.eq('personId', pid).eq('eventId', eid).eq('addonType', addonType)
      )
      .first();
    return {
      items: page.page.map(e => ({
        id: e._id,
        key: e.key,
        data: e.data,
        createdBy: e.createdBy ?? null,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
      })),
      nextCursor: page.isDone ? null : page.continueCursor,
      isOptedOut: !!optout,
    };
  },
});
