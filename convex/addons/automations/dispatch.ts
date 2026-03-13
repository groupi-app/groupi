import type { AutomationAction, VariableContext } from './types';
import type { TrustedAddonContext } from '../context';
import type { Id } from '../../_generated/dataModel';
import { resolveTemplate } from './resolve';

/**
 * Get the set of person IDs that pass the recipient toggle filter.
 * Returns null if no filtering is needed (no recipientToggleField set).
 */
async function getToggleEnabledPersonIds(
  ctx: TrustedAddonContext,
  action: AutomationAction
): Promise<Set<string> | null> {
  if (!action.recipientToggleField) return null;

  const fieldId = action.recipientToggleField;
  const addonData = await ctx.queryAddonData();
  const prefix = `toggle:${fieldId}:`;

  // Build a map of personId → enabled from stored toggle entries
  const toggleState = new Map<string, boolean>();
  for (const entry of addonData) {
    if (!entry.key.startsWith(prefix)) continue;
    const personId = entry.key.slice(prefix.length);
    const data = entry.data as { enabled?: boolean } | null;
    toggleState.set(personId, data?.enabled ?? true);
  }

  // Look up the field's defaultEnabled from the template config
  let defaultEnabled = true;
  const addonConfig = await ctx.rawCtx.db
    .query('eventAddonConfigs')
    .withIndex('by_event_addon', q =>
      q.eq('eventId', ctx.eventId).eq('addonType', ctx.addonType)
    )
    .first();

  if (addonConfig?.config) {
    const config = addonConfig.config as Record<string, unknown>;
    const template = config.template as Record<string, unknown> | undefined;
    if (template?.sections) {
      const sections = template.sections as Array<{
        fields: Array<{ id: string; defaultEnabled?: boolean }>;
      }>;
      for (const section of sections) {
        const field = section.fields.find(f => f.id === fieldId);
        if (field) {
          defaultEnabled = field.defaultEnabled ?? true;
          break;
        }
      }
    }
  }

  // Build the set of enabled person IDs from all event members
  const members = await ctx.getMembers();
  const enabledSet = new Set<string>();
  for (const member of members) {
    const pid = member.personId as string;
    const stored = toggleState.get(pid);
    // If no stored value, use defaultEnabled from the field config
    const isEnabled = stored !== undefined ? stored : defaultEnabled;
    if (isEnabled) {
      enabledSet.add(pid);
    }
  }

  return enabledSet;
}

/**
 * Dispatch a list of actions in order, resolving template variables.
 */
export async function dispatchActions(
  ctx: TrustedAddonContext,
  actions: AutomationAction[],
  variableCtx: VariableContext,
  authorId: Id<'persons'>
): Promise<void> {
  for (const action of actions) {
    try {
      await dispatchSingleAction(ctx, action, variableCtx, authorId);
    } catch (error) {
      console.error(
        `Automation action "${action.type}" failed:`,
        error instanceof Error ? error.message : error
      );
      // Continue with remaining actions — don't let one failure block the rest
    }
  }
}

// Lazy-load internal references to avoid TS2589 deep type instantiation.
// The `internal` object from `_generated/api` triggers excessively deep
// type inference when accessed at module level.
function getInternalRefs() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
  const { internal } = require('../../_generated/api') as any;
  return {
    createSystemPost:
      internal.addons.automations.internalMutations.createSystemPost,
    updateEventDescription:
      internal.addons.automations.internalMutations.updateEventDescription,
    sendWebhook: internal.addons.automations.internalActions.sendWebhook,
  };
}

