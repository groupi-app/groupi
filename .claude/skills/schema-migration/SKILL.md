---
name: schema-migration
description: Convex schema evolution and migration patterns for Groupi. Covers adding fields, renaming tables, backfilling data, and handling backward compatibility. Use when modifying the database schema.
---

# Schema Migration Guide

Convex uses a push-based schema system. Changes to `convex/schema.ts` are applied on deploy. Understanding safe vs unsafe changes is critical.

## Safe Changes (No Migration Needed)

These can be applied directly:

- **Adding a new table** - No existing data affected
- **Adding an optional field** - Use `v.optional(v.string())`
- **Adding a new index** - Backfills automatically
- **Removing an unused index** - Safe if no queries use it

## Unsafe Changes (Require Migration)

These need careful handling:

### Adding a Required Field

```typescript
// WRONG: Will reject existing documents
defineTable({
  title: v.string(),
  newField: v.string(), // Existing docs don't have this!
});

// RIGHT: Add as optional first, backfill, then make required
// Step 1: Add as optional
defineTable({
  title: v.string(),
  newField: v.optional(v.string()),
});

// Step 2: Create a migration mutation to backfill
export const backfillNewField = internalMutation({
  handler: async ctx => {
    const docs = await ctx.db
      .query('items')
      .filter(q => q.eq(q.field('newField'), undefined))
      .take(100);

    for (const doc of docs) {
      await ctx.db.patch(doc._id, { newField: 'default' });
    }

    return docs.length; // Return count for progress tracking
  },
});

// Step 3: After all docs backfilled, make required
```

### Changing a Field Type

Never change a field type in place. Instead:

1. Add new field with new type (optional)
2. Write migration to copy/transform data
3. Update queries to read from new field
4. Remove old field after all data migrated

### Removing a Field

1. Stop writing to the field in mutations
2. Update queries to not depend on the field
3. Remove from schema (Convex ignores extra fields in documents)
4. Optionally clean up with a migration mutation

## Migration Mutation Pattern

```typescript
import { internalMutation } from '../_generated/server';

export const migrateData = internalMutation({
  handler: async ctx => {
    const batch = await ctx.db
      .query('items')
      .filter(q => q.eq(q.field('_migrated'), undefined))
      .take(100);

    if (batch.length === 0) return { done: true, count: 0 };

    for (const doc of batch) {
      await ctx.db.patch(doc._id, {
        newField: transformOldToNew(doc.oldField),
        _migrated: true,
      });
    }

    return { done: false, count: batch.length };
  },
});
```

Run in batches via the Convex dashboard or a scheduled function.

## Index Changes

- **Adding an index**: Always safe. Convex backfills automatically.
- **Removing an index**: Safe only if no queries reference it. Search for uses first.
- **Renaming an index**: Add new index, update queries, remove old index (3-step).

## Schema Change Checklist

- [ ] Is this a safe change? (new table, optional field, new index)
- [ ] If unsafe, is a migration plan documented?
- [ ] Are existing queries compatible with both old and new schema?
- [ ] Have you run `pnpm generate` after schema changes?
- [ ] Are tests updated for the new schema shape?
- [ ] Is the migration mutation batched (100 docs at a time)?
- [ ] Have you tested the migration with sample data?

## Current Schema Reference

```
!`head -80 convex/schema.ts`
```
