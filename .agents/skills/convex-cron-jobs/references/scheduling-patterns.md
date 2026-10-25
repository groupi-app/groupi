# Scheduling patterns

Working code for the scheduler cases that come up after the first cron: cursor batching, retries, cancelling, inspecting the queue, debouncing, and local time zones.

## Batched work with a cursor

Use `take(n)` and reschedule when each write removes the row from the index range (delete, or a status change the index covers). When rows stay in place, a `take` loop would reprocess the same rows forever. Carry a pagination cursor instead.

```typescript
// convex/backfill.ts
import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

const BATCH = 100;

export const addDisplayName = internalMutation({
  args: { cursor: v.union(v.string(), v.null()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const result = await ctx.db
      .query("users")
      .paginate({ numItems: BATCH, cursor: args.cursor });

    await Promise.all(
      result.page
        .filter((user) => user.displayName === undefined)
        .map((user) =>
          ctx.db.patch(user._id, { displayName: user.email.split("@")[0] }),
        ),
    );

    if (!result.isDone) {
      await ctx.scheduler.runAfter(0, internal.backfill.addDisplayName, {
        cursor: result.continueCursor,
      });
    }
    return null;
  },
});
```

Kick it off once from the dashboard or a cron: `internal.backfill.addDisplayName` with `{ cursor: null }`. For repeatable, resumable migrations use `@convex-dev/migrations`, which wraps this pattern with progress tracking.

## Retry with backoff

Scheduled actions are not retried by Convex. Catch the failure and reschedule yourself with a growing delay. Cap attempts so a dead endpoint does not run forever.

```typescript
// convex/sync.ts
import { internalAction, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

const MAX_ATTEMPTS = 5;
const BASE_DELAY_MS = 30 * 1000;

export const pullOrders = internalAction({
  args: { attempt: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      const res = await fetch("https://api.example.com/orders", {
        headers: { Authorization: `Bearer ${process.env.ORDERS_API_KEY}` },
      });
      if (!res.ok) {
        throw new Error(`orders API returned ${res.status}`);
      }
      const orders: Array<{ id: string; total: number }> = await res.json();
      await ctx.runMutation(internal.sync.storeOrders, { orders });
    } catch (error) {
      if (args.attempt >= MAX_ATTEMPTS) {
        console.error("pullOrders gave up", { attempt: args.attempt, error });
        return null;
      }
      // 30s, 60s, 120s, 240s, 480s
      const delay = BASE_DELAY_MS * 2 ** args.attempt;
      await ctx.scheduler.runAfter(delay, internal.sync.pullOrders, {
        attempt: args.attempt + 1,
      });
    }
    return null;
  },
});

export const storeOrders = internalMutation({
  args: {
    orders: v.array(v.object({ id: v.string(), total: v.number() })),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    for (const order of args.orders) {
      const existing = await ctx.db
        .query("orders")
        .withIndex("by_externalId", (q) => q.eq("externalId", order.id))
        .unique();
      if (existing) {
        if (existing.total !== order.total) {
          await ctx.db.patch(existing._id, { total: order.total });
        }
      } else {
        await ctx.db.insert("orders", {
          externalId: order.id,
          total: order.total,
        });
      }
    }
    return null;
  },
});
```

The cron entry calls `internal.sync.pullOrders` with `{ attempt: 0 }`. For production retry handling with dead letter tracking, look at `@convex-dev/action-retrier` and `@convex-dev/workpool` before writing more of this by hand.

## Cancelling a scheduled job

`runAfter` and `runAt` return an `Id<"_scheduled_functions">`. Store it on the document the job belongs to.

```typescript
// convex/schema.ts (fragment)
tasks: defineTable({
  title: v.string(),
  dueAt: v.number(),
  reminderJobId: v.optional(v.id("_scheduled_functions")),
}).index("by_dueAt", ["dueAt"]),
```

