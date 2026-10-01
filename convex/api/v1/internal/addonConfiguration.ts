import type { MutationCtx } from '../../../_generated/server';
import type { Id } from '../../../_generated/dataModel';
import { getAddonHandler } from '../../../addons/registry';
import { requireDiscordGuildAuthorization } from '../../../discord/authorization';

const topLevelFields: Record<string, string[]> = {
  reminders: ['reminderOffset'],
  questionnaire: ['questions'],
  'bring-list': ['items'],
  discord: ['guildId', 'guildName'],
};
const fieldOptions: Record<string, string[]> = {
  text: ['maxLength'],
  number: ['min', 'max'],
  select: ['options'],
  multiselect: ['options'],
  vote: ['options'],
  list_item: ['items'],
};
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('config: expected a JSON object');
  return value as Record<string, unknown>;
}
function same(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false;
  const left = Object.keys(a).sort();
  const right = Object.keys(b).sort();
  return (
    left.length === right.length &&
    left.every(
      (key, i) =>
        key === right[i] &&
        same(
          (a as Record<string, unknown>)[key],
          (b as Record<string, unknown>)[key]
        )
    )
  );
}
function protectedEqual(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
  editable: string[],
  path: string
) {
  const protectedA = Object.fromEntries(
    Object.entries(a).filter(([key]) => !editable.includes(key))
  );
  const protectedB = Object.fromEntries(
    Object.entries(b).filter(([key]) => !editable.includes(key))
  );
  if (!same(protectedA, protectedB))
    throw new Error(
      `${path}: definition fields are protected; change only app-supported configurable settings`
    );
}
/** Only the existing template's event-level editor settings are mutable. */
function validateCustomEdits(source: unknown, candidate: unknown) {
  const base = record(source);
  const next = record(candidate);
  protectedEqual(base, next, ['sections'], 'config.template');
  const sections = base.sections as Record<string, unknown>[];
  if (!Array.isArray(next.sections) || next.sections.length !== sections.length)
    throw new Error(
      'config.template.sections: sections cannot be added or removed'
    );
  sections.forEach((section, index) => {
    const updated = record((next.sections as unknown[])[index]);
    const path = `config.template.sections[${index}]`;
    protectedEqual(section, updated, ['fields'], path);
    const fields = updated.fields;
    if (!Array.isArray(fields))
      throw new Error(`${path}.fields: expected array`);
    if (section.configurable === true) {
      const allowed = (section.allowedFieldTypes as string[] | undefined)
        ?.length
        ? (section.allowedFieldTypes as string[])
        : ['text', 'number', 'select', 'multiselect', 'yesno'];
      fields.forEach((value, i) => {
        const f = record(value);
        if (!allowed.includes(String(f.type)))
          throw new Error(
            `${path}.fields[${i}].type: not allowed in this section`
          );
        const originals = section.fields as Record<string, unknown>[];
        const original =
          originals.find(field => field.id === f.id) ?? originals[i];
        const editable = [
          'id',
          'label',
          'required',
          ...(fieldOptions[String(f.type)] ?? []),
          ...(f.type === 'text' ? ['variant'] : []),
        ];
        if (original && original.type === f.type) {
          protectedEqual(original, f, editable, `${path}.fields[${i}]`);
        } else {
          const defaults: Record<string, Record<string, unknown>> = {
            vote: { allowMultiple: false, showResults: true },
            toggle: { defaultEnabled: true },
            action_button: {
              buttonLabel: 'Click Me',
              buttonVariant: 'default',
              actions: [],
            },
            static_text: { content: '', textFormat: 'p' },
            dynamic_summary: {
              summaryType: 'response_count',
              summaryLabel: '',
            },
            divider: { dividerLabel: '' },
            info_callout: { calloutVariant: 'info', calloutMessage: '' },
          };
          protectedEqual(
            { type: f.type, ...defaults[String(f.type)] },
            f,
            editable,
            `${path}.fields[${i}]`
          );
        }
      });
    } else {
      const originals = section.fields as Record<string, unknown>[];
      if (fields.length !== originals.length)
        throw new Error(`${path}.fields: fields cannot be added or removed`);
      originals.forEach((f, i) =>
        protectedEqual(
          f,
          record(fields[i]),
          f.configurable === true ? (fieldOptions[String(f.type)] ?? []) : [],
          `${path}.fields[${i}]`
        )
      );
    }
  });
}
export async function validatedConfiguration(
  ctx: MutationCtx,
  eventId: Id<'events'>,
  personId: Id<'persons'>,
  addonType: string,
  value: unknown,
  enabling: boolean
): Promise<Record<string, unknown>> {
  await requireConfigurationRole(ctx, eventId, personId);
  const input = record(value);
  let config = input;
  const handler = getAddonHandler(addonType);
  if (!handler) throw new Error(`addonType: unknown add-on ${addonType}`);
  if (addonType.startsWith('custom:')) {
    const templateId = addonType.slice(7);
    if (input.templateId !== undefined && input.templateId !== templateId)
      throw new Error(
        'config.templateId: must match the custom add-on identifier'
      );
    if (
      Object.keys(input).some(key => !['templateId', 'template'].includes(key))
    )
      throw new Error(
        'config: custom add-ons accept templateId and template only'
      );
    const existing = await ctx.db
      .query('eventAddonConfigs')
      .withIndex('by_event_addon', q =>
        q.eq('eventId', eventId).eq('addonType', addonType)
      )
      .first();
    let base: unknown;
    if (existing) base = record(existing.config).template;
    else {
      const id = ctx.db.normalizeId('addonTemplates', templateId);
      const template = id ? await ctx.db.get(id) : null;
      if (
        !enabling ||
        !template ||
        template.ownerId !== personId ||
        !template.isPublished
      )
        throw new Error(
          'config.templateId: select an existing published template owned by this identity'
        );
      base = template.template;
    }
    const candidate =
      input.template !== undefined
        ? restoreWebhookSecrets(base, input.template)
        : base;
    if (input.template !== undefined) validateCustomEdits(base, candidate);
    config = { templateId, template: candidate };
  } else {
    const fields = topLevelFields[addonType];
    if (!fields || Object.keys(input).some(key => !fields.includes(key)))
      throw new Error(
        `config: ${addonType} accepts only ${fields?.join(', ') ?? 'registered settings'}; secret/server fields are not accepted`
      );
  }
  if (JSON.stringify(config).length > 64 * 1024)
    throw new Error('config: maximum JSON size is 64 KiB');
  if (!handler.validateConfig(config)) {
    const guidance: Record<string, string> = {
      reminders:
        'reminderOffset must be a supported offset such as 1_HOUR or 1_DAY',
      questionnaire:
        'questions must be nonempty; each question needs id, label, supported uppercase type, required:boolean, and options for choice types',
      'bring-list':
        'items must be nonempty; each item needs id, name, and quantity >= 1',
      discord: 'guildId and guildName must be nonempty strings',
    };
    throw new Error(
      `config: ${guidance[addonType] ?? 'template must pass the existing custom add-on validator'}`
    );
  }
  await requireDiscordGuildAuthorization(ctx, personId, addonType, config);
  return config;
}

