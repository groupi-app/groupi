import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import type { Id } from '../_generated/dataModel';
import { requireAuth, requireEventRole, authComponent } from '../auth';
import type { AuthUserId } from '../auth';
import { getAddonHandler } from './registry';
import { dispatchSingleAddonLifecycle } from './lifecycle';
import { createTrustedAddonContext } from './context';
import type { AutomationAction } from './automations/types';
import { ADDON_TYPES } from './types';
import { requireDiscordGuildAuthorization } from '../discord/authorization';

/** Max size for addon config/data payloads (64KB stringified) */
const MAX_DATA_SIZE = 64 * 1024;

const successValidator = v.object({ success: v.boolean() });

const builtInAddonTypeValidator = v.union(
  v.literal(ADDON_TYPES.REMINDERS),
  v.literal(ADDON_TYPES.QUESTIONNAIRE),
  v.literal(ADDON_TYPES.BRING_LIST),
  v.literal(ADDON_TYPES.DISCORD)
);

const BUILT_IN_ADDON_TYPES = [
  ADDON_TYPES.REMINDERS,
  ADDON_TYPES.QUESTIONNAIRE,
  ADDON_TYPES.BRING_LIST,
  ADDON_TYPES.DISCORD,
] as const;

type BuiltInAddonType = (typeof BUILT_IN_ADDON_TYPES)[number];

function validateDataSize(data: unknown): void {
  const size = JSON.stringify(data).length;
  if (size > MAX_DATA_SIZE) {
    throw new Error(
      `Data payload too large (${size} bytes). Maximum is ${MAX_DATA_SIZE} bytes.`
    );
  }
}

function areConfigsEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;

  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right)) return false;
    return (
      left.length === right.length &&
      left.every((value, index) => areConfigsEqual(value, right[index]))
    );
  }

  if (
    typeof left !== 'object' ||
    left === null ||
    typeof right !== 'object' ||
    right === null
  ) {
    return false;
  }

  const leftRecord = left as Record<string, unknown>;
  const rightRecord = right as Record<string, unknown>;
  const leftKeys = Object.keys(leftRecord).sort();
  const rightKeys = Object.keys(rightRecord).sort();

  return (
    leftKeys.length === rightKeys.length &&
    leftKeys.every(
      (key, index) =>
        key === rightKeys[index] &&
        areConfigsEqual(leftRecord[key], rightRecord[key])
    )
  );
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
        throw new Error(
          'Reserved add-on data key must belong to the current user'
        );
      }
      return true;
    }
  }
  return false;
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
  returns: successValidator,
  handler: async (ctx, { eventId, addonType, config }) => {
    const { person } = await requireEventRole(ctx, eventId, 'MODERATOR');

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
    await requireDiscordGuildAuthorization(ctx, person._id, addonType, config);

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
  returns: successValidator,
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
  returns: successValidator,
  handler: async (ctx, { eventId, addonType, config }) => {
    const { person } = await requireEventRole(ctx, eventId, 'MODERATOR');

    const handler = getAddonHandler(addonType);
    if (!handler) {
      throw new Error(`Unknown add-on type: ${addonType}`);
    }
    if (!handler.validateConfig(config)) {
      throw new Error(`Invalid config for add-on: ${addonType}`);
    }

    // Validate config size
    validateDataSize(config);
    await requireDiscordGuildAuthorization(ctx, person._id, addonType, config);

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
 * Replace the complete set of built-in add-ons enabled for an event.
 *
 * All requested configs are validated before any writes occur. Convex runs the
 * mutation as one transaction, so config rows and lifecycle effects either all
 * commit or all roll back together. Custom add-ons are intentionally untouched.
 */
export const replaceBuiltInAddonConfigs = mutation({
  args: {
    eventId: v.id('events'),
    addons: v.array(
      v.object({
        addonType: builtInAddonTypeValidator,
        config: v.any(),
      })
    ),
  },
  returns: v.object({
    enabled: v.number(),
    updated: v.number(),
    disabled: v.number(),
    unchanged: v.number(),
  }),
  handler: async (ctx, { eventId, addons }) => {
    const { person } = await requireEventRole(ctx, eventId, 'MODERATOR');

    const desiredConfigs = new Map<BuiltInAddonType, unknown>();

    // Validate the full request before applying any lifecycle effects or writes.
    for (const addon of addons) {
      if (desiredConfigs.has(addon.addonType)) {
        throw new Error(`Duplicate add-on type: ${addon.addonType}`);
      }

      const handler = getAddonHandler(addon.addonType);
      if (!handler) {
        throw new Error(`Unknown add-on type: ${addon.addonType}`);
      }
      if (!handler.validateConfig(addon.config)) {
        throw new Error(`Invalid config for add-on: ${addon.addonType}`);
      }

      validateDataSize(addon.config);
      await requireDiscordGuildAuthorization(
        ctx,
        person._id,
        addon.addonType,
        addon.config
      );
      desiredConfigs.set(addon.addonType, addon.config);
    }

    const existingConfigs = await ctx.db
      .query('eventAddonConfigs')
      .withIndex('by_event', q => q.eq('eventId', eventId))
      .collect();
    const existingByType = new Map(
      existingConfigs.map(config => [config.addonType, config])
    );
    const now = Date.now();
    const result = { enabled: 0, updated: 0, disabled: 0, unchanged: 0 };

    for (const addonType of BUILT_IN_ADDON_TYPES) {
      const desiredConfig = desiredConfigs.get(addonType);
      const existing = existingByType.get(addonType);

      if (desiredConfig === undefined) {
        if (!existing?.enabled) continue;

        await ctx.db.patch(existing._id, {
          enabled: false,
          updatedAt: now,
        });
        await dispatchSingleAddonLifecycle(
          ctx,
          eventId,
          addonType,
          'onDisabled'
        );
        result.disabled += 1;
        continue;
      }

      if (!existing) {
        await ctx.db.insert('eventAddonConfigs', {
          eventId,
          addonType,
          enabled: true,
          config: desiredConfig,
          createdAt: now,
          updatedAt: now,
        });
        await dispatchSingleAddonLifecycle(
          ctx,
          eventId,
          addonType,
          'onEnabled',
          desiredConfig
        );
        result.enabled += 1;
        continue;
      }

      if (!existing.enabled) {
        await ctx.db.patch(existing._id, {
          enabled: true,
          config: desiredConfig,
          updatedAt: now,
        });
        await dispatchSingleAddonLifecycle(
          ctx,
          eventId,
          addonType,
          'onEnabled',
          desiredConfig
        );
        result.enabled += 1;
        continue;
      }

      if (areConfigsEqual(existing.config, desiredConfig)) {
        result.unchanged += 1;
        continue;
      }

      await ctx.db.patch(existing._id, {
        config: desiredConfig,
        updatedAt: now,
      });
      await dispatchSingleAddonLifecycle(
        ctx,
        eventId,
        addonType,
        'onConfigUpdated',
        desiredConfig,
        existing.config
      );
      result.updated += 1;
    }

    return result;
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
  returns: v.object({ isOptedOut: v.boolean() }),
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
  returns: v.object({ id: v.id('addonData'), created: v.boolean() }),
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

    const isOwnedReservedKey = requireOwnedReservedKey(key, person._id);

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

    let resultId: Id<'addonData'>;
    let created;

    if (existing) {
      // Only the creator or a MODERATOR+ can update existing entries
      const isCreator = existing.createdBy === person._id || isOwnedReservedKey;
      if (!isCreator) {
        await requireEventRole(ctx, eventId, 'MODERATOR');
      }

      await ctx.db.patch(existing._id, {
        data,
        ...(isOwnedReservedKey && { createdBy: person._id }),
        updatedAt: now,
      });
      resultId = existing._id;
      created = false;
    } else {
      resultId = await ctx.db.insert('addonData', {
        eventId,
        addonType,
        key,
        data,
        createdBy: person._id,
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
      { key, data, submitterId: person._id }
    );

    return { id: resultId, created };
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
  returns: successValidator,
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

    const isOwnedReservedKey = requireOwnedReservedKey(key, person._id);

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
    const isCreator = entry.createdBy === person._id || isOwnedReservedKey;
    if (!isCreator) {
      await requireEventRole(ctx, eventId, 'MODERATOR');
    }

    await ctx.db.delete(entry._id);
    return { success: true };
  },
});

/**
 * Execute inline actions for a field (e.g., action_button click).
 * The client sends the fieldId reference, the server resolves actions from config.
 * - Requires event membership
 * - Field must be an action_button with configured actions
 */
export const executeFieldActions = mutation({
  args: {
    eventId: v.id('events'),
    addonType: v.string(),
    fieldId: v.string(),
  },
  returns: successValidator,
  handler: async (ctx, { eventId, addonType, fieldId }) => {
    const { person } = await requireAuth(ctx);

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

    // Load addon config
    const addonConfig = await ctx.db
      .query('eventAddonConfigs')
      .withIndex('by_event_addon', q =>
        q.eq('eventId', eventId).eq('addonType', addonType)
      )
      .first();
    if (!addonConfig?.enabled || !addonConfig.config) {
      throw new Error(`Add-on ${addonType} is not enabled for this event`);
    }

    // Extract template and find the field
    const config = addonConfig.config as Record<string, unknown>;
    const template = config.template as Record<string, unknown> | undefined;
    if (!template?.sections) {
      throw new Error('Invalid addon config');
    }

    const sections = template.sections as Array<{
      fields: Array<{
        id: string;
        type: string;
        actions?: Array<Record<string, unknown>>;
      }>;
    }>;

    let field: (typeof sections)[0]['fields'][0] | undefined;
    for (const section of sections) {
      field = section.fields.find(f => f.id === fieldId);
      if (field) break;
    }

    if (!field) {
      throw new Error('Field not found');
    }
    if (field.type !== 'action_button') {
      throw new Error('Field is not an action button');
    }
    if (!field.actions || field.actions.length === 0) {
      throw new Error('No actions configured for this button');
    }

    // Build context and dispatch actions
    const trustedCtx = createTrustedAddonContext(ctx, addonType, eventId);

    const { buildVariableContext } = await import('./automations/resolve');
    const { dispatchActions } = await import('./automations/dispatch');

    // Build variable context
    const event = await ctx.db.get(eventId);
    let memberName = '';
    const personDoc = await ctx.db.get(person._id);
    if (personDoc) {
      try {
        const user = await authComponent.getAnyUserById(
          ctx,
          personDoc.userId as AuthUserId
        );
        memberName = user?.name ?? user?.email ?? '';
      } catch {
        // ignore
      }
    }

    const variableCtx = buildVariableContext({
      memberName,
      memberRole: membership.role,
      eventTitle: event?.title ?? '',
      eventLocation: event?.location ?? '',
      addonName: (template.name as string) ?? '',
    });

    await dispatchActions(
      trustedCtx,
      field.actions as unknown as AutomationAction[],
      variableCtx,
      person._id
    );

    return { success: true };
  },
});
