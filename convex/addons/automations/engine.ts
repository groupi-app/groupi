import type { TrustedAddonContext } from '../context';
import type { Id } from '../../_generated/dataModel';
import type { Automation, AutomationAction, TriggerType } from './types';
import { evaluateConditions } from './conditions';
import { buildVariableContext } from './resolve';
import { dispatchActions } from './dispatch';
import { authComponent, AuthUserId } from '../../auth';

/**
 * Load automations from the addon config.
 */
async function loadAutomations(
  ctx: TrustedAddonContext
): Promise<Automation[]> {
  const addonConfig = await ctx.rawCtx.db
    .query('eventAddonConfigs')
    .withIndex('by_event_addon', q =>
      q.eq('eventId', ctx.eventId).eq('addonType', ctx.addonType)
    )
    .first();

  if (!addonConfig?.enabled || !addonConfig.config) return [];

  const config = addonConfig.config as Record<string, unknown>;
  const template = config.template as Record<string, unknown> | undefined;
  if (!template) return [];

  const automations = template.automations;
  if (!Array.isArray(automations)) return [];

  return automations as Automation[];
}

/**
 * Get the addon template name from config.
 */
async function getAddonName(ctx: TrustedAddonContext): Promise<string> {
  const addonConfig = await ctx.rawCtx.db
    .query('eventAddonConfigs')
    .withIndex('by_event_addon', q =>
      q.eq('eventId', ctx.eventId).eq('addonType', ctx.addonType)
    )
    .first();

  if (!addonConfig?.config) return '';
  const config = addonConfig.config as Record<string, unknown>;
  const template = config.template as Record<string, unknown> | undefined;
  return (template?.name as string) ?? '';
}

/**
 * Look up a person's display name.
 */
async function getPersonName(
  ctx: TrustedAddonContext,
  personId: Id<'persons'>
): Promise<string> {
  const person = await ctx.rawCtx.db.get(personId);
  if (!person) return 'Unknown';
  try {
    const user = await authComponent.getAnyUserById(
      ctx.rawCtx,
      person.userId as AuthUserId
    );
    return user?.name ?? user?.email ?? 'Unknown';
  } catch {
    return 'Unknown';
  }
}

/**
 * Look up a person's event role.
 */
async function getPersonRole(
  ctx: TrustedAddonContext,
  personId: Id<'persons'>
): Promise<string> {
  const membership = await ctx.rawCtx.db
    .query('memberships')
    .withIndex('by_person_event', q =>
      q.eq('personId', personId).eq('eventId', ctx.eventId)
    )
    .first();
  return membership?.role ?? 'ATTENDEE';
}

/**
 * Format a Unix timestamp as a human-readable date string.
 */