/** Public config snapshots must never include webhook credentials or transport secrets. */
export function publicConfiguration(
  addonType: string,
  value: unknown
): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  if (!addonType.startsWith('custom:')) {
    const fields = topLevelFields[addonType] ?? [];
    return Object.fromEntries(
      Object.entries(value).filter(([key]) => fields.includes(key))
    );
  }
  return redactWebhookSecrets(value);
}
function redactWebhookSecrets(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactWebhookSecrets);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !['webhookUrl', 'webhookHeaders'].includes(key))
      .map(([key, item]) => [key, redactWebhookSecrets(item)])
  );
}
/** Preserve omitted secret fields while allowing public snapshots to round-trip. */
function restoreWebhookSecrets(source: unknown, input: unknown): unknown {
  if (Array.isArray(source) && Array.isArray(input))
    return input.map((item, index) => {
      const identity =
        item && typeof item === 'object' && 'id' in item ? item.id : undefined;
      const original =
        identity === undefined
          ? source[index]
          : (source.find(
              value =>
                value &&
                typeof value === 'object' &&
                'id' in value &&
                value.id === identity
            ) ?? source[index]);
      return restoreWebhookSecrets(original, item);
    });
  if (
    !source ||
    !input ||
    typeof source !== 'object' ||
    typeof input !== 'object' ||
    Array.isArray(source) ||
    Array.isArray(input)
  )
    return input;
  const base = source as Record<string, unknown>;
  const result = { ...input } as Record<string, unknown>;
  for (const [key, value] of Object.entries(base)) {
    if (['webhookUrl', 'webhookHeaders'].includes(key) && !(key in result))
      result[key] = value;
    else if (key in result)
      result[key] = restoreWebhookSecrets(value, result[key]);
  }
  return result;
}
export async function requireConfigurationRole(
  ctx: MutationCtx,
  eventId: Id<'events'>,
  personId: Id<'persons'>
) {
  const event = await ctx.db.get(eventId);
  const membership = await ctx.db
    .query('memberships')
    .withIndex('by_person_event', q =>
      q.eq('personId', personId).eq('eventId', eventId)
    )
    .first();
  if (
    !event ||
    !membership ||
    !['ORGANIZER', 'MODERATOR'].includes(membership.role)
  )
    throw new Error(
      'Only organizers and moderators may configure event add-ons'
    );
}
