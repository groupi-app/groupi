# Authentication Architecture Guide

Authentication boundaries, helpers, and source configuration for Groupi. Feature status below describes this branch, not a verified production deployment.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Type Safety Requirements](#type-safety-requirements)
- [Core Components](#core-components)
- [Server-Side Auth Functions](#server-side-auth-functions)
- [Client-Side Auth](#client-side-auth)
- [Data Model](#data-model)
- [Plugin Implementation Status](#plugin-implementation-status)
- [Common Patterns](#common-patterns)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Environment Variables](#environment-variables)
- [Checklist for Auth-Related Changes](#checklist-for-auth-related-changes)
- [Quick Reference](#quick-reference)

## Architecture Overview

Groupi uses the **Better Auth Convex Component** for authentication. This is a first-party integration that stores authentication records within Convex's component namespace.

### Key Documentation Links

| Resource                     | URL                                                       |
| ---------------------------- | --------------------------------------------------------- |
| Better Auth Convex Component | https://labs.convex.dev/better-auth                       |
| Framework Guide (Next.js)    | https://labs.convex.dev/better-auth/framework-guides/next |
| Component Client API         | https://labs.convex.dev/better-auth/api/component-client  |
| Convex Plugin                | https://labs.convex.dev/better-auth/api/convex-plugin     |
| Type Utilities               | https://labs.convex.dev/better-auth/api/type-utilities    |
| Better Auth Core Docs        | https://www.better-auth.com/docs                          |
| Convex Components            | https://docs.convex.dev/components                        |

### Architectural Principles

1. **Component Isolation**: Users are stored in the Better Auth component's namespace, separate from the app's schema
2. **Person Records**: Our app schema has `persons` table that references component users via `userId` string
3. **User Queries**: Use component client methods for authentication users; the app schema has no root `users` table
4. **Real-Time by Default**: Use Convex subscriptions, not manual state management

```text
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                         │
│  ┌─────────────────┐  ┌─────────────────────────────────────┐  │
│  │ Better Auth     │  │ Convex React Client                 │  │
│  │ React Client    │  │ (useQuery, useMutation)             │  │
│  │ (signIn, etc.)  │  │                                     │  │
│  └────────┬────────┘  └──────────────────┬──────────────────┘  │
└───────────┼──────────────────────────────┼──────────────────────┘
            │                              │
            ▼                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        CONVEX BACKEND                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Better Auth Component (Namespace: betterAuth)           │   │
│  │ - user table       - session table    - account table   │   │
│  │ - verification     - passkey          - apikey          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              │ authComponent.getAuthUser()      │
│                              │ authComponent.getAnyUserById()   │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ App Schema (Our Tables)                                  │   │
│  │ - persons (links to component user via userId string)    │   │
│  │ - personSettings    - events    - memberships            │   │
│  │ - posts            - replies    - notifications          │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Type Safety Requirements

### Infer types from the source

TypeScript should infer types from Convex's generated types. If you find yourself needing `any`:

1. **Check the source function** - Is it properly typed? Fix it there.
2. **Use Convex generated types** - Import from `_generated/dataModel` or `_generated/server`
3. **Use Better Auth type utilities** - See https://labs.convex.dev/better-auth/api/type-utilities

### Type Import Hierarchy

```typescript
// Correct: Import types from Convex generated files
import { Id } from '../_generated/dataModel';
import { QueryCtx, MutationCtx } from '../_generated/server';

// Correct: Let TypeScript infer from function returns
const person = await ctx.db.get(personId);
// TypeScript knows person is Doc<"persons"> | null

// Correct: Use the AuthUser type from auth.ts
import { AuthUser } from '../auth';

// Incorrect: Manual type definitions
interface User {
  _id: string;
  name: string;
}

// Incorrect: Using any
const user: any = await someFunction();
```

### When Inference Fails

If TypeScript cannot infer a type:

```typescript
// 1. First, check if the function being called is properly typed
//    If calling ctx.db.get(), it returns Doc<TableName> | null

// 2. If the function IS typed but complex, use Convex type utilities
import type { Doc } from '../_generated/dataModel';
const person: Doc<'persons'> | null = await ctx.db.get(personId);

// 3. For component types, use the exported AuthUser type
import { AuthUser } from '../auth';

// 4. For function return types, use ReturnType utility
type PersonResult = Awaited<ReturnType<typeof getCurrentPerson>>;
```

---

## Core Components

### File Structure

```text
convex/
├── auth.ts              # Auth utilities and helper functions
├── auth.config.ts       # Convex auth configuration
├── http.ts              # HTTP router with auth routes
├── convex.config.ts     # Component registration
└── schema.ts            # App schema (persons, events, etc.)

packages/web/
├── lib/
│   ├── auth-client.ts   # Browser-side auth client
│   └── auth-server.ts   # Server-side auth utilities
└── app/
    └── api/
        └── auth/
            └── [...all]/
                └── route.ts  # Next.js auth route handler
```

### Component Registration (`convex/convex.config.ts`)

```typescript
import { defineApp } from 'convex/server';
import presence from '@convex-dev/presence/convex.config.js';
import betterAuth from './betterAuth/convex.config';
import resend from '@convex-dev/resend/convex.config.js';

const app = defineApp();
app.use(presence);
app.use(betterAuth);
app.use(resend);

export default app;
```

### Auth Configuration (`convex/auth.config.ts`)

```typescript
import { getAuthConfigProvider } from '@convex-dev/better-auth/auth-config';
import type { AuthConfig } from 'convex/server';

export default {
  providers: [getAuthConfigProvider()],
} satisfies AuthConfig;
```

### HTTP Router (`convex/http.ts`)

```typescript
import { httpRouter } from 'convex/server';
import { authComponent, createAuth } from './auth';

const http = httpRouter();

// Register all Better Auth routes (/api/auth/*)
authComponent.registerRoutes(http, createAuth);

export default http;
```

---

## Server-Side Auth Functions

The component client in [`convex/auth.ts`](../convex/auth.ts) uses the local
Better Auth component, its schema, and lifecycle triggers. New users receive an
application `persons` record through `initializePersonForUser`. Preserve these
triggers when changing authentication.

| Helper                                   | Responsibility                                          |
| ---------------------------------------- | ------------------------------------------------------- |
| `getCurrentPerson(ctx)`                  | Current application person or `null`                    |
| `getCurrentUserAndPerson(ctx)`           | Current user/person pair or `null`                      |
| `requireAuth(ctx)`                       | Require a user/person pair                              |
| `requirePerson(ctx)`, `requireUser(ctx)` | Require one side of that pair                           |
| `requireAuthUser(ctx)`                   | Require auth before a person exists, such as onboarding |
| `isAdmin(ctx)`, `requireAdmin(ctx)`      | Check installation administrator authority              |
| `getEventMembership(ctx, eventId)`       | Current event membership, with exclusion checking       |
| `requireEventMembership(ctx, eventId)`   | Require that membership                                 |
| `hasEventRole(ctx, eventId, role)`       | Check the current person's event role                   |
| `requireEventRole(ctx, eventId, role)`   | Require a role and return user, person, and membership  |
| `getPersonWithUser(ctx, personId)`       | Resolve app profile plus auth data                      |
| `ensurePersonRecord(ctx, userId)`        | Ensure an app person and default settings exist         |

Import these helpers and infer their return types from source. Basic test
fallbacks can return a narrower user shape than component-backed production auth.
Use `AuthUser` and `AuthUserId` from `convex/auth.ts` when an explicit component
type is needed.

`authComponent.getAnyUserById` looks up component users; `ctx.db` cannot access
component tables. `authComponent.getAuth(createAuth, ctx)` supplies the Better Auth
API and request headers for supported account updates. These APIs are internal
building blocks, not authorization for a caller to inspect another account.

Authentication and authorization are separate. Enforce current resource access,
roles, exclusions, and grant limits in the owning domain operation, including
inside write transactions. Installation admin authority does not imply an event
Organizer role. See [bounded authorization](bounded-authorization.md).

## Client-Side Auth

### Auth Client Setup (`packages/web/lib/auth-client.ts`)

The [browser client](../packages/web/lib/auth-client.ts) configures Convex,
username, magic-link, email OTP, admin, API-key, passkey, and multiple-session
plugins. It conditionally adds Google One Tap when
`NEXT_PUBLIC_GOOGLE_CLIENT_ID` is configured. Import the existing client instead
of creating a second instance with different plugin settings.

### Server Utilities (`packages/web/lib/auth-server.ts`)

The [server adapter](../packages/web/lib/auth-server.ts) wraps
`convexBetterAuthNextJs`. It exports the auth handler, token/access helpers, and
authenticated query/mutation/action calls. It reads `NEXT_PUBLIC_CONVEX_URL` and
uses `NEXT_PUBLIC_CONVEX_SITE_URL` when supplied, otherwise deriving the HTTP
origin by replacing `.convex.cloud` with `.convex.site`.

### Route Handler (`packages/web/app/api/auth/[...all]/route.ts`)

The [Next.js route](../packages/web/app/api/auth/[...all]/route.ts) forwards GET
and POST to the adapter handler. Backend auth configuration and routes remain in
Convex. A proxy route does not move domain operations into Next.js.

### Using Auth in React Components

```typescript
'use client';

import { useSession, signIn, signOut } from "@/lib/auth-client";

function AuthButton() {
  const { data: session, isPending } = useSession();

  if (isPending) return <div>Loading...</div>;

  if (session?.user) {
    return (
      <div>
        <span>Welcome, {session.user.name}</span>
        <button onClick={() => signOut()}>Sign Out</button>
      </div>
    );
  }

  return (
    <button onClick={() => signIn.social({ provider: "google" })}>
      Sign In with Google
    </button>
  );
}
```

---

## Data Model

### Relationship Between Users and Persons

```text
Better Auth Component                    App Schema
┌─────────────────┐                     ┌─────────────────┐
│ user            │                     │ persons         │
│ - _id (Id)      │◄────────────────────│ - userId (str)  │
│ - email         │   stored as string  │ - bio           │
│ - name          │                     │ - pronouns      │
│ - image         │                     │ - lastSeen      │
│ - username      │                     └────────┬────────┘
│ - role          │                              │
└─────────────────┘                              │
                                                 │ personId
                                         ┌───────┴────────┐
                                         │ memberships    │
                                         │ posts          │
                                         │ notifications  │
                                         └────────────────┘
```

### Schema Definition (`convex/schema.ts`)

```typescript
// persons table - links to component users
persons: defineTable({
  userId: v.string(),  // Better Auth component user ID as string
  bio: v.optional(v.string()),
  pronouns: v.optional(v.string()),
  lastSeen: v.optional(v.number()),
}).index("by_user_id", ["userId"]),

// Application membership references persons, not component users
memberships: defineTable({
  personId: v.id("persons"),
  eventId: v.id("events"),
  role: v.union(v.literal("ORGANIZER"), v.literal("MODERATOR"), v.literal("ATTENDEE")),
  rsvpStatus: v.union(v.literal("YES"), v.literal("MAYBE"), v.literal("NO"), v.literal("PENDING")),
}),
```

### Why String for userId?

The `userId` in `persons` is stored as a `string`, not `v.id("user")` because:

1. The `user` table is in the component's namespace, not our app schema
2. `v.id()` only works for tables in our schema
3. We use `userId.toString()` when storing references

---

## Plugin Implementation Status

These are source capabilities, not evidence that an instance has configured its
providers or passed a live authentication test. Server configuration lives in
[`convex/auth.ts`](../convex/auth.ts); browser plugins live in
[`packages/web/lib/auth-client.ts`](../packages/web/lib/auth-client.ts).

| Capability               | Current source                                                                                                                                                             |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Google and Discord OAuth | Server providers, sign-in/sign-up buttons, and linked-account settings. Provider credentials are instance configuration.                                                   |
| Username                 | Server/client plugin, onboarding, username availability checking, and account settings.                                                                                    |
| Magic links              | Server/client plugin and sign-in UI. The server sends through Resend when configured; `DEBUG_MAGIC_LINKS=true` enables development logging. Without either, sending fails. |
| Email OTP                | Server/client plugin and native sign-in flow. Delivery requires configured email or the development/reviewer flow.                                                         |
| Email verification       | Verification route and email-management settings.                                                                                                                          |
| Passkeys                 | Server/client plugin and passkey settings. Origin, relying-party ID, and trusted native signing origins must match the instance.                                           |
| API keys                 | Server/client plugin and API-key settings for creation and management. Bounded grants and delegated access have separate authority rules.                                  |
| Admin                    | Server/client plugin, protected admin layout, user management, reports, and developer-app review pages.                                                                    |
| Multiple sessions        | Server/client plugin; the server permits at most five sessions.                                                                                                            |
| Google One Tap           | Conditionally configured with `GOOGLE_CLIENT_ID` on the server and `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in the browser. Actual rendering requires browser/provider verification. |
| Email/password           | Enabled on the server, but the web sign-in/sign-up pages have no password form.                                                                                            |
| Password reset           | No `sendResetPassword` callback or forgot/reset-password pages. Do not promise password recovery.                                                                          |
| TOTP two-factor          | Neither `twoFactor()` nor `twoFactorClient()` is configured. Passkeys do not imply a separate TOTP flow.                                                                   |

### Email and account security

Magic-link URLs and OTPs are credentials. Enable development logging only in an
isolated environment; never publish those logs. The private app-review inbox is
separately gated; see [app review access](app-review-access.md).

Account linking requires explicit intent. The server disables implicit linking
based only on a verified email. Linking a Discord sign-in identity is distinct
from enrollment in a Group's managed Discord access; see
[Discord Group setup](discord-group-setup.md).

Use the [account-resolution workflow](account-resolution.md) for deletion and
merging. The generic Better Auth admin removal endpoint is blocked so it cannot
bypass Groupi's ownership and cleanup rules.

API keys, bounded grants, and delegated sessions do not share the same authority.
See [bounded authorization](bounded-authorization.md) and
[delegated sign-in](delegated-sign-in.md) before adding credential flows.

### Changes and verification

For a new authentication flow, check both server and client plugin configuration,
loading and error states, authorization boundaries, and provider prerequisites.
Use existing components and inferred types. Run `pnpm check` and relevant tests;
record live browser/native checks separately. Unit tests do not establish email
delivery, OAuth provider configuration, or production rollout.

## Common Patterns

Use the existing domain operations as examples rather than copying a partial
mutation that only checks whether someone is signed in:

- [Post mutations](../convex/posts/mutations.ts) and
  [post writes](../convex/posts/writes.ts) combine authentication,
  permission checks, validation, attribution, notifications, and write results.
- [Event operations](../convex/events/writes.ts) preserve ownership, membership,
  and cleanup rules. Deleting only an event database row is not a complete event
  deletion operation.
- [User operations](../convex/users/) and
  [account resolution](account-resolution.md) define supported profile and
  account changes. Keep email/identity changes and account cleanup behind their
  intended flows.
- Queries that enrich membership with user data must check the requesting
  actor's access and project only permitted fields. An internal user lookup is
  not a public profile or email-disclosure contract.

Keep native function paths and versioned REST contracts stable when refactoring
shared operations. See [backend domain ownership](adr/0003-domain-owned-backend-operations.md).

## Testing

### Test Environment

Basic scenarios from `convex/tests/test_helpers.ts` leave the Better Auth
component unregistered and use the auth fallback. Tests that exercise component
credentials use `registerBetterAuth` and `createAuthAccount` from
`convex/tests/auth.helpers.ts`. The basic fallback works as follows:

```typescript
// In getAuthUserIdFallback():
// 1. Try Better Auth component (production)
// 2. If "not registered" error, fall back to ctx.auth.getUserIdentity()
// 3. If "Unauthenticated" error, return null
```

### Creating Test Users

```typescript
import { createTestInstance, TestScenarios } from './test_helpers';

const t = createTestInstance();
const { auth, eventId } = await TestScenarios.singleEvent(t);
const result = await auth.mutation(api.posts.mutations.createPost, {
  eventId,
  title: 'Test post',
  content: 'Content',
});
```

The scenario creates a person with a mock identity string, an event, and its
organizer membership. It does not create a real Better Auth account or session.

### Testing Admin Functions

```typescript
test('should allow admin access', async () => {
  const t = createTestInstance();

  const { userId } = await createTestUser(t, {
    email: 'admin@example.com',
    role: 'admin',
  });

  // Pass role in identity for test fallback
  const asAdmin = t.withIdentity({
    subject: userId,
    role: 'admin', // Important: role must be in identity
  } as any);

  // Now isAdmin() will return true
});
```

### Test boundaries

1. App `ctx.db` cannot query or patch component users. Use the registered
   component adapter for component-backed fixtures.
2. Identity fallback tests do not establish real OAuth or session behavior.
3. Mocked email tests do not prove delivery. Live email and provider flows need
   separate integration evidence.

---

## Troubleshooting

### Error: "Component 'betterAuth' is not registered"

**Cause**: Running in test environment without the component.

**Fix**: The auth functions handle this with fallback logic. If you're adding new auth code, follow the pattern:

```typescript
try {
  const user = await authComponent.getAuthUser(ctx);
  // ...
} catch (error) {
  const msg = error instanceof Error ? error.message : String(error);
  if (msg.includes('not registered')) {
    // Fallback for tests
    const identity = await ctx.auth.getUserIdentity();
    // ...
  }
  throw error;
}
```

### Error: "Cannot find module '@/convex/\_generated/api'"

**Cause**: Path alias not configured or Convex types not generated.

**Fix**:

1. Run `pnpm generate` to regenerate types, following the [script policy](../.agents/rules/scripts.md)
2. Check `tsconfig.json` has proper path mapping

### Error: "Unauthenticated"

**Cause**: User not logged in or session expired.

**Fix**: This is expected behavior. Check if auth is optional for your use case:

```typescript
// If auth is optional:
const person = await getCurrentPerson(ctx);
if (!person) {
  return null; // Or handle unauthenticated case
}

// If auth is required:
const { person } = await requireAuth(ctx); // Throws if not auth'd
```

### Error: "Property 'username' does not exist"

Check whether the value comes from the component or a test fallback. Use the
inferred local auth schema and exported `AuthUser` type rather than assuming
Better Auth's base user includes every plugin field. Do not spread an internal
auth record into a public response to work around a type error.

### TypeScript: "Type instantiation is excessively deep"

Check the generated contracts and local adapter types first. The web auth client
contains a localized lazy API lookup for this limitation. Keep any unavoidable
escape at that boundary and document it rather than adding `any` throughout
consumers.

## Environment Variables

Configure local frontend variables and backend deployment secrets separately;
see [Getting started](getting-started.md#configure-the-environment). The blocks
below list names, not a single shared environment file.

### Core configuration

```env
# Convex
CONVEX_DEPLOYMENT=dev:your-deployment-name
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
NEXT_PUBLIC_CONVEX_SITE_URL=https://your-deployment.convex.site

# Better Auth
SITE_URL=http://localhost:3000
BETTER_AUTH_SECRET=your-generated-secret
```

### Optional (for features)

```env
# OAuth Providers
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXT_PUBLIC_GOOGLE_CLIENT_ID=  # For One Tap on client

# Email (Magic Links)
RESEND_API_KEY=
RESEND_FROM_EMAIL=Groupi <noreply@yourdomain.example>
# DEBUG_MAGIC_LINKS=true  # Isolated development only; logs sign-in secrets
```

---

## Checklist for Auth-Related Changes

Before submitting auth-related code:

- [ ] No `any` types added (except documented exceptions)
- [ ] Used proper auth helper functions (`requireAuth`, `getCurrentPerson`, etc.)
- [ ] For mutations, called `requireAuth()` or appropriate permission check
- [ ] For queries needing auth, handled null case from `getCurrentPerson()`
- [ ] Used `authComponent.getAnyUserById()` for looking up other users
- [ ] Used `authComponent.getAuth(createAuth, ctx)` for Better Auth API calls
- [ ] Tests pass with `pnpm --filter @groupi/convex test:run`
- [ ] No direct queries to component tables ("users", "sessions", etc.)

---

## Quick Reference

### Import Checklist

```typescript
// Server-side auth
import {
  requireAuth,
  requirePerson,
  requireUser,
  getCurrentPerson,
  getCurrentUserAndPerson,
  isAdmin,
  requireAdmin,
  getEventMembership,
  requireEventMembership,
  hasEventRole,
  requireEventRole,
  getPersonWithUser,
  ensurePersonRecord,
  authComponent,
  createAuth,
  type AuthUser,
} from '../auth';

// Convex types
import { QueryCtx, MutationCtx } from '../_generated/server';
import { Id, Doc } from '../_generated/dataModel';

// Client-side auth
import {
  authClient,
  signIn,
  signUp,
  signOut,
  useSession,
} from '@/lib/auth-client';
```

### Function Quick Reference

| Need                          | Function                                                              |
| ----------------------------- | --------------------------------------------------------------------- |
| Get current person (optional) | `getCurrentPerson(ctx)`                                               |
| Require auth                  | `requireAuth(ctx)`                                                    |
| Check admin                   | `isAdmin(ctx)`                                                        |
| Check event role              | `hasEventRole(ctx, eventId, "ORGANIZER")`                             |
| Look up any user              | `authComponent.getAnyUserById(ctx, userId)`                           |
| Update user fields            | `authComponent.getAuth(createAuth, ctx)` then `auth.api.updateUser()` |
| Create person for user        | `ensurePersonRecord(ctx, userId)`                                     |
