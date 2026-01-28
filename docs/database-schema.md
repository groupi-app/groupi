# Database Schema Reference

This document outlines the Convex database schema for Groupi. Use this reference when writing tests to ensure correct field usage.

## Table of Contents

- [Core Tables](#core-tables)
- [Test Data Patterns](#test-data-patterns)
- [Common Test Mistakes](#common-test-mistakes)
- [Index Reference](#index-reference)

## Core Tables

### `users`

**Authentication and user profile data**

```typescript
{
  // Better Auth fields
  name?: string,
  email: string,
  emailVerified: boolean,
  image?: string,
  imageKey?: string, // UploadThing file key

  // Username plugin
  username?: string,
  displayUsername?: string,

  // Admin plugin
  role?: string, // "admin", "user", etc.
  banned: boolean,

  // Two-factor authentication
  twoFactorEnabled: boolean,

  // Profile fields
  pronouns?: string,
  bio?: string,
}
```

### `persons`

**1:1 relationship with users for app-specific data**

```typescript
{
  userId: Id<"users">, // Required reference
  bio?: string,
  pronouns?: string,
}
```

### `events`

**Event planning core entity**

```typescript
{
  title: string,
  description?: string,
  location?: string,
  creatorId: Id<"persons">, // Required reference
  potentialDateTimes: string[], // ISO date strings
  chosenDateTime?: string, // ISO date string
  createdAt: number, // Unix timestamp
  updatedAt: number, // Unix timestamp
  timezone: string,
}
```

### `memberships`

**User participation in events**

```typescript
{
  personId: Id<"persons">, // Required reference
  eventId: Id<"events">, // Required reference
  role: "ORGANIZER" | "MODERATOR" | "ATTENDEE",
  rsvpStatus: "YES" | "MAYBE" | "NO" | "PENDING",
  // ❌ NO joinedAt field - common mistake in tests
}
```

### `posts`

**Discussion posts within events**

```typescript
{
  title?: string,
  content: string,
  authorId: Id<"persons">, // Required reference
  eventId: Id<"events">, // Required reference
  membershipId?: Id<"memberships">,
  editedAt?: number, // Unix timestamp
}
```

### `replies`

**Responses to posts**

```typescript
{
  authorId: Id<"persons">, // Required reference
  postId: Id<"posts">, // Required reference
  text: string,
}
```

## Test Data Patterns

### Minimal Setup for Tests

```typescript
// 1. User (authentication)
const userId = await ctx.db.insert('users', {
  email: 'test@example.com',
  emailVerified: false,
  banned: false,
  twoFactorEnabled: false,
});

// 2. Person (app profile)
const personId = await ctx.db.insert('persons', {
  userId: userId,
});

// 3. Event
const eventId = await ctx.db.insert('events', {
  title: 'Test Event',
  creatorId: personId,
  location: 'Test Location',
  potentialDateTimes: [],
  chosenDateTime: undefined,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  timezone: 'UTC',
});

// 4. Membership
const membershipId = await ctx.db.insert('memberships', {
  personId: personId,
  eventId: eventId,
  role: 'ATTENDEE',
  rsvpStatus: 'YES',
  // ❌ Don't add joinedAt - field doesn't exist!
});
```

### Authentication in Tests

```typescript
// ✅ Correct auth setup
const asUser = t.withIdentity({ subject: userId });
const result = await asUser.mutation(api.posts.mutations.createPost, {
  eventId,
  title: 'Test Post',
  content: 'Test content',
});
```

## Common Test Mistakes

### ❌ Missing Required Fields

```typescript
// Wrong - missing required creatorId
await ctx.db.insert('events', {
  title: 'Test Event',
  location: 'Test Location',
  // Missing: creatorId, createdAt, updatedAt, timezone
});

// Wrong - userId as string instead of Id
await ctx.db.insert('persons', {
  userId: 'string-id', // Should be Id<"users">
});
```

### ❌ Non-existent Fields

```typescript
// Wrong - joinedAt doesn't exist on memberships
await ctx.db.insert('memberships', {
  personId,
  eventId,
  role: 'ATTENDEE',
  rsvpStatus: 'YES',
  joinedAt: Date.now(), // ❌ Field doesn't exist!
});
```

### ❌ Wrong API Pattern

```typescript
// Wrong - old direct db access pattern
const userId = await t.db.insert("users", { ... });

// Correct - use t.run() for setup
const { userId } = await t.run(async (ctx) => {
  const userId = await ctx.db.insert("users", { ... });
  return { userId };
});
```

## Index Reference

Key indexes for efficient queries:

- **users**: `by_email`, `by_username`
- **persons**: `by_user_id`
- **memberships**: `by_person`, `by_event`, `by_person_event`
- **posts**: `by_author`, `by_event`, `by_membership`
- **replies**: `by_author`, `by_post`
- **events**: `by_creator`
- **invites**: `by_event`, `by_creator`, `by_token`

Always use indexed fields in queries for optimal performance.