```typescript
// convex/reminders.ts
import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

export const schedule = internalMutation({
  args: { taskId: v.id("tasks") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) return null;
    const jobId = await ctx.scheduler.runAt(
      task.dueAt - 60 * 60 * 1000,
      internal.reminders.send,
      { taskId: args.taskId },
    );
    await ctx.db.patch(args.taskId, { reminderJobId: jobId });
    return null;
  },
});

export const cancel = internalMutation({
  args: { taskId: v.id("tasks") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task?.reminderJobId) return null;
    await ctx.scheduler.cancel(task.reminderJobId);
    await ctx.db.patch(args.taskId, { reminderJobId: undefined });
    return null;
  },
});
```

`cancel` stops a job that has not started. A job already in progress keeps running, but anything it tries to schedule is cancelled.

## Inspecting `_scheduled_functions`

Every scheduled job is a document in the `_scheduled_functions` system table. Read it with `ctx.db.system`.

```typescript
// convex/jobs.ts
import { internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const status = internalQuery({
  args: { jobId: v.id("_scheduled_functions") },
  returns: v.union(
    v.null(),
    v.object({
      name: v.string(),
      scheduledTime: v.number(),
      completedTime: v.optional(v.number()),
      state: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const job = await ctx.db.system.get(args.jobId);
    if (!job) return null;
    return {
      name: job.name,
      scheduledTime: job.scheduledTime,
      completedTime: job.completedTime,
      state: job.state.kind,
    };
  },
});
```

`state.kind` is one of `pending`, `inProgress`, `success`, `failed`, or `canceled`. A failed job also carries `state.error`. To list the whole queue from a function, `ctx.db.system.query("_scheduled_functions").collect()` works, but prefer the dashboard for anything beyond a debugging session since the table can grow large.

## Debouncing a scheduled job

When a document changes often and you want one job to run after the last change, cancel the pending job and schedule a fresh one. Same schema field as the cancel example.

```typescript
// convex/documents.ts
import { mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

const DEBOUNCE_MS = 10 * 1000;

export const updateBody = mutation({
  args: { documentId: v.id("documents"), body: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const doc = await ctx.db.get(args.documentId);
    if (!doc || doc.ownerId !== identity.subject) {
      throw new Error("Not found");
    }

    if (doc.reindexJobId) {
      await ctx.scheduler.cancel(doc.reindexJobId);
    }
    const reindexJobId = await ctx.scheduler.runAfter(
      DEBOUNCE_MS,
      internal.search.reindex,
      { documentId: args.documentId },
    );

    await ctx.db.patch(args.documentId, { body: args.body, reindexJobId });
    return null;
  },
});
```

Ten edits in ten seconds produce one `reindex` run. Because scheduling inside a mutation is transactional, a failed patch leaves no orphan job.

## Time zones with `crons.cron`

Cron expressions run in UTC. Two ways to handle a local time requirement:

1. Convert once. 09:00 in `America/New_York` is `0 14 * * *` in winter and `0 13 * * *` in summer. Pick one and accept the one hour drift across daylight saving.
2. Run hourly and check the local hour inside the job. No drift.

```typescript
// convex/digest.ts
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

const SEND_HOUR_LOCAL = 9;
const TIME_ZONE = "America/New_York";

function localHour(date: Date, timeZone: string): number {
  const text = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    hourCycle: "h23",
    timeZone,
  }).format(date);
  return Number(text);
}

export const sendIfLocalMorning = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    if (localHour(new Date(), TIME_ZONE) !== SEND_HOUR_LOCAL) {
      return null;
    }
    // Hand off instead of runAction so the real job shows up as its own run
    await ctx.scheduler.runAfter(0, internal.digest.send, {});
    return null;
  },
});
```

Cron entry: `crons.cron("digest local morning", "0 * * * *", internal.digest.sendIfLocalMorning, {})`. For per user time zones, store `timeZone` on the user, run hourly, and select users whose local hour matches inside a query that takes the current UTC hour as an argument.
