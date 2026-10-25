import { ConvexError, v } from 'convex/values';
import { internalMutation, internalQuery } from '../_generated/server';
import type { QueryCtx } from '../_generated/server';
import type { Doc } from '../_generated/dataModel';
import { DefinitionDocumentSchema } from './definition';
const record = (row: Doc<'addonTemplates'>) => ({
  id: row._id,
  name: row.name,
  description: row.description,
  iconName: row.iconName,
  template: row.template,
  version: row.version,
  isPublished: row.isPublished,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});
const fail = (code: string, message: string): never => {
  throw new ConvexError({ code, message });
};
async function owned(ctx: QueryCtx, id: string, personId: string) {
  const normalized = ctx.db.normalizeId('addonTemplates', id);
  const row = normalized ? await ctx.db.get(normalized) : null;
  if (!row || row.ownerId !== personId)
    return fail('NOT_FOUND', 'Template definition not found');
  return row;
}
function parse(document: unknown) {
  const result = DefinitionDocumentSchema.safeParse(document);
  if (!result.success)
    return fail(
      'VALIDATION_ERROR',
      'Invalid template definition. Unknown fields and send_webhook actions are unsupported. ' +
        result.error.issues
          .map(i => `${i.path.join('.')}: ${i.message}`)
          .join('; ')
    );
  const { schemaVersion: _schemaVersion, ...data } = result.data;
  return data;
}
export const list = internalQuery({
  args: {
    personId: v.id('persons'),
    limit: v.number(),
    cursor: v.union(v.string(), v.null()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const page = await ctx.db
      .query('addonTemplates')
      .withIndex('by_owner', q => q.eq('ownerId', args.personId))
      .order('desc')
      .paginate({
        numItems: Math.min(100, Math.max(1, args.limit)),
        cursor: args.cursor,
      });
    return {
      items: page.page.map(record),
      nextCursor: page.isDone ? null : page.continueCursor,
    };
  },
});
export const get = internalQuery({
  args: { personId: v.string(), id: v.string() },
  returns: v.any(),
  handler: async (ctx, args) =>
    record(await owned(ctx, args.id, args.personId)),
});
export const create = internalMutation({
  args: { personId: v.id('persons'), document: v.any() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const data = parse(args.document);
    const now = Date.now();
    const id = await ctx.db.insert('addonTemplates', {
      ...data,
      ownerId: args.personId,
      version: 1,
      isPublished: false,
      createdAt: now,
      updatedAt: now,
    });
    return record((await ctx.db.get(id))!);
  },
});
export const change = internalMutation({
  args: {
    personId: v.string(),
    id: v.string(),
    expectedVersion: v.number(),
    operation: v.union(
      v.literal('replace'),
      v.literal('publish'),
      v.literal('unpublish'),
      v.literal('delete')
    ),
    document: v.optional(v.any()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const row = await owned(ctx, args.id, args.personId);
    if (!Number.isSafeInteger(args.expectedVersion) || args.expectedVersion < 1)
      return fail(
        'VALIDATION_ERROR',
        'expectedVersion must be a positive integer'
      );
    if (row.version !== args.expectedVersion)
      return fail(
        'CONFLICT',
        'Template changed; fetch the latest definition before retrying'
      );
    if (args.operation === 'delete') {
      await ctx.db.delete(row._id);
      return { id: row._id, deleted: true };
    }
    const data = args.operation === 'replace' ? parse(args.document) : {};
    if (args.operation === 'publish')
      parse({
        schemaVersion: 1,
        name: row.name,
        description: row.description,
        iconName: row.iconName,
        template: row.template,
      });
    await ctx.db.patch(row._id, {
      ...data,
      version: row.version + 1,
      updatedAt: Date.now(),
      isPublished:
        args.operation === 'publish'
          ? true
          : args.operation === 'unpublish'
            ? false
            : row.isPublished,
    });
    return record((await ctx.db.get(row._id))!);
  },
});