function formatDate(timestamp: number | undefined): string {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Run automations for a specific trigger type.
 *
 * @param ctx - TrustedAddonContext (has rawCtx for DB/scheduler access)
 * @param triggerType - The type of trigger that fired
 * @param extra - Additional context (e.g., personId, fieldValues)
 */
export async function runAutomations(
  ctx: TrustedAddonContext,
  triggerType: TriggerType,
  extra: {
    personId?: Id<'persons'>;
    fieldValues?: Record<string, unknown>;
    chosenDateTime?: number;
    fieldId?: string;
    threshold?: number;
  }
): Promise<void> {
  const automations = await loadAutomations(ctx);
  if (automations.length === 0) return;

  // Filter to enabled automations matching the trigger type
  const matching = automations.filter(
    a => a.enabled && a.trigger.type === triggerType
  );

  if (matching.length === 0) return;

  // For triggers that need a specific fieldId or threshold, filter further
  const filtered = matching.filter(a => {
    if (triggerType === 'list_item_full' && a.trigger.fieldId) {
      return a.trigger.fieldId === extra.fieldId;
    }
    if (triggerType === 'vote_threshold' && a.trigger.threshold) {
      return (extra.threshold ?? 0) >= a.trigger.threshold;
    }
    return true;
  });

  if (filtered.length === 0) return;

  // Build variable context
  const event = await ctx.getEvent();
  const addonName = await getAddonName(ctx);
  const personId = extra.personId ?? (await getAuthPersonId(ctx));

  let memberName = '';
  let memberRole = '';
  if (personId) {
    memberName = await getPersonName(ctx, personId);
    memberRole = await getPersonRole(ctx, personId);
  }

  const variableCtx = buildVariableContext({
    memberName,
    memberRole,
    eventTitle: event?.title ?? '',
    eventLocation: event?.location ?? '',
    eventDate: formatDate(extra.chosenDateTime ?? event?.chosenDateTime),
    fieldValues: extra.fieldValues,
    addonName,
  });

  // We need a valid person ID. If none available, try the event creator.
  let effectiveAuthorId = personId;
  if (!effectiveAuthorId && event) {
    const eventDoc = await ctx.rawCtx.db.get(ctx.eventId);
    effectiveAuthorId = eventDoc?.creatorId;
  }
  if (!effectiveAuthorId) return; // Can't run without an author

  for (const automation of filtered) {
    const conditionsPassed = evaluateConditions(
      automation.conditions,
      variableCtx
    );

    if (conditionsPassed) {
      await dispatchActions(
        ctx,
        automation.actions,
        variableCtx,
        effectiveAuthorId
      );
    }
  }
}

/**
 * Get the authenticated person's ID if available.
 */
async function getAuthPersonId(
  ctx: TrustedAddonContext
): Promise<Id<'persons'> | undefined> {
  const person = await ctx.getAuthPerson();
  return person?._id;
}

/**
 * Run automations specifically triggered by data submission.
 * Infers trigger type from the key pattern:
 * - `response:` → form_submitted
 * - `claims:` → list_item_claimed
 * - `vote:` → vote_cast
 *
 * Also checks for derived triggers (list_item_full, vote_threshold, all_responses_in).
 */
export async function runAutomationsForDataSubmission(
  ctx: TrustedAddonContext,
  key: string,
  data: unknown,
  submitterId: Id<'persons'>
): Promise<void> {
  const automations = await loadAutomations(ctx);
  if (automations.length === 0) return;

  // Extract field values from data (best effort)
  const fieldValues = extractFieldValues(data);

  // Determine the primary trigger type from key prefix
  if (key.startsWith('response:')) {
    await runAutomations(ctx, 'form_submitted', {
      personId: submitterId,
      fieldValues,
    });

    // Run on-submit actions (template-level)
    await runOnSubmitActions(ctx, submitterId, fieldValues);

    // Check for all_responses_in
    await checkAllResponsesIn(ctx, automations, submitterId, fieldValues);
  } else if (key.startsWith('claims:')) {
    await runAutomations(ctx, 'list_item_claimed', {
      personId: submitterId,
      fieldValues,
    });

    // Run inline field-level actions
    await runInlineFieldActions(ctx, key, submitterId, fieldValues);

    // Check for list_item_full
    await checkListItemFull(ctx, automations, key, submitterId, fieldValues);
  } else if (key.startsWith('toggle:')) {
    await runAutomations(ctx, 'toggle_changed', {
      personId: submitterId,
      fieldValues,
    });

    // Run inline field-level actions for the toggle field
    await runInlineFieldActions(ctx, key, submitterId, fieldValues);
  } else if (key.startsWith('vote:')) {
    await runAutomations(ctx, 'vote_cast', {
      personId: submitterId,
      fieldValues,
    });

    // Run inline field-level actions
    await runInlineFieldActions(ctx, key, submitterId, fieldValues);

    // Check for vote_threshold
    await checkVoteThreshold(ctx, automations, submitterId, fieldValues);
  }
}

/**
 * Extract field values from submitted data.
 */
function extractFieldValues(data: unknown): Record<string, unknown> {
  if (typeof data !== 'object' || data === null) return {};
  // If data is a Record already, return it
  return data as Record<string, unknown>;
}

/**
 * Load the template from addon config.
 */
async function loadTemplate(
  ctx: TrustedAddonContext
): Promise<Record<string, unknown> | null> {
  const addonConfig = await ctx.rawCtx.db
    .query('eventAddonConfigs')
    .withIndex('by_event_addon', q =>
      q.eq('eventId', ctx.eventId).eq('addonType', ctx.addonType)
    )
    .first();

  if (!addonConfig?.enabled || !addonConfig.config) return null;
  const config = addonConfig.config as Record<string, unknown>;
  return (config.template as Record<string, unknown>) ?? null;
}

/**
 * Run on-submit actions defined at template level.
 * Called after form_submitted automations.
 */
async function runOnSubmitActions(
  ctx: TrustedAddonContext,
  submitterId: Id<'persons'>,
  fieldValues: Record<string, unknown>
): Promise<void> {
  const template = await loadTemplate(ctx);
  if (!template) return;

  const onSubmitActions = template.onSubmitActions;
  if (!Array.isArray(onSubmitActions) || onSubmitActions.length === 0) return;

  const event = await ctx.getEvent();
  const addonName = await getAddonName(ctx);
  const memberName = await getPersonName(ctx, submitterId);
  const memberRole = await getPersonRole(ctx, submitterId);

  const variableCtx = buildVariableContext({
    memberName,
    memberRole,
    eventTitle: event?.title ?? '',
    eventLocation: event?.location ?? '',
    eventDate: formatDate(event?.chosenDateTime),
    fieldValues,
    addonName,
  });

  await dispatchActions(
    ctx,
    onSubmitActions as unknown as AutomationAction[],
    variableCtx,
    submitterId
  );
}

/**
 * Run inline field-level actions (on vote or list_item fields).
 * Called after vote_cast or list_item_claimed automations.
 */
async function runInlineFieldActions(
  ctx: TrustedAddonContext,
  key: string,
  submitterId: Id<'persons'>,
  fieldValues: Record<string, unknown>
): Promise<void> {
  const template = await loadTemplate(ctx);
  if (!template?.sections) return;

  const sections = template.sections as Array<{
    fields: Array<{
      id: string;
      type: string;
      actions?: Array<Record<string, unknown>>;
    }>;
  }>;

  // Determine which field(s) to check based on key pattern
  const fieldsWithActions: Array<{
    actions: Array<Record<string, unknown>>;
  }> = [];

  if (key.startsWith('toggle:')) {
    // toggle:{fieldId}:{personId}
    const parts = key.split(':');
    if (parts.length >= 2) {
      const fieldId = parts[1];
      for (const section of sections) {
        const field = section.fields.find(
          f => f.id === fieldId && f.type === 'toggle'
        );
        if (field?.actions && field.actions.length > 0) {
          fieldsWithActions.push(
            field as { actions: Array<Record<string, unknown>> }
          );
        }
      }
    }
  } else if (key.startsWith('vote:')) {
    // vote:{fieldId}:{personId}
    const parts = key.split(':');
    if (parts.length >= 2) {
      const fieldId = parts[1];
      for (const section of sections) {
        const field = section.fields.find(
          f => f.id === fieldId && f.type === 'vote'
        );
        if (field?.actions && field.actions.length > 0) {
          fieldsWithActions.push(
            field as { actions: Array<Record<string, unknown>> }
          );
        }
      }
    }
  } else if (key.startsWith('claims:')) {
    // claims:{personId} — find all list_item fields with actions
    for (const section of sections) {
      for (const field of section.fields) {
        if (
          field.type === 'list_item' &&
          field.actions &&
          field.actions.length > 0
        ) {
          fieldsWithActions.push(
            field as { actions: Array<Record<string, unknown>> }
          );
        }
      }
    }
  }

  if (fieldsWithActions.length === 0) return;

  const event = await ctx.getEvent();
  const addonName = await getAddonName(ctx);
  const memberName = await getPersonName(ctx, submitterId);
  const memberRole = await getPersonRole(ctx, submitterId);

  const variableCtx = buildVariableContext({
    memberName,
    memberRole,
    eventTitle: event?.title ?? '',
    eventLocation: event?.location ?? '',
    eventDate: formatDate(event?.chosenDateTime),
    fieldValues,
    addonName,
  });

  for (const field of fieldsWithActions) {
    await dispatchActions(
      ctx,
      field.actions as unknown as AutomationAction[],
      variableCtx,
      submitterId
    );
  }
}

/**
 * Check if all members have submitted responses.
 */
async function checkAllResponsesIn(
  ctx: TrustedAddonContext,
  automations: Automation[],
  submitterId: Id<'persons'>,
  fieldValues: Record<string, unknown>
): Promise<void> {
  const hasAllResponsesTrigger = automations.some(
    a => a.enabled && a.trigger.type === 'all_responses_in'
  );
  if (!hasAllResponsesTrigger) return;

  const members = await ctx.getMembers();
  const addonData = await ctx.queryAddonData();

  // Count members with response: keys
  const respondedPersonIds = new Set(
    addonData
      .filter(d => d.key.startsWith('response:'))
      .map(d => d.key.replace('response:', ''))
  );

  // Check if all members have responded
  const allResponded = members.every(m =>
    respondedPersonIds.has(m.personId as string)
  );

  if (allResponded) {
    await runAutomations(ctx, 'all_responses_in', {
      personId: submitterId,
      fieldValues,
    });
  }
}

/**
 * Check if a list item has reached capacity.
 */
async function checkListItemFull(
  ctx: TrustedAddonContext,
  automations: Automation[],
  key: string,
  submitterId: Id<'persons'>,
  fieldValues: Record<string, unknown>
): Promise<void> {
  const hasListFullTrigger = automations.some(
    a => a.enabled && a.trigger.type === 'list_item_full'
  );
  if (!hasListFullTrigger) return;

  // Extract field ID from claims key (format: claims:{fieldId}:{itemId}:{personId})
  const parts = key.split(':');
  if (parts.length < 3) return;
  const fieldId = parts[1];

  // Get template to check item capacity
  const addonConfig = await ctx.rawCtx.db
    .query('eventAddonConfigs')
    .withIndex('by_event_addon', q =>
      q.eq('eventId', ctx.eventId).eq('addonType', ctx.addonType)
    )
    .first();

  if (!addonConfig?.config) return;
  const config = addonConfig.config as Record<string, unknown>;
  const template = config.template as Record<string, unknown>;
  if (!template?.sections) return;

  const sections = template.sections as Array<{
    fields: Array<{
      id: string;
      type: string;
      items?: Array<{ id: string; quantity: number }>;
    }>;
  }>;

  // Find the field
  let field: (typeof sections)[0]['fields'][0] | undefined;
  for (const section of sections) {
    field = section.fields.find(f => f.id === fieldId);
    if (field) break;
  }
  if (!field || field.type !== 'list_item' || !field.items) return;

  // Count claims for each item in this field
  const addonData = await ctx.queryAddonData();
  const claims = addonData.filter(d => d.key.startsWith(`claims:${fieldId}:`));

  // Check each item
  for (const item of field.items) {
    const itemClaims = claims.filter(c =>
      c.key.startsWith(`claims:${fieldId}:${item.id}:`)
    );
    if (itemClaims.length >= item.quantity) {
      // This item is full — fire the trigger
      await runAutomations(ctx, 'list_item_full', {
        personId: submitterId,
        fieldValues,
        fieldId,
      });
      break; // Only fire once per submission
    }
  }
}

/**
 * Check if any vote option has reached its threshold.
 */
async function checkVoteThreshold(
  ctx: TrustedAddonContext,
  automations: Automation[],
  submitterId: Id<'persons'>,
  fieldValues: Record<string, unknown>
): Promise<void> {
  const thresholdAutomations = automations.filter(
    a => a.enabled && a.trigger.type === 'vote_threshold'
  );
  if (thresholdAutomations.length === 0) return;

  // Count votes
  const addonData = await ctx.queryAddonData();
  const votes = addonData.filter(d => d.key.startsWith('vote:'));

  // Build vote counts
  const voteCounts = new Map<string, number>();
  for (const vote of votes) {
    const voteData = vote.data;
    if (Array.isArray(voteData)) {
      for (const option of voteData) {
        const key = String(option);
        voteCounts.set(key, (voteCounts.get(key) ?? 0) + 1);
      }
    } else if (typeof voteData === 'string') {
      voteCounts.set(voteData, (voteCounts.get(voteData) ?? 0) + 1);
    }
  }

  // Find the max vote count
  let maxCount = 0;
  for (const count of voteCounts.values()) {
    if (count > maxCount) maxCount = count;
  }

  // Fire for each threshold that's been reached
  for (const auto of thresholdAutomations) {
    const threshold = auto.trigger.threshold ?? 0;
    if (maxCount >= threshold) {
      await runAutomations(ctx, 'vote_threshold', {
        personId: submitterId,
        fieldValues,
        threshold: maxCount,
      });
      break; // Only fire once
    }
  }
}