async function dispatchSingleAction(
  ctx: TrustedAddonContext,
  action: AutomationAction,
  variableCtx: VariableContext,
  authorId: Id<'persons'>
): Promise<void> {
  switch (action.type) {
    case 'notify_members': {
      const message = resolveTemplate(action.message ?? '', variableCtx);
      const enabledSet = await getToggleEnabledPersonIds(ctx, action);

      if (enabledSet) {
        // Filtered notification — only send to enabled recipients
        const members = await ctx.getMembers();
        for (const member of members) {
          const pid = member.personId as string;
          if (pid === (authorId as string)) continue;
          if (!enabledSet.has(pid)) continue;
          await ctx.rawCtx.db.insert('notifications', {
            personId: member.personId,
            type: 'ADDON_AUTOMATION',
            authorId,
            eventId: ctx.eventId,
            read: false,
            updatedAt: Date.now(),
          });
        }
      } else {
        await ctx.notifyEventMembers({
          type: 'ADDON_AUTOMATION',
          authorId,
        });
      }
      console.log(`[Automation] notify_members: ${message}`);
      break;
    }

    case 'notify_organizers': {
      const message = resolveTemplate(action.message ?? '', variableCtx);
      const enabledSet = await getToggleEnabledPersonIds(ctx, action);
      // Notify only organizers/moderators
      const members = await ctx.getMembers();
      const mods = members.filter(
        m => m.role === 'ORGANIZER' || m.role === 'MODERATOR'
      );
      for (const mod of mods) {
        if (mod.personId === authorId) continue;
        if (enabledSet && !enabledSet.has(mod.personId as string)) continue;
        await ctx.rawCtx.db.insert('notifications', {
          personId: mod.personId,
          type: 'ADDON_AUTOMATION',
          authorId,
          eventId: ctx.eventId,
          read: false,
          updatedAt: Date.now(),
        });
      }
      console.log(`[Automation] notify_organizers: ${message}`);
      break;
    }

    case 'notify_submitter': {
      const message = resolveTemplate(action.message ?? '', variableCtx);
      // The submitter is the authorId (the person who triggered the automation)
      await ctx.rawCtx.db.insert('notifications', {
        personId: authorId,
        type: 'ADDON_AUTOMATION',
        eventId: ctx.eventId,
        read: false,
        updatedAt: Date.now(),
      });
      console.log(`[Automation] notify_submitter: ${message}`);
      break;
    }

    case 'create_post': {
      const title = resolveTemplate(action.title ?? '', variableCtx);
      const content = resolveTemplate(action.message ?? '', variableCtx);

      // Use the addon creator (first organizer) as the post author
      const event = await ctx.getEvent();
      if (!event) break;

      // Find the event creator's person ID to attribute the post
      const eventDoc = await ctx.rawCtx.db.get(ctx.eventId);
      const postAuthorId = eventDoc?.creatorId ?? authorId;

      await ctx.rawCtx.runMutation(getInternalRefs().createSystemPost, {
        eventId: ctx.eventId,
        authorId: postAuthorId,
        title,
        content,
      });
      console.log(`[Automation] create_post: "${title}"`);
      break;
    }

    case 'update_event_description': {
      const description = resolveTemplate(action.message ?? '', variableCtx);
      await ctx.rawCtx.runMutation(getInternalRefs().updateEventDescription, {
        eventId: ctx.eventId,
        description,
      });
      console.log(`[Automation] update_event_description`);
      break;
    }

    case 'send_webhook': {
      if (!action.webhookUrl) break;

      let payload: string;
      if (action.message) {
        // Custom payload — resolve variables and send as-is
        payload = resolveTemplate(action.message, variableCtx);
      } else {
        // Default payload — structured context
        payload = JSON.stringify({
          trigger: variableCtx,
          timestamp: new Date().toISOString(),
          source: 'groupi-automation',
        });
      }

      await ctx.rawCtx.scheduler.runAfter(0, getInternalRefs().sendWebhook, {
        url: action.webhookUrl,
        payload,
        headers: action.webhookHeaders,
      });
      console.log(`[Automation] send_webhook: ${action.webhookUrl}`);
      break;
    }

    case 'set_addon_data': {
      if (!action.key) break;

      const resolvedKey = resolveTemplate(action.key, variableCtx);
      const resolvedData =
        typeof action.data === 'string'
          ? resolveTemplate(action.data, variableCtx)
          : action.data;

      const now = Date.now();

      // Check if entry exists
      const existing = await ctx.rawCtx.db
        .query('addonData')
        .withIndex('by_event_addon_key', q =>
          q
            .eq('eventId', ctx.eventId)
            .eq('addonType', ctx.addonType)
            .eq('key', resolvedKey)
        )
        .first();

      if (existing) {
        await ctx.rawCtx.db.patch(existing._id, {
          data: resolvedData,
          updatedAt: now,
        });
      } else {
        await ctx.rawCtx.db.insert('addonData', {
          eventId: ctx.eventId,
          addonType: ctx.addonType,
          key: resolvedKey,
          data: resolvedData,
          createdBy: authorId,
          createdAt: now,
          updatedAt: now,
        });
      }
      console.log(`[Automation] set_addon_data: key="${resolvedKey}"`);
      break;
    }
  }
}
