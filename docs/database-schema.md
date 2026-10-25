# Database schema reference

The application schema is defined in [`convex/schema.ts`](../convex/schema.ts),
with reusable validators in domain contract modules. This guide covers common
relationships and test setup, rather than duplicating every field. Generated
[`Doc` and `Id` types](../convex/_generated/dataModel.d.ts) are the source for
TypeScript consumers.

## Table of Contents

- [Core Tables](#core-tables)
- [Test Data Patterns](#test-data-patterns)
- [Common Test Mistakes](#common-test-mistakes)
- [Index Reference](#index-reference)

## Core Tables

### Authentication users

Better Auth owns the `user`, `session`, and `account` tables in its component
namespace. The application schema has no `users` table. Use the component client
and the helpers in [`convex/auth.ts`](../convex/auth.ts) to read auth data;
`ctx.db` accesses application tables, not component users.

### `persons`

`userId` is a required string linking to a Better Auth component user. Optional
profile fields include `bio` and `pronouns`; the table also stores presence and
status preferences. It is not an `Id<'users'>` relationship in the application
schema.

### `events`

Required fields are `title`, `creatorId: Id<'persons'>`, `potentialDateTimes`,
`createdAt`, `updatedAt`, and `timezone`. Dates and timestamps are numeric Unix
milliseconds, not ISO date strings.

- `chosenDateTime` and `chosenEndDateTime` are optional numeric timestamps. An end
  time requires a start time and must be later than it.
- The required `potentialDateTimes: number[]` field is legacy. The
  `potentialDateTimes` table stores proposed date ranges with an `eventId`,
  `dateTime`, and optional `endDateTime` and note.
- `creatorId` identifies the current responsible Organizer. Optional `createdById`
  preserves creation provenance after ownership changes.
- Visibility, admission policy, application settings, and event permissions are
  distinct settings. Visibility alone does not create membership.

### `memberships`

Each membership links a required `personId` to a required `eventId` and stores:

- `role`: `ORGANIZER`, `MODERATOR`, or `ATTENDEE`.
- `rsvpStatus`: `YES`, `MAYBE`, `NO`, or `PENDING`.
- Optional `rsvpNote`, `updatedAt`, and `participationRevision`.

There is no `joinedAt` field. Event membership and RSVP are independent of
membership in a formal Group.

### `posts`

`title` and `content` are required strings. `eventId` is required; `membershipId`,
`editedAt`, and `updatedAt` are optional. The required `authorId` is either
`Id<'persons'>` or `Id<'authorizationPrincipals'>`, allowing authorized
Integrations to author discussion posts without person records.

### `replies`

`postId`, `text`, and `authorId` are required. The author uses the same person or
Integration union as posts. `membershipId` and `updatedAt` are optional.

### Groups and other domains

The schema also includes formal Group membership, admission and onboarding,
persistent Group tools, Discord access, invitations, bounded authorization,
delegated apps, notifications, attachments, and operation receipts. Refer to
the relevant domain contracts and [glossary](../GLOSSARY.md) for their semantics.
Do not substitute Group membership for event membership or infer an RSVP from
admission or audience eligibility.

## Test Data Patterns

Use [`convex/tests/test_helpers.ts`](../convex/tests/test_helpers.ts) for common
fixtures. It creates application person records with mock auth user ID strings;
it does not insert component users into the root schema.

```typescript
import { api } from '../_generated/api';
import { createTestInstance, TestScenarios } from './test_helpers';

const t = createTestInstance();
const { auth, eventId } = await TestScenarios.singleEvent(t);
const result = await auth.mutation(api.posts.mutations.createPost, {
  eventId,
  title: 'Test post',
  content: 'Test content',
});
// createPost returns { postId, post }.
```

For a minimal unauthenticated database fixture, perform setup inside `t.run()`:

```typescript
const { userId, personId, eventId, membershipId } = await t.run(async ctx => {
  const userId = 'test-user';
  const personId = await ctx.db.insert('persons', { userId });
  const now = Date.now();
  const eventId = await ctx.db.insert('events', {
    title: 'Test event',
    creatorId: personId,
    potentialDateTimes: [],
    createdAt: now,
    updatedAt: now,
    timezone: 'UTC',
    memberCount: 1,
  });
  const membershipId = await ctx.db.insert('memberships', {
    personId,
    eventId,
    role: 'ORGANIZER',
    rsvpStatus: 'YES',
  });
  return { userId, personId, eventId, membershipId };
});
const asUser = t.withIdentity({ subject: userId });
```

Use the existing helpers or dedicated component integration tests when a test
needs auth-provider data or domain side effects. Direct fixture insertion does
not exercise those operations. See the [testing guide](./testing.md).

## Common Test Mistakes

- Inserting a root `users` row or casting `persons.userId` to `Id<'users'>`.
  Better Auth users belong to the component; application references are strings.
- Passing ISO strings for numeric event dates or omitting required event fields.
- Adding nonexistent fields such as `memberships.joinedAt`.
- Accessing `t.db` directly instead of using `t.run(ctx => ...)`.
- Treating a fixture insert as evidence that an authenticated domain operation
  enforces permissions or performs cleanup correctly.

## Index Reference

Selected indexes from the application schema:

| Table                | Indexes                                                     |
| -------------------- | ----------------------------------------------------------- |
| `persons`            | `by_user_id`                                                |
| `events`             | `by_creator`, `by_creator_visibility`                       |
| `memberships`        | `by_person`, `by_event`, `by_event_role`, `by_person_event` |
| `potentialDateTimes` | `by_event`                                                  |
| `availabilities`     | `by_membership`, `by_potential_date`, `by_membership_date`  |
| `posts`              | `by_author`, `by_event`, `by_membership`                    |
| `replies`            | `by_author`, `by_post`, `by_membership`                     |
| `invites`            | `by_event`, `by_creator`, `by_token`                        |

Check the schema for each index's exact fields. For example, `invites.by_creator`
indexes `createdById`, an invitation creator's membership ID. Choose indexes that
match the query; an index does not replace access checks.
