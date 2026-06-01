---
name: test-convex
description: Writing Convex backend tests for Groupi using convex-test, test helpers, and test scenarios. Use when creating or modifying tests in convex/tests/.
---

# Writing Convex Backend Tests

Tests live in `convex/tests/*.test.ts` and run in `edge-runtime` environment.

## Basic Setup

```typescript
import { convexTest } from 'convex-test';
import { describe, it, expect, beforeEach } from 'vitest';
import { api } from '../_generated/api';
import schema from '../schema';

const modules = import.meta.glob('../**/*.ts', { eager: true });

describe('My Feature', () => {
  let t: ReturnType<typeof convexTest>;

  beforeEach(() => {
    t = convexTest(schema, modules);
  });

  it('should do something', async () => {
    // test here
  });
});
```

## Test Scenarios

Use helpers from `convex/tests/test_helpers.ts`:

Current helpers:

```
!`head -80 convex/tests/test_helpers.ts`
```

### Quick Reference

```typescript
import {
  createTestInstance,
  createTestUser,
  createTestEventWithUser,
  TestScenarios,
} from './test_helpers';

// Simple user (no events) - for profile, settings tests
const { userId, personId, auth } = await TestScenarios.simpleUser(t);

// Single event - for post creation, event queries
const { userId, personId, eventId, membershipId, auth } =
  await TestScenarios.singleEvent(t);

// Multi-user event - for permissions, interactions
const { organizer, attendee, eventId, organizerAuth, attendeeAuth } =
  await TestScenarios.multiUser(t);

// Outsider (not a member) - for permission testing
const { eventId, outsiderAuth } = await TestScenarios.outsiderUser(t);
```

## Authentication

```typescript
// Authenticated user
const asUser = t.withIdentity({ subject: userId });
const result = await asUser.mutation(api.domain.mutations.create, { ... });

// Unauthenticated (should throw)
await expect(
  t.mutation(api.domain.mutations.create, { ... })
).rejects.toThrow('Authentication required');
```

## Data Setup Chain

When manually setting up data in `t.run()`, follow this order:

1. **users** (auth identity)
2. **persons** (app profile, references `userId`)
3. **events** (references `creatorId` = personId)
4. **memberships** (references `personId` + `eventId`)

```typescript
const { userId, personId, eventId } = await t.run(async ctx => {
  const userId = await ctx.db.insert('users', {
    email: 'test@example.com',
    emailVerified: false,
    banned: false,
    twoFactorEnabled: false,
    username: 'testuser',
    name: 'Test User',
  });

  const personId = await ctx.db.insert('persons', {
    userId: userId,
    bio: 'Test bio',
  });

  const eventId = await ctx.db.insert('events', {
    title: 'Test Event',
    description: 'A test event',
    creatorId: personId,
    location: 'Test Location',
    potentialDateTimes: [],
    chosenDateTime: undefined,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    timezone: 'UTC',
  });

  return { userId, personId, eventId };
});
```

## Verifying Database State

```typescript
const { post, notifications } = await t.run(async ctx => {
  const post = await ctx.db.get(postId);
  const notifications = await ctx.db.query('notifications').collect();
  return { post, notifications };
});

expect(post).toBeTruthy();
expect(notifications).toHaveLength(1);
expect(notifications[0].type).toBe('NEW_POST');
```

## Common Test Patterns

### Permission Testing

```typescript
it('should reject non-members', async () => {
  const { eventId, outsiderAuth } = await TestScenarios.outsiderUser(t);

  await expect(
    outsiderAuth.mutation(api.posts.mutations.createPost, {
      eventId,
      title: 'Unauthorized',
      content: 'Should fail',
    })
  ).rejects.toThrow();
});
```

### Cascade Deletes

```typescript
it('should cascade delete replies when post is deleted', async () => {
  // Create post + replies, delete post, verify replies gone
  const { replies } = await t.run(async ctx => ({
    replies: await ctx.db.query('replies').collect(),
  }));
  expect(replies).toHaveLength(0);
});
```

## Common Mistakes

- **No direct DB access outside `t.run()`**: Always wrap in `await t.run(async ctx => { ... })`
- **Missing modules glob**: Must pass `import.meta.glob('../**/*.ts', { eager: true })` to `convexTest()`
- **Non-existent schema fields**: Only use fields defined in `convex/schema.ts`
- **Wrong auth pattern**: Use `t.withIdentity({ subject: userId })`, not manual token creation

## Running Tests

```bash
pnpm test:convex        # Run all Convex tests
pnpm test:run           # Run all tests across packages
```
