# Cron recipes

Four short jobs to copy: a daily digest email, session expiry, an hourly stats rollup, and a sync from an external API. Each shows the `crons.ts` entry and the internal target.

## Daily digest email

Cron fires an action. The action reads recipients through an internal query, sends through the email provider with `fetch`, then records the send through an internal mutation. The query takes `since` as an argument so it never calls `Date.now()`.

```typescript
// convex/crons.ts (entry)
crons.cron("daily digest", "0 13 * * *", internal.digest.send, {});
```

```typescript
// convex/digest.ts
import {
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

const DAY_MS = 24 * 60 * 60 * 1000;

export const recipients = internalQuery({
  args: { since: v.number() },
  returns: v.array(
    v.object({ userId: v.id("users"), email: v.string(), newTasks: v.number() }),
  ),
  handler: async (ctx, args) => {
    const users = await ctx.db
      .query("users")
      .withIndex("by_digestEnabled", (q) => q.eq("digestEnabled", true))
      .collect();

    const rows = await Promise.all(
      users.map(async (user) => {
        const tasks = await ctx.db
          .query("tasks")
          .withIndex("by_user_and_createdAt", (q) =>
            q.eq("userId", user._id).gt("createdAt", args.since),
          )
          .collect();
        return { userId: user._id, email: user.email, newTasks: tasks.length };
      }),
    );
    return rows.filter((row) => row.newTasks > 0);
  },
});

export const send = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const since = Date.now() - DAY_MS;
    const rows = await ctx.runQuery(internal.digest.recipients, { since });

    for (const row of rows) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "digest@example.com",
          to: row.email,
          subject: `${row.newTasks} new tasks since yesterday`,
          text: `You have ${row.newTasks} new tasks.`,
        }),
      });
      if (!res.ok) {
        console.error("digest send failed", { email: row.email, status: res.status });
        continue;
      }
      await ctx.runMutation(internal.digest.markSent, { userId: row.userId });
    }
    return null;
  },
});

export const markSent = internalMutation({
  args: { userId: v.id("users") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { lastDigestAt: Date.now() });
    return null;
  },
});
```

For more than a few hundred recipients, have `send` schedule one `internal.digest.sendOne` per user with `runAfter(0, ...)` so a single slow provider call does not stall the batch.

## Expire sessions

Same batched delete as the main skill, shown here with the schema it depends on. The index must cover the field used in the range.

```typescript
// convex/schema.ts (fragment)
sessions: defineTable({
  userId: v.id("users"),
  token: v.string(),
  expiresAt: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_token", ["token"])
  .index("by_expiresAt", ["expiresAt"]),
```

```typescript
// convex/crons.ts (entry)
crons.interval("expire sessions", { minutes: 15 }, internal.sessions.expireBatch, {});
```

```typescript
// convex/sessions.ts
import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

const BATCH = 200;

export const expireBatch = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const now = Date.now();
    const expired = await ctx.db
      .query("sessions")
      .withIndex("by_expiresAt", (q) => q.lt("expiresAt", now))
      .take(BATCH);

    await Promise.all(expired.map((s) => ctx.db.delete(s._id)));

    if (expired.length === BATCH) {
      await ctx.scheduler.runAfter(0, internal.sessions.expireBatch, {});
    }
    return expired.length;
  },
});
```

If a session row points at a stored file, delete the file too: `await ctx.storage.delete(session.storageId)` inside the same loop.

## Aggregate stats

Roll the previous hour's events into one row. Keyed by `hourStart` and guarded by an early return, so a rerun after a failure does not double count.

```typescript
// convex/schema.ts (fragment)
events: defineTable({
  kind: v.string(),
  createdAt: v.number(),
}).index("by_createdAt", ["createdAt"]),

hourlyStats: defineTable({
  hourStart: v.number(),
  count: v.number(),
}).index("by_hourStart", ["hourStart"]),
```

```typescript
// convex/crons.ts (entry)
crons.cron("hourly stats", "5 * * * *", internal.stats.rollupLastHour, {});
```

```typescript
// convex/stats.ts
import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

const HOUR_MS = 60 * 60 * 1000;

export const rollupLastHour = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const thisHour = Math.floor(Date.now() / HOUR_MS) * HOUR_MS;
    const hourStart = thisHour - HOUR_MS;

    const existing = await ctx.db
      .query("hourlyStats")
      .withIndex("by_hourStart", (q) => q.eq("hourStart", hourStart))
      .unique();
    if (existing) return null;

    const events = await ctx.db
      .query("events")
      .withIndex("by_createdAt", (q) =>
        q.gte("createdAt", hourStart).lt("createdAt", thisHour),
      )
      .collect();

    await ctx.db.insert("hourlyStats", { hourStart, count: events.length });
    return null;
  },
});
```

Runs at five past the hour so late writes from the previous hour are included. When an hour can hold more events than one query should read, switch to `@convex-dev/aggregate` and keep counts as events arrive instead of scanning.

## Sync from an external API

An action fetches, a mutation upserts by external id. Splitting them keeps the network call out of the transaction and lets the mutation stay small and idempotent.

```typescript
// convex/schema.ts (fragment)
products: defineTable({
  externalId: v.string(),
  name: v.string(),
  priceCents: v.number(),
  syncedAt: v.number(),
}).index("by_externalId", ["externalId"]),
```

```typescript
// convex/crons.ts (entry)
crons.interval("sync products", { minutes: 30 }, internal.catalog.sync, {});
```

```typescript
// convex/catalog.ts
import { internalAction, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

const productValidator = v.object({
  externalId: v.string(),
  name: v.string(),
  priceCents: v.number(),
});

export const sync = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const res = await fetch("https://api.example.com/products", {
      headers: { Authorization: `Bearer ${process.env.CATALOG_API_KEY}` },
    });
    if (!res.ok) {
      throw new Error(`catalog API returned ${res.status}`);
    }
    const raw: Array<{ id: string; title: string; price: number }> =
      await res.json();

    const products = raw.map((p) => ({
      externalId: p.id,
      name: p.title,
      priceCents: Math.round(p.price * 100),
    }));

    // Chunk so one mutation never carries too many writes
    for (let i = 0; i < products.length; i += 100) {
      await ctx.runMutation(internal.catalog.upsertMany, {
        products: products.slice(i, i + 100),
        syncedAt: Date.now(),
      });
    }
    return null;
  },
});

export const upsertMany = internalMutation({
  args: { products: v.array(productValidator), syncedAt: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    for (const product of args.products) {
      const existing = await ctx.db
        .query("products")
        .withIndex("by_externalId", (q) => q.eq("externalId", product.externalId))
        .unique();

      if (!existing) {
        await ctx.db.insert("products", { ...product, syncedAt: args.syncedAt });
        continue;
      }
      if (existing.name !== product.name || existing.priceCents !== product.priceCents) {
        await ctx.db.patch(existing._id, { ...product, syncedAt: args.syncedAt });
      }
    }
    return null;
  },
});
```

`"use node"` is not needed here. `fetch` is available in the default Convex runtime. Add the directive only when the action imports a Node built in or an SDK that requires one, and keep such actions in their own file.
