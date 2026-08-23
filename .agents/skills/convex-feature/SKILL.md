---
name: convex-feature
description: Building new Convex backend features for Groupi. Covers the full development order from schema design through queries, mutations, shared hooks, and UI integration. Use when adding a new domain or feature that requires backend work.
---

# Building a Convex Feature

Follow this exact order. Do not skip steps.

## Step 1: Schema (`convex/schema.ts`)

Add the table definition with proper validators, indexes, and relationships.

Read `convex/schema.ts` before designing the change.

Key patterns:

- Use `v.union(v.literal("A"), v.literal("B"))` for enums
- Name indexes as `by_{field}` or `by_{field1}_{field2}`
- Reference other tables with `v.id("tableName")`
- Always include `createdAt` and `updatedAt` timestamps where appropriate

## Step 2: Create Domain Directory

```
convex/{domain}/
  queries.ts    # Read operations
  mutations.ts  # Write operations
```

Inspect existing directories under `convex/` and follow the closest domain pattern.

## Step 3: Queries (`convex/{domain}/queries.ts`)

```typescript
import { query } from '../_generated/server';
import { v } from 'convex/values';
import { getCurrentPerson } from '../auth';

export const getItem = query({
  args: { itemId: v.id('items') },
  returns: v.union(
    v.object({
      /* fields */
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const person = await getCurrentPerson(ctx);
    if (!person) return null;

    return await ctx.db.get(args.itemId);
  },
});
```

Rules:

- Always include `args` and `returns` validators
- Use `getCurrentPerson(ctx)` for optional auth (queries)
- Use indexes: `ctx.db.query("table").withIndex("by_field", q => q.eq("field", value))`
- Never use `.filter()` on large collections -- use indexes

## Step 4: Mutations (`convex/{domain}/mutations.ts`)

```typescript
import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import { requireAuth } from '../auth';

export const createItem = mutation({
  args: { title: v.string(), eventId: v.id('events') },
  returns: v.id('items'),
  handler: async (ctx, args) => {
    const { person } = await requireAuth(ctx);

    const itemId = await ctx.db.insert('items', {
      title: args.title,
      eventId: args.eventId,
      creatorId: person._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return itemId;
  },
});
```

Rules:

- Use `requireAuth(ctx)` for mutations (throws if unauthenticated)
- Always validate inputs via `args`
- Include `returns` validator

## Step 5: Run `pnpm generate`

Regenerates TypeScript types in `convex/_generated/`. Required after any schema or function signature changes.

## Step 6: Shared Hooks (`packages/shared/src/hooks/`)

Create data and action hooks using the factory pattern. Use `$cross-platform-hook` for details.

Export from `packages/shared/src/hooks/index.ts`.

## Step 7: Platform UI

Build web components using shared hooks. Use `$web-component` for component patterns.

## Checklist

- [ ] Schema table added with indexes
- [ ] Queries created with args/returns validators
- [ ] Mutations created with auth + args/returns validators
- [ ] `pnpm generate` run
- [ ] Shared hooks created with factory pattern
- [ ] Hooks exported from index.ts
- [ ] Tests written (use `$test-convex`)
- [ ] `pnpm check` passes
