# Groupi Convex Backend

The Convex backend for Groupi, providing real-time database, authentication, and serverless functions.

## Overview

Convex serves as the complete backend for Groupi, handling:

- Real-time database with automatic subscriptions
- Authentication via Better Auth integration
- Serverless functions (queries, mutations, actions)
- File storage
- Scheduled jobs

## Directory Structure

```
convex/
├── _generated/           # Auto-generated types (don't edit)
├── auth.ts               # Better Auth configuration
├── schema.ts             # Database schema definition
├── events/               # Event-related functions
│   ├── queries.ts        # Read operations
│   └── mutations.ts      # Write operations
├── persons/              # User profile functions
├── posts/                # Discussion/post functions
├── replies/              # Reply functions
├── memberships/          # Event membership functions
├── notifications/        # Notification functions
├── presence/             # Real-time presence functions
├── friends/              # Friend system functions
└── tests/                # Backend tests
```

## Core Tables

| Table            | Purpose                                     |
| ---------------- | ------------------------------------------- |
| `users`          | Better Auth user accounts                   |
| `persons`        | App profiles (linked to users via `userId`) |
| `events`         | Events with dates, location, reminders      |
| `memberships`    | Person-to-event relationships with roles    |
| `posts`          | Event discussion posts                      |
| `replies`        | Replies to posts                            |
| `notifications`  | User notifications                          |
| `presenceTokens` | Real-time presence tracking                 |

## Authentication

Authentication uses Better Auth with Convex component:

```typescript
import { requireAuth, getCurrentPerson } from './auth';

// In mutations - require authentication
export const createEvent = mutation({
  args: { title: v.string() },
  handler: async (ctx, args) => {
    const { user, person } = await requireAuth(ctx);
    // user is authenticated, person is their app profile
  },
});

// In queries - optional authentication
export const getPublicEvents = query({
  handler: async ctx => {
    const person = await getCurrentPerson(ctx);
    // person may be null if not authenticated
  },
});
```

## Writing Functions

### Queries (Read Operations)

```typescript
// convex/events/queries.ts
import { query } from '../_generated/server';
import { v } from 'convex/values';

export const getEvent = query({
  args: { eventId: v.id('events') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.eventId);
  },
});

export const listUserEvents = query({
  args: {},
  handler: async ctx => {
    const person = await getCurrentPerson(ctx);
    if (!person) return [];

    const memberships = await ctx.db
      .query('memberships')
      .withIndex('by_person', q => q.eq('personId', person._id))
      .collect();

    return Promise.all(memberships.map(m => ctx.db.get(m.eventId)));
  },
});
```

### Mutations (Write Operations)

```typescript
// convex/events/mutations.ts
import { mutation } from '../_generated/server';
import { v } from 'convex/values';

export const createEvent = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { person } = await requireAuth(ctx);

    const eventId = await ctx.db.insert('events', {
      title: args.title,
      description: args.description,
      location: args.location,
      creatorId: person._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Auto-add creator as organizer
    await ctx.db.insert('memberships', {
      eventId,
      personId: person._id,
      role: 'ORGANIZER',
      rsvpStatus: 'YES',
    });

    return eventId;
  },
});
```

## Schema Definition

The schema is defined in `schema.ts`:

```typescript
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  events: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    creatorId: v.id('persons'),
    // ... more fields
  }).index('by_creator', ['creatorId']),

  memberships: defineTable({
    eventId: v.id('events'),
    personId: v.id('persons'),
    role: v.union(
      v.literal('ORGANIZER'),
      v.literal('MODERATOR'),
      v.literal('ATTENDEE')
    ),
    rsvpStatus: v.union(v.literal('YES'), v.literal('NO'), v.literal('MAYBE')),
  })
    .index('by_event', ['eventId'])
    .index('by_person', ['personId']),
});
```

## Development

### Regenerating Types

After modifying `schema.ts` or function signatures:

```bash
pnpm generate
```

### Running Tests

```bash
pnpm test:convex
```

### Viewing Logs

Use `console.log` in your functions - logs appear in the Convex dashboard.

## Best Practices

1. **Always validate inputs** using `v` validators in args
2. **Use indexes** for all queries to ensure performance
3. **Check authentication** at the start of protected functions
4. **Avoid N+1 queries** by fetching related data efficiently
5. **Use transactions** (mutations are automatically transactional)

## Related Documentation

- [Convex Documentation](https://docs.convex.dev/)
- [Architecture Rules](../.claude/rules/architecture.md)
- [Testing Guide](../.claude/rules/testing.md)
