import { internalMutation, internalQuery } from '../_generated/server';
import { v, type Validator, type Infer } from 'convex/values';
import { addonConfig, addonData, template } from '../addons/contracts';
import { parseWebhookHeaders } from '../notifications/contracts';

// This audit uses the exact proposed storage validators, without returning stored payloads.
function matches(
  value: unknown,
  validator: Validator<unknown, 'required' | 'optional', string>
): boolean {
  switch (validator.kind) {
    case 'null':
      return value === null;
    case 'float64':
      return typeof value === 'number';
    case 'boolean':
      return typeof value === 'boolean';
    case 'string':
    case 'id':
      return typeof value === 'string';
    case 'int64':
      return typeof value === 'bigint';
    case 'bytes':
      return value instanceof ArrayBuffer;
    case 'literal':
      return value === validator.value;
    case 'union':
      return validator.members.some(member => matches(value, member));
    case 'array':
      return (
        Array.isArray(value) &&
        value.every(item => matches(item, validator.element))
      );
    case 'record':
      return (
        object(value) &&
        Object.values(value).every(item => matches(item, validator.value))
      );
    case 'object': {
      if (!object(value)) return false;
      return (
        Object.keys(value).every(key => key in validator.fields) &&
        Object.entries(validator.fields).every(([key, field]) =>
          value[key] === undefined
            ? field.isOptional === 'optional'
            : matches(value[key], field)
        )
      );
    }
    default:
      return false;
  }
}
function object(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
const tables = v.union(
  v.literal('addonTemplates'),
  v.literal('eventAddonConfigs'),
  v.literal('addonData'),
  v.literal('notificationMethods')
);
const args = {
  table: tables,
  cursor: v.union(v.string(), v.null()),
  limit: v.number(),
};
const finding = v.object({
  id: v.string(),
  reason: v.union(
    v.literal('invalid_template'),
    v.literal('invalid_config'),
    v.literal('invalid_data'),
    v.literal('legacy_headers'),
    v.literal('invalid_headers')
  ),
});
const headers = v.record(v.string(), v.string());
const result = v.object({
  inspected: v.number(),
  findings: v.array(finding),
  nextCursor: v.union(v.string(), v.null()),
});
function issue(row: { _id: string }, reason: Infer<typeof finding>['reason']) {
  return { id: row._id, reason };
}

/** Deploy this read-only audit against the pre-tightening schema first; see rollout doc. */
export const audit = internalQuery({
  args,
  returns: result,
  handler: async (ctx, { table, cursor, limit }) => {
    const page = await ctx.db
      .query(table)
      .withIndex('by_creation_time')
      .paginate({
        cursor,
        numItems: Math.min(100, Math.max(1, Math.floor(limit))),
      });
    const findings = page.page.flatMap(row => {
      if ('template' in row)
        return matches(row.template, template)
          ? []
          : [issue(row, 'invalid_template')];
      if ('config' in row)
        return matches(row.config, addonConfig)
          ? []
          : [issue(row, 'invalid_config')];
      if ('data' in row)
        return matches(row.data, addonData) ? [] : [issue(row, 'invalid_data')];
      const value: unknown = row.webhookHeaders;
      if (value === undefined || matches(value, headers)) return [];
      if (typeof value === 'string') {
        try {
          parseWebhookHeaders(value);
          return [issue(row, 'legacy_headers')];
        } catch {
          /* retain unsupported data */
        }
      }
      return [issue(row, 'invalid_headers')];
    });
    return {
      inspected: page.page.length,
      findings,
      nextCursor: page.isDone ? null : page.continueCursor,
    };
  },
});

/** Deterministic repairs only: JSON header maps and missing draft envelope metadata. */
export const normalize = internalMutation({
  args: {
    table: v.union(
      v.literal('addonTemplates'),
      v.literal('notificationMethods')
    ),
    cursor: v.union(v.string(), v.null()),
    limit: v.number(),
  },
  returns: v.object({
    inspected: v.number(),
    normalized: v.number(),
    unresolvedIds: v.array(v.string()),
    nextCursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, { table, cursor, limit }) => {
    const page = await ctx.db
      .query(table)
      .withIndex('by_creation_time')
      .paginate({
        cursor,
        numItems: Math.min(100, Math.max(1, Math.floor(limit))),
      });
    let normalized = 0;
    const unresolvedIds: string[] = [];
    for (const row of page.page) {
      if ('template' in row) {
        if (matches(row.template, template)) continue;
        const value: unknown = row.template;
        if (!object(value)) {
          unresolvedIds.push(row._id);
          continue;
        }
        const candidate = {
          ...value,
          name: value.name === undefined ? row.name : value.name,
          description:
            value.description === undefined
              ? row.description
              : value.description,
          iconName:
            value.iconName === undefined ? row.iconName : value.iconName,
        };
        if (!isTemplate(candidate)) {
          unresolvedIds.push(row._id);
          continue;
        }
        await ctx.db.patch(row._id, { template: candidate });
        normalized++;
      } else {
        const value: unknown = row.webhookHeaders;
        if (value === undefined || matches(value, headers)) continue;
        if (typeof value !== 'string') {
          unresolvedIds.push(row._id);
          continue;
        }
        try {
          await ctx.db.patch(row._id, {
            webhookHeaders: parseWebhookHeaders(value),
          });
          normalized++;
        } catch {
          unresolvedIds.push(row._id);
        }
      }
    }
    return {
      inspected: page.page.length,
      normalized,
      unresolvedIds,
      nextCursor: page.isDone ? null : page.continueCursor,
    };
  },
});
function isTemplate(value: unknown): value is Infer<typeof template> {
  return matches(value, template);
}
