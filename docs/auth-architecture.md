# Authentication Architecture Guide

> **For AI Agents**: This document provides everything you need to work autonomously with Groupi's authentication system. Read it thoroughly before making any auth-related changes.

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

## Architecture Overview

Groupi uses the **Better Auth Convex Component** for authentication. This is a first-party integration that stores all user data within Convex's component namespace.

### Key Documentation Links

| Resource | URL |
|----------|-----|
| Better Auth Convex Component | https://labs.convex.dev/better-auth |
| Framework Guide (Next.js) | https://labs.convex.dev/better-auth/framework-guides/next |
| Component Client API | https://labs.convex.dev/better-auth/api/component-client |
| Convex Plugin | https://labs.convex.dev/better-auth/api/convex-plugin |
| Type Utilities | https://labs.convex.dev/better-auth/api/type-utilities |
| Better Auth Core Docs | https://www.better-auth.com/docs |
| Convex Components | https://docs.convex.dev/components |

### Architectural Principles

1. **Component Isolation**: Users are stored in the Better Auth component's namespace, NOT in the app's schema
2. **Person Records**: Our app schema has `persons` table that references component users via `userId` string
3. **No Direct User Queries**: Never query a "users" table - use component client methods
4. **Real-Time by Default**: Use Convex subscriptions, not manual state management

```
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
│  │ - verification     - twoFactor        - apiKey          │   │
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

### CRITICAL: No `any` Types Allowed

TypeScript should infer types from Convex's generated types. If you find yourself needing `any`:

1. **Check the source function** - Is it properly typed? Fix it there.
2. **Use Convex generated types** - Import from `_generated/dataModel` or `_generated/server`
3. **Use Better Auth type utilities** - See https://labs.convex.dev/better-auth/api/type-utilities

### Type Import Hierarchy

```typescript
// ✅ CORRECT: Import types from Convex generated files
import { Id } from "../_generated/dataModel";
import { QueryCtx, MutationCtx } from "../_generated/server";

// ✅ CORRECT: Let TypeScript infer from function returns
const person = await ctx.db.get(personId);
// TypeScript knows person is Doc<"persons"> | null

// ✅ CORRECT: Use the AuthUser type from auth.ts
import { AuthUser } from "../auth";

// ❌ WRONG: Manual type definitions
interface User {
  _id: string;
  name: string;
}

// ❌ WRONG: Using any
const user: any = await someFunction();
```

### Existing `any` Types That Need Fixing

The current codebase has some `any` types that should be addressed:

1. **`auth.ts:129`** - `getAuthUserIdFallback` returns `{ userId: string; user: any }`
   - **Why**: The test fallback creates a mock user object
   - **Fix needed**: Create a proper `MockUser` type for test scenarios

2. **`auth.ts:14`** - `oneTap` plugin conditional import
   - **Why**: Dynamic require for optional plugin
   - **Acceptable**: This is a build-time conditional and isolated

### When Inference Fails

If TypeScript cannot infer a type:

```typescript
// 1. First, check if the function being called is properly typed
//    If calling ctx.db.get(), it returns Doc<TableName> | null

// 2. If the function IS typed but complex, use Convex type utilities
import type { Doc } from "../_generated/dataModel";
const person: Doc<"persons"> | null = await ctx.db.get(personId);

// 3. For component types, use the exported AuthUser type
import { AuthUser } from "../auth";

// 4. For function return types, use ReturnType utility
type PersonResult = Awaited<ReturnType<typeof getCurrentPerson>>;
```

---

## Core Components

### File Structure

```
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
import { defineApp } from "convex/server";
import presence from "@convex-dev/presence/convex.config.js";
import betterAuth from "@convex-dev/better-auth/convex.config";
import resend from "@convex-dev/resend/convex.config.js";

const app = defineApp();
app.use(presence);
app.use(betterAuth);
app.use(resend);

export default app;
```

### Auth Configuration (`convex/auth.config.ts`)

```typescript
import { getAuthConfigProvider } from "@convex-dev/better-auth/auth-config";
import type { AuthConfig } from "convex/server";

export default {
  providers: [getAuthConfigProvider()],
} satisfies AuthConfig;
```

### HTTP Router (`convex/http.ts`)

```typescript
import { httpRouter } from "convex/server";
import { authComponent, createAuth } from "./auth";

const http = httpRouter();

// Register all Better Auth routes (/api/auth/*)
authComponent.registerRoutes(http, createAuth);

export default http;
```

---

## Server-Side Auth Functions

### Component Client (`authComponent`)

The component client is created from the registered component:

```typescript
import { createClient } from "@convex-dev/better-auth";
import { components } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";

export const authComponent = createClient<DataModel>(components.betterAuth);
```

### Component Client Methods

| Method | Purpose | Returns |
|--------|---------|---------|
| `authComponent.getAuthUser(ctx)` | Get current authenticated user | `User \| null` (throws if unauthenticated) |
| `authComponent.getAnyUserById(ctx, userId)` | Look up any user by ID | `User \| null` |
| `authComponent.adapter(ctx)` | Get database adapter for Better Auth | `DatabaseAdapter` |
| `authComponent.registerRoutes(http, createAuth)` | Register HTTP routes | `void` |
| `authComponent.getAuth(createAuth, ctx)` | Get auth instance with headers | `{ auth, headers }` |

### Helper Functions in `auth.ts`

#### Authentication Checks

```typescript
// Get current authenticated person (returns null if not auth'd)
export async function getCurrentPerson(ctx: AuthCtx): Promise<Doc<"persons"> | null>

// Get both user and person (returns null if not auth'd)
export async function getCurrentUserAndPerson(ctx: AuthCtx): Promise<{
  user: AuthUser;
  person: Doc<"persons">;
} | null>

// Require authentication (throws ConvexError if not auth'd)
export async function requireAuth(ctx: AuthCtx): Promise<{
  user: AuthUser;
  person: Doc<"persons">;
}>

// Require and return only person
export async function requirePerson(ctx: AuthCtx): Promise<Doc<"persons">>

// Require and return only user
export async function requireUser(ctx: AuthCtx): Promise<AuthUser>
```

#### Admin Checks

```typescript
// Check if current user is admin
export async function isAdmin(ctx: AuthCtx): Promise<boolean>

// Require admin privileges (throws if not admin)
export async function requireAdmin(ctx: AuthCtx): Promise<AuthUser>
```

#### Event Permission Checks

```typescript
// Get membership for event (null if not member)
export async function getEventMembership(
  ctx: AuthCtx,
  eventId: string
): Promise<Doc<"memberships"> | null>

// Require event membership (throws if not member)
export async function requireEventMembership(
  ctx: AuthCtx,
  eventId: string
): Promise<Doc<"memberships">>

// Check if user has specific role
export async function hasEventRole(
  ctx: AuthCtx,
  eventId: string,
  role: "ORGANIZER" | "MODERATOR" | "ATTENDEE"
): Promise<boolean>

// Require specific role (throws if insufficient)
export async function requireEventRole(
  ctx: AuthCtx,
  eventId: string,
  role: "ORGANIZER" | "MODERATOR" | "ATTENDEE"
): Promise<Doc<"memberships">>
```

#### User Lookup

```typescript
// Get person with associated user data
export async function getPersonWithUser(
  ctx: AuthCtx,
  personId: string | { toString(): string }
): Promise<{
  person: Doc<"persons">;
  user: { _id: string; name: string | null; email: string | null; /* ... */ };
} | null>

// Ensure person record exists for user
export async function ensurePersonRecord(
  ctx: MutationCtx,
  userId: string
): Promise<Doc<"persons"> | null>
```

### Using Auth in Mutations

```typescript
import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { requireAuth, authComponent, createAuth } from "../auth";

export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    bio: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Require authentication
    const { person, user } = await requireAuth(ctx);

    // Update person record (app schema)
    if (args.bio !== undefined) {
      await ctx.db.patch(person._id, { bio: args.bio });
    }

    // Update user record (component) via Better Auth API
    if (args.name !== undefined) {
      const { auth, headers } = await authComponent.getAuth(createAuth, ctx);
      await auth.api.updateUser({
        body: { name: args.name },
        headers,
      });
    }

    return { success: true };
  },
});
```

### Using Auth in Queries

```typescript
import { query } from "../_generated/server";
import { getCurrentPerson, authComponent } from "../auth";

export const getMyProfile = query({
  args: {},
  handler: async (ctx) => {
    const person = await getCurrentPerson(ctx);
    if (!person) return null;

    // Look up user data from component
    const user = await authComponent.getAnyUserById(ctx, person.userId as any);

    return {
      person,
      user: user ? {
        name: user.name,
        email: user.email,
        image: user.image,
        username: (user as any).username,
      } : null,
    };
  },
});
```

---

## Client-Side Auth

### Auth Client Setup (`packages/web/lib/auth-client.ts`)

```typescript
'use client';

import { createAuthClient } from "better-auth/react";
import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { usernameClient, magicLinkClient, twoFactorClient, oneTapClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [
    convexClient(),
    usernameClient(),
    magicLinkClient(),
    twoFactorClient(),
    // Conditionally add Google One Tap
    ...(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
      ? [oneTapClient({ clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID })]
      : []),
  ],
});

export const { signIn, signUp, signOut, useSession } = authClient;
```

### Server Utilities (`packages/web/lib/auth-server.ts`)

```typescript
import { convexBetterAuthNextJs } from "@convex-dev/better-auth/nextjs";

export const {
  handler,           // Next.js route handler
  preloadAuthQuery,  // Preload queries with auth
  isAuthenticated,   // Check if user is authenticated
  getToken,          // Get auth token
  fetchAuthQuery,    // Fetch query with auth
  fetchAuthMutation, // Execute mutation with auth
  fetchAuthAction,   // Execute action with auth
} = convexBetterAuthNextJs({
  convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL!,
  convexSiteUrl: process.env.NEXT_PUBLIC_CONVEX_SITE_URL!,
});
```

### Route Handler (`packages/web/app/api/auth/[...all]/route.ts`)

```typescript
import { handler } from "@/lib/auth-server";

export const { GET, POST } = handler;
```

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

```
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

// All other tables reference persons, NOT users
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

### Summary Table

| Plugin | Backend | Client | UI | Status |
|--------|---------|--------|-----|--------|
| OAuth (Google/Discord) | ✅ | ✅ | ✅ | **Fully Implemented** |
| Username | ✅ | ✅ | ✅ | **Fully Implemented** |
| Magic Link | ⚠️ | ✅ | ✅ | UI done, backend needs real email |
| Email Verification | ✅ | ✅ | ✅ | **Fully Implemented** |
| Email/Password | ✅ | ✅ | ❌ | Backend only, no UI |
| Two-Factor (2FA) | ✅ | ✅ | ❌ | Backend only, no UI |
| API Key | ✅ | ❌ | ❌ | Backend only, no UI |
| Admin | ✅ | ❌ | ⚠️ | Stub page during migration |
| Google One Tap | ⚠️ | ⚠️ | ⚠️ | Conditional, auto-rendering |
| Password Reset | ❌ | ❌ | ❌ | **Not Implemented** |

---

### Fully Implemented Plugins (with UI)

#### OAuth (Google, Discord)

**Status**: ✅ Complete implementation with full UI

**Files:**
- Sign In: `packages/web/app/(auth)/sign-in/[[...sign-in]]/page.tsx`
- Sign Up: `packages/web/app/(auth)/sign-up/[[...sign-up]]/page.tsx`
- Account Linking: `packages/web/app/(settings)/settings/components/linked-accounts-list.tsx`

**Features:**
- Discord and Google OAuth buttons on sign-in/sign-up
- Link/unlink social accounts in settings
- Display all linked OAuth accounts with provider names

**Usage:**
```typescript
import { signIn } from "@/lib/auth-client";

// Sign in with Google
signIn.social({ provider: "google" });

// Sign in with Discord
signIn.social({ provider: "discord" });

// Link account (in settings)
authClient.linkSocial({ provider: "google" });
```

See: https://www.better-auth.com/docs/authentication/social-sign-in

---

#### Username Plugin

**Status**: ✅ Complete implementation with full UI

**Files:**
- Onboarding: `packages/web/app/(auth)/onboarding/onboarding-content.tsx`
- Sign In: `packages/web/app/(auth)/sign-in/[[...sign-in]]/page.tsx`
- Settings: `packages/web/app/(settings)/settings/components/username-field.tsx`

**Features:**
- Username field on onboarding with real-time availability checking
- Username or email accepted for magic link sign-in
- Edit username in account settings with validation
- Debounced availability check (500ms)
- Visual indicators: spinner, check mark, X icon

**Usage:**
```typescript
import { usernameClient } from "better-auth/client/plugins";

// Client setup includes username plugin
const authClient = createAuthClient({
  plugins: [usernameClient()],
});

// Username is automatically available on session.user
const { data: session } = useSession();
console.log(session?.user?.username);
```

See: https://www.better-auth.com/docs/plugins/username

---

#### Magic Link Plugin

**Status**: ⚠️ UI complete, backend needs real email sending

**Files:**
- Sign In: `packages/web/app/(auth)/sign-in/[[...sign-in]]/page.tsx`

**Features:**
- Email or username input for magic link
- "Send Magic Link" button
- Success message after sending
- Resend with 10-second cooldown timer
- Auto-clears countdown display

**Current Backend (needs improvement):**
```typescript
// convex/auth.ts - currently only logs in development
magicLink({
  sendMagicLink: async ({ email: _email, url }) => {
    if (process.env.DEBUG_MAGIC_LINKS === "true") {
      console.log(`🔗 MAGIC LINK - URL: ${url}`);
    }
  },
}),
```

**To implement real email sending:**
```typescript
import { Resend } from "resend";

magicLink({
  sendMagicLink: async ({ email, url }) => {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "auth@yourdomain.com",
      to: email,
      subject: "Sign in to Groupi",
      html: `<a href="${url}">Click here to sign in</a>`,
    });
  },
}),
```

See: https://www.better-auth.com/docs/plugins/magic-link

---

#### Email Verification Plugin

**Status**: ✅ Complete implementation with full UI

**Files:**
- Verification Page: `packages/web/app/verify-email/page.tsx`
- Email Management: `packages/web/app/(settings)/settings/components/email-management.tsx`

**Features:**
- Handles verification token from URL
- Auto-verifies on page load if token valid
- Shows status messages for valid/invalid/expired tokens
- Add new email addresses with verification flow
- Display all emails with verification status
- Resend verification email button
- Set primary email functionality
- Remove secondary emails
- Expiration time display for pending verifications

**Usage:**
```typescript
import { authClient } from "@/lib/auth-client";

// Send verification email
await authClient.sendVerificationEmail({ email });

// Verify email with token
await authClient.verifyEmail({ token });
```

See: https://www.better-auth.com/docs/plugins/email-verification

---

### Backend-Only Plugins (need UI implementation)

#### Email/Password Plugin

**Status**: ❌ Backend enabled, NO UI

The `emailAndPassword` option is enabled in `convex/auth.ts` but there is no sign-in/sign-up form with email and password fields. The app currently relies on OAuth and Magic Link only.

```typescript
// convex/auth.ts
emailAndPassword: {
  enabled: true,
  requireEmailVerification: false,
},
```

**To implement UI:**
1. Add email + password form to sign-in page
2. Add email + password + password confirm to sign-up page
3. Use `signIn.email()` and `signUp.email()` methods

```typescript
import { signIn, signUp } from "@/lib/auth-client";

// Sign in with email/password
await signIn.email({ email, password });

// Sign up with email/password
await signUp.email({ email, password, name });
```

See: https://www.better-auth.com/docs/authentication/email-password

---

#### Two-Factor Authentication (2FA) Plugin

**Status**: ❌ Backend configured, NO UI

```typescript
// Server (convex/auth.ts) - CONFIGURED
twoFactor(),

// Client (auth-client.ts) - CONFIGURED
twoFactorClient(),
```

**Missing UI components:**
- Enable 2FA flow with QR code
- TOTP code entry during sign-in
- Backup/recovery codes display and management
- Disable 2FA option in settings

**To implement:**

1. **Enable 2FA Settings Page:**
```typescript
import { authClient } from "@/lib/auth-client";

// Generate TOTP setup
const { data } = await authClient.twoFactor.getTotpUri();
// Display QR code from data.totpUri

// Verify and enable
await authClient.twoFactor.enable({ code: userEnteredCode });
```

2. **Sign-in with 2FA:**
```typescript
// After primary auth, if 2FA required
await authClient.twoFactor.verify({ code: totpCode });
```

3. **Backup Codes:**
```typescript
// Generate backup codes
const { data } = await authClient.twoFactor.generateBackupCodes();
// Display codes to user
```

See: https://www.better-auth.com/docs/plugins/two-factor

---

#### API Key Plugin

**Status**: ❌ Backend configured, NO UI

```typescript
// Server (convex/auth.ts) - CONFIGURED
apiKey(),
```

**Missing:**
- API key generation UI
- Key management panel (list, revoke)
- Copy key functionality

**To implement:**
```typescript
import { authClient } from "@/lib/auth-client";

// Create API key
const { data } = await authClient.apiKey.create({
  name: "My API Key",
  expiresIn: 60 * 60 * 24 * 30, // 30 days
});

// List keys
const { data: keys } = await authClient.apiKey.list();

// Revoke key
await authClient.apiKey.revoke({ keyId });
```

See: https://www.better-auth.com/docs/plugins/api-key

---

### Partially Implemented Plugins

#### Admin Plugin

**Status**: ⚠️ Backend configured, UI is placeholder during migration

```typescript
// Server (convex/auth.ts) - CONFIGURED
admin(),
```

**Current UI:**
- Location: `packages/web/app/(admin)/admin/page.tsx`
- Content: Placeholder message stating "Admin functionality is temporarily unavailable during the Convex migration"

**Missing:**
- User list with management options
- Role assignment (promote to admin)
- User suspension/ban functionality
- Admin dashboard

**To implement:**
```typescript
import { authClient } from "@/lib/auth-client";

// List users (admin only)
const { data } = await authClient.admin.listUsers();

// Set user role
await authClient.admin.setRole({ userId, role: "admin" });

// Ban user
await authClient.admin.banUser({ userId });
```

See: https://www.better-auth.com/docs/plugins/admin

---

#### Google One Tap Plugin

**Status**: ⚠️ Conditionally loaded, likely auto-rendering

```typescript
// Server - conditionally imported
if (process.env.GOOGLE_CLIENT_ID) {
  oneTap = require("better-auth/plugins/one-tap").oneTap;
}

// Client - conditionally added
...(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  ? [oneTapClient({ clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID })]
  : []),
```

**Required setup:**
1. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` env vars
2. Set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` for client
3. Configure Google Cloud Console OAuth consent screen

**Notes:**
- Google One Tap may render automatically if properly configured
- No explicit component needed - the plugin handles rendering
- Check if it's actually appearing in production

See: https://www.better-auth.com/docs/plugins/one-tap

---

### Not Implemented Plugins

#### Password Reset

**Status**: ❌ NOT IMPLEMENTED (neither backend nor UI)

This is a critical missing feature. Users cannot reset their password if they forget it.

**To implement:**

1. **Add forgot password flow to backend:**
```typescript
// convex/auth.ts - already have emailAndPassword enabled
// Need to implement sendResetPassword callback:
emailAndPassword: {
  enabled: true,
  sendResetPassword: async ({ email, url }) => {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "auth@yourdomain.com",
      to: email,
      subject: "Reset your Groupi password",
      html: `<a href="${url}">Click here to reset your password</a>`,
    });
  },
},
```

2. **Create forgot password UI:**
   - Add "Forgot password?" link on sign-in page
   - Create `/forgot-password` page with email input
   - Create `/reset-password` page to handle reset token

3. **Usage:**
```typescript
import { authClient } from "@/lib/auth-client";

// Request password reset
await authClient.forgetPassword({ email });

// Reset password (on reset page with token)
await authClient.resetPassword({ token, newPassword });
```

See: https://www.better-auth.com/docs/authentication/email-password#password-reset

---

### Plugins Not Yet Added

| Plugin | Docs | Description |
|--------|------|-------------|
| `organization` | https://www.better-auth.com/docs/plugins/organization | Multi-tenant organizations |
| `passkey` | https://www.better-auth.com/docs/plugins/passkey | WebAuthn/FIDO2 passwordless |
| `bearer` | https://www.better-auth.com/docs/plugins/bearer | Bearer token auth for APIs |
| `openAPI` | https://www.better-auth.com/docs/plugins/open-api | OpenAPI spec generation |

---

## Implementation Plan for Missing Features

This section provides a prioritized implementation plan for completing all auth plugin functionality.

### Priority Order

| Priority | Feature | Complexity | Reason |
|----------|---------|------------|--------|
| **P0** | Password Reset | Medium | Critical security feature - users locked out without it |
| **P0** | Magic Link Email Sending | Low | Required for current sign-in flow to work in production |
| **P1** | Two-Factor Authentication UI | High | Security feature, enhances account protection |
| **P1** | Email/Password Sign-In UI | Medium | Alternative auth method for users who prefer passwords |
| **P2** | Admin Dashboard | High | User management, moderation tools |
| **P2** | API Key Management UI | Medium | Developer features for integrations |
| **P3** | Google One Tap Verification | Low | Verify it works, may already be functional |

---

### P0: Password Reset Implementation

**Complexity**: Medium | **Effort**: 1-2 days

Password reset is critical - users cannot recover accounts without it.

#### Step 1: Backend Configuration

**File**: `convex/auth.ts`

```typescript
// Update emailAndPassword configuration
emailAndPassword: {
  enabled: true,
  requireEmailVerification: false,
  sendResetPassword: async ({ email, url }) => {
    // Use Resend component or direct API
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "noreply@groupi.app",
      to: email,
      subject: "Reset your Groupi password",
      html: `
        <h1>Reset Your Password</h1>
        <p>Click the link below to reset your password. This link expires in 1 hour.</p>
        <a href="${url}" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 6px;">
          Reset Password
        </a>
        <p>If you didn't request this, you can safely ignore this email.</p>
      `,
    });
  },
},
```

#### Step 2: Create Forgot Password Page

**File**: `packages/web/app/(auth)/forgot-password/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await authClient.forgetPassword({ email });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <Card className="w-full max-w-md mx-auto mt-20">
        <CardHeader>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            If an account exists for {email}, we've sent a password reset link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/sign-in">
            <Button variant="outline" className="w-full">Back to Sign In</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-20">
      <CardHeader>
        <CardTitle>Forgot Password</CardTitle>
        <CardDescription>Enter your email to receive a reset link</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </Button>
          <Link href="/sign-in" className="block text-center text-sm text-muted-foreground hover:underline">
            Back to Sign In
          </Link>
        </form>
      </CardContent>
    </Card>
  );
}
```

#### Step 3: Create Reset Password Page

**File**: `packages/web/app/(auth)/reset-password/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!token) {
    return (
      <Card className="w-full max-w-md mx-auto mt-20">
        <CardHeader>
          <CardTitle>Invalid Reset Link</CardTitle>
          <CardDescription>This password reset link is invalid or has expired.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await authClient.resetPassword({ token, newPassword: password });
      router.push('/sign-in?message=Password reset successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto mt-20">
      <CardHeader>
        <CardTitle>Reset Password</CardTitle>
        <CardDescription>Enter your new password</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
          <Input
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

#### Step 4: Add Link to Sign-In Page

**File**: `packages/web/app/(auth)/sign-in/[[...sign-in]]/page.tsx`

Add below the magic link form:
```typescript
<Link href="/forgot-password" className="text-sm text-muted-foreground hover:underline">
  Forgot your password?
</Link>
```

---

### P0: Magic Link Email Sending

**Complexity**: Low | **Effort**: 0.5 days

Currently magic links only log to console. Need real email sending.

#### Step 1: Update Backend

**File**: `convex/auth.ts`

```typescript
import { Resend } from "resend";

// In createAuth function:
magicLink({
  sendMagicLink: async ({ email, url }) => {
    // Always send real emails (not just in production)
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: "noreply@groupi.app",
      to: email,
      subject: "Sign in to Groupi",
      html: `
        <h1>Sign in to Groupi</h1>
        <p>Click the link below to sign in. This link expires in 10 minutes.</p>
        <a href="${url}" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 6px;">
          Sign In
        </a>
        <p>If you didn't request this, you can safely ignore this email.</p>
      `,
    });

    // Optionally still log in development
    if (process.env.DEBUG_MAGIC_LINKS === "true") {
      console.log(`🔗 MAGIC LINK sent to ${email}: ${url}`);
    }
  },
}),
```

#### Step 2: Environment Setup

Ensure these are set in production:
```bash
RESEND_API_KEY=re_xxxxx
```

---

### P1: Two-Factor Authentication UI

**Complexity**: High | **Effort**: 2-3 days

Requires QR code display, code verification, backup codes management.

#### Step 1: Install QR Code Library

```bash
pnpm add qrcode.react
```

#### Step 2: Create 2FA Settings Component

**File**: `packages/web/app/(settings)/settings/components/two-factor-settings.tsx`

```typescript
'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useSession } from '@/lib/auth-client';

export function TwoFactorSettings() {
  const { data: session } = useSession();
  const [isEnabling, setIsEnabling] = useState(false);
  const [totpUri, setTotpUri] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  const is2FAEnabled = session?.user?.twoFactorEnabled;

  const startEnabling = async () => {
    setIsEnabling(true);
    setError(null);

    try {
      const { data } = await authClient.twoFactor.getTotpUri();
      if (data?.totpUri) {
        setTotpUri(data.totpUri);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start 2FA setup');
      setIsEnabling(false);
    }
  };

  const verifyAndEnable = async () => {
    setError(null);

    try {
      await authClient.twoFactor.enable({ code: verificationCode });

      // Generate backup codes
      const { data } = await authClient.twoFactor.generateBackupCodes();
      if (data?.backupCodes) {
        setBackupCodes(data.backupCodes);
        setShowBackupCodes(true);
      }

      setTotpUri(null);
      setIsEnabling(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid verification code');
    }
  };

  const disable2FA = async () => {
    try {
      await authClient.twoFactor.disable();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disable 2FA');
    }
  };

  if (is2FAEnabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>2FA is enabled on your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full" />
            <span>Two-factor authentication is active</span>
          </div>
          <Button variant="destructive" onClick={disable2FA}>
            Disable 2FA
          </Button>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>Add an extra layer of security to your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isEnabling ? (
            <Button onClick={startEnabling}>Enable 2FA</Button>
          ) : totpUri ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
              </p>
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <QRCodeSVG value={totpUri} size={200} />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Enter the 6-digit code from your app:</p>
                <Input
                  type="text"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="text-center text-2xl tracking-widest"
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="flex gap-2">
                <Button onClick={verifyAndEnable} disabled={verificationCode.length !== 6}>
                  Verify & Enable
                </Button>
                <Button variant="outline" onClick={() => { setIsEnabling(false); setTotpUri(null); }}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p>Loading...</p>
          )}
        </CardContent>
      </Card>

      {/* Backup Codes Dialog */}
      <Dialog open={showBackupCodes} onOpenChange={setShowBackupCodes}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Your Backup Codes</DialogTitle>
            <DialogDescription>
              Store these codes somewhere safe. You can use each code once to sign in if you lose access to your authenticator.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg font-mono text-sm">
            {backupCodes.map((code, i) => (
              <div key={i}>{code}</div>
            ))}
          </div>
          <Button onClick={() => setShowBackupCodes(false)}>I've saved these codes</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

#### Step 3: Create 2FA Verification During Sign-In

When a user with 2FA signs in, they need to enter their TOTP code. This requires handling the 2FA challenge in the sign-in flow.

**File**: Update `packages/web/app/(auth)/sign-in/[[...sign-in]]/page.tsx` to handle 2FA:

```typescript
// After successful primary auth, check if 2FA is required
const handleSignIn = async () => {
  try {
    const result = await signIn.email({ email, password });

    if (result.error?.code === 'TWO_FACTOR_REQUIRED') {
      // Show 2FA input
      setShow2FAInput(true);
      return;
    }

    // Normal success - redirect
    router.push('/events');
  } catch (err) {
    // Handle error
  }
};

const handle2FAVerify = async () => {
  try {
    await authClient.twoFactor.verify({ code: totpCode });
    router.push('/events');
  } catch (err) {
    setError('Invalid 2FA code');
  }
};
```

#### Step 4: Add to Settings Page

**File**: `packages/web/app/(settings)/settings/account/page.tsx`

```typescript
import { TwoFactorSettings } from '../components/two-factor-settings';

// Add to the settings page:
<TwoFactorSettings />
```

---

### P1: Email/Password Sign-In UI

**Complexity**: Medium | **Effort**: 1-2 days

Add traditional email/password forms alongside existing OAuth/Magic Link.

#### Step 1: Update Sign-In Page

**File**: `packages/web/app/(auth)/sign-in/[[...sign-in]]/page.tsx`

Add a tabbed interface or accordion to show both magic link and password options:

```typescript
'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { signIn } from '@/lib/auth-client';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await signIn.email({ email, password });
      // Redirect handled by Better Auth
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Social buttons */}
        <div className="space-y-2 mb-6">
          <Button onClick={() => signIn.social({ provider: 'google' })} className="w-full">
            Continue with Google
          </Button>
          <Button onClick={() => signIn.social({ provider: 'discord' })} className="w-full">
            Continue with Discord
          </Button>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        <Tabs defaultValue="magic-link">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="magic-link">Magic Link</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
          </TabsList>

          <TabsContent value="magic-link">
            {/* Existing magic link form */}
          </TabsContent>

          <TabsContent value="password">
            <form onSubmit={handlePasswordSignIn} className="space-y-4">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
              <Link href="/forgot-password" className="block text-center text-sm text-muted-foreground hover:underline">
                Forgot password?
              </Link>
            </form>
          </TabsContent>
        </Tabs>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Don't have an account? <Link href="/sign-up" className="underline">Sign up</Link>
        </p>
      </CardContent>
    </Card>
  );
}
```

#### Step 2: Update Sign-Up Page

**File**: `packages/web/app/(auth)/sign-up/[[...sign-up]]/page.tsx`

```typescript
const handlePasswordSignUp = async (e: React.FormEvent) => {
  e.preventDefault();

  if (password !== confirmPassword) {
    setError('Passwords do not match');
    return;
  }

  setIsLoading(true);
  setError(null);

  try {
    await signUp.email({ email, password, name });
    // Redirect to onboarding
    router.push('/onboarding');
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to create account');
  } finally {
    setIsLoading(false);
  }
};
```

---

### P2: Admin Dashboard

**Complexity**: High | **Effort**: 3-5 days

Full user management dashboard for admins.

#### Step 1: Create Admin Layout

**File**: `packages/web/app/(admin)/admin/layout.tsx`

```typescript
import { requireAdmin } from '@/lib/auth-server';
import { redirect } from 'next/navigation';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Server-side admin check
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    redirect('/');
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r p-4">
        <h2 className="font-bold mb-4">Admin Panel</h2>
        <nav className="space-y-2">
          <Link href="/admin">Dashboard</Link>
          <Link href="/admin/users">Users</Link>
          <Link href="/admin/events">Events</Link>
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
```

#### Step 2: Create User List Component

**File**: `packages/web/app/(admin)/admin/users/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { authClient } from '@/lib/auth-client';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data } = await authClient.admin.listUsers();
      setUsers(data?.users || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const setUserRole = async (userId: string, role: 'user' | 'admin') => {
    await authClient.admin.setRole({ userId, role });
    loadUsers();
  };

  const banUser = async (userId: string) => {
    await authClient.admin.banUser({ userId });
    loadUsers();
  };

  const unbanUser = async (userId: string) => {
    await authClient.admin.unbanUser({ userId });
    loadUsers();
  };

  const columns = [
    { header: 'Email', accessorKey: 'email' },
    { header: 'Name', accessorKey: 'name' },
    { header: 'Username', accessorKey: 'username' },
    { header: 'Role', accessorKey: 'role' },
    { header: 'Status', cell: ({ row }) => row.original.banned ? 'Banned' : 'Active' },
    {
      header: 'Actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm"><MoreHorizontal /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {row.original.role !== 'admin' && (
              <DropdownMenuItem onClick={() => setUserRole(row.original.id, 'admin')}>
                Promote to Admin
              </DropdownMenuItem>
            )}
            {row.original.role === 'admin' && (
              <DropdownMenuItem onClick={() => setUserRole(row.original.id, 'user')}>
                Demote to User
              </DropdownMenuItem>
            )}
            {!row.original.banned ? (
              <DropdownMenuItem onClick={() => banUser(row.original.id)} className="text-red-500">
                Ban User
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => unbanUser(row.original.id)}>
                Unban User
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  if (isLoading) return <div>Loading users...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Users ({users.length})</h1>
      <DataTable columns={columns} data={users} />
    </div>
  );
}
```

---

### P2: API Key Management UI

**Complexity**: Medium | **Effort**: 1-2 days

Allow users to generate and manage API keys.

#### Step 1: Add API Key Client Plugin

**File**: `packages/web/lib/auth-client.ts`

```typescript
import { apiKeyClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [
    // ... existing plugins
    apiKeyClient(),
  ],
});
```

#### Step 2: Create API Keys Settings Component

**File**: `packages/web/app/(settings)/settings/components/api-keys-settings.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Copy, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface ApiKey {
  id: string;
  name: string;
  createdAt: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
}

export function ApiKeysSettings() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = async () => {
    try {
      const { data } = await authClient.apiKey.list();
      setKeys(data?.keys || []);
    } catch (err) {
      console.error('Failed to load API keys:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const createKey = async () => {
    try {
      const { data } = await authClient.apiKey.create({
        name: newKeyName,
        expiresIn: 60 * 60 * 24 * 365, // 1 year
      });

      if (data?.key) {
        setNewKeyValue(data.key);
        loadKeys();
      }
    } catch (err) {
      toast.error('Failed to create API key');
    }
  };

  const revokeKey = async (keyId: string) => {
    try {
      await authClient.apiKey.revoke({ keyId });
      toast.success('API key revoked');
      loadKeys();
    } catch (err) {
      toast.error('Failed to revoke API key');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>Manage API keys for programmatic access</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p>Loading...</p>
          ) : keys.length === 0 ? (
            <p className="text-muted-foreground">No API keys yet</p>
          ) : (
            <div className="space-y-2">
              {keys.map((key) => (
                <div key={key.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{key.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Created: {new Date(key.createdAt).toLocaleDateString()}
                      {key.lastUsedAt && ` • Last used: ${new Date(key.lastUsedAt).toLocaleDateString()}`}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => revokeKey(key.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <Button onClick={() => setShowNewKeyDialog(true)}>Create New Key</Button>
        </CardContent>
      </Card>

      {/* Create Key Dialog */}
      <Dialog open={showNewKeyDialog} onOpenChange={setShowNewKeyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{newKeyValue ? 'Save Your API Key' : 'Create API Key'}</DialogTitle>
          </DialogHeader>

          {!newKeyValue ? (
            <div className="space-y-4">
              <Input
                placeholder="Key name (e.g., 'My Integration')"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
              />
              <Button onClick={createKey} disabled={!newKeyName.trim()}>
                Create Key
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Copy this key now. You won't be able to see it again.
              </p>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg font-mono text-sm break-all">
                {newKeyValue}
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(newKeyValue)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <Button onClick={() => { setShowNewKeyDialog(false); setNewKeyValue(null); setNewKeyName(''); }}>
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
```

---

### P3: Google One Tap Verification

**Complexity**: Low | **Effort**: 0.5 days

Verify One Tap is working correctly.

#### Verification Steps

1. **Check environment variables are set:**
   ```bash
   GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=xxx
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
   ```

2. **Verify plugin is loading:**
   Check browser console for any One Tap related errors.

3. **Test in incognito:**
   One Tap may not show if user is already signed in with Google in browser.

4. **Check Google Cloud Console:**
   - OAuth consent screen configured
   - Authorized JavaScript origins include your domain
   - Authorized redirect URIs configured

If One Tap isn't appearing, the plugin may need explicit initialization:

```typescript
// In a layout or auth page
useEffect(() => {
  if (typeof window !== 'undefined' && window.google) {
    window.google.accounts.id.prompt();
  }
}, []);
```

---

## Implementation Checklist

Use this checklist when implementing auth features:

### Pre-Implementation
- [ ] Read the relevant Better Auth docs
- [ ] Check if backend plugin is already configured
- [ ] Check if client plugin needs to be added
- [ ] Plan the UI components needed

### During Implementation
- [ ] No `any` types - use proper TypeScript
- [ ] Handle loading states
- [ ] Handle error states with user-friendly messages
- [ ] Use existing UI components (Button, Input, Card, etc.)
- [ ] Follow existing code patterns in the codebase

### Post-Implementation
- [ ] Test happy path
- [ ] Test error cases
- [ ] Test on mobile viewport
- [ ] Update this documentation if needed
- [ ] Run `pnpm check` to verify no type errors

---

## Common Patterns

### Pattern: Protected Mutation

```typescript
import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { requireAuth } from "../auth";

export const createPost = mutation({
  args: {
    eventId: v.id("events"),
    title: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Require authentication
    const { person } = await requireAuth(ctx);

    // 2. Your business logic
    const postId = await ctx.db.insert("posts", {
      ...args,
      authorId: person._id,
      membershipId: undefined,  // Can be set later
    });

    return { postId };
  },
});
```

### Pattern: Role-Based Access

```typescript
import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { requireEventRole } from "../auth";

export const deleteEvent = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, { eventId }) => {
    // Require ORGANIZER role
    await requireEventRole(ctx, eventId.toString(), "ORGANIZER");

    // Only organizers reach here
    await ctx.db.delete(eventId);
    return { success: true };
  },
});
```

### Pattern: Looking Up Other Users

```typescript
import { query } from "../_generated/server";
import { v } from "convex/values";
import { authComponent } from "../auth";

export const getEventMembers = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, { eventId }) => {
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_event", q => q.eq("eventId", eventId))
      .collect();

    // Look up user data for each member
    const members = await Promise.all(
      memberships.map(async (membership) => {
        const person = await ctx.db.get(membership.personId);
        if (!person) return null;

        // Use getAnyUserById to look up any user
        const user = await authComponent.getAnyUserById(
          ctx,
          person.userId as any  // Known limitation - userId is string
        );

        return {
          membership,
          person,
          user: user ? {
            name: user.name,
            email: user.email,
            image: user.image,
          } : null,
        };
      })
    );

    return members.filter(Boolean);
  },
});
```

### Pattern: Updating User via Better Auth API

When you need to update fields managed by Better Auth (name, email, image, etc.):

```typescript
import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { requireAuth, authComponent, createAuth } from "../auth";

export const updateUserProfile = mutation({
  args: {
    name: v.optional(v.string()),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { person } = await requireAuth(ctx);

    // Get the Better Auth API interface
    const { auth, headers } = await authComponent.getAuth(createAuth, ctx);

    // Call the updateUser API
    await auth.api.updateUser({
      body: {
        name: args.name,
        image: args.image,
      },
      headers,
    });

    return { success: true };
  },
});
```

---

## Testing

### Test Environment

Tests use `convex-test` which doesn't register the Better Auth component. The auth functions have fallback logic:

```typescript
// In getAuthUserIdFallback():
// 1. Try Better Auth component (production)
// 2. If "not registered" error, fall back to ctx.auth.getUserIdentity()
// 3. If "Unauthenticated" error, return null
```

### Creating Test Users

```typescript
import { createTestInstance, createTestUser } from "./test_helpers";

test("should do something", async () => {
  const t = createTestInstance();

  // Create a test user (creates person record with mock userId)
  const { userId, personId } = await createTestUser(t, {
    email: "test@example.com",
    username: "testuser",
    name: "Test User",
  });

  // Authenticate as the user
  const asUser = t.withIdentity({ subject: userId });

  // Now call mutations as authenticated user
  const result = await asUser.mutation(api.posts.mutations.createPost, {
    eventId,
    title: "Test Post",
    content: "Content",
  });
});
```

### Testing Admin Functions

```typescript
test("should allow admin access", async () => {
  const t = createTestInstance();

  const { userId } = await createTestUser(t, {
    email: "admin@example.com",
    role: "admin",
  });

  // Pass role in identity for test fallback
  const asAdmin = t.withIdentity({
    subject: userId,
    role: "admin",  // Important: role must be in identity
  } as any);

  // Now isAdmin() will return true
});
```

### What Tests CAN'T Do

1. **Query component tables** - No `ctx.db.query("users")`
2. **Patch component users** - No `ctx.db.patch(userId, {...})`
3. **Test real OAuth flows** - Use mocks or integration tests
4. **Test email sending** - Mock the email function

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
  if (msg.includes("not registered")) {
    // Fallback for tests
    const identity = await ctx.auth.getUserIdentity();
    // ...
  }
  throw error;
}
```

### Error: "Cannot find module '@/convex/_generated/api'"

**Cause**: Path alias not configured or Convex types not generated.

**Fix**:
1. Run `npx convex dev` to generate types
2. Check `tsconfig.json` has proper path mapping

### Error: "Unauthenticated"

**Cause**: User not logged in or session expired.

**Fix**: This is expected behavior. Check if auth is optional for your use case:

```typescript
// If auth is optional:
const person = await getCurrentPerson(ctx);
if (!person) {
  return null;  // Or handle unauthenticated case
}

// If auth is required:
const { person } = await requireAuth(ctx);  // Throws if not auth'd
```

### Error: "Property 'username' does not exist"

**Cause**: Better Auth base user type doesn't include custom fields.

**Fix**: Cast to access custom fields (this is a known limitation):

```typescript
const user = await authComponent.getAuthUser(ctx);
const username = (user as any).username;  // Custom field from username plugin
```

**Better fix**: Create a typed helper:

```typescript
type ExtendedUser = AuthUser & {
  username?: string;
  role?: string;
};

const user = await authComponent.getAuthUser(ctx) as ExtendedUser | null;
```

### TypeScript: "Type instantiation is excessively deep"

**Cause**: Complex type inference with Better Auth + Convex.

**Fix**: Use lazy-loading pattern for API imports:

```typescript
// Instead of:
import { api } from "@/convex/_generated/api";

// Use:
let api: any;
function initApi() {
  if (!api) {
    api = require("@/convex/_generated/api").api;
  }
}
```

---

## Environment Variables

### Required

```env
# Convex
CONVEX_DEPLOYMENT=dev:your-deployment-name
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
NEXT_PUBLIC_CONVEX_SITE_URL=http://localhost:3000

# Better Auth
SITE_URL=http://localhost:3000
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
DEBUG_MAGIC_LINKS=true  # Log magic links to console

# Two-Factor (if using TOTP)
TOTP_ISSUER=Groupi
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
- [ ] Tests pass with `pnpm --filter @groupi/convex test`
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
} from "../auth";

// Convex types
import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id, Doc } from "../_generated/dataModel";

// Client-side auth
import { authClient, signIn, signUp, signOut, useSession } from "@/lib/auth-client";
```

### Function Quick Reference

| Need | Function |
|------|----------|
| Get current person (optional) | `getCurrentPerson(ctx)` |
| Require auth | `requireAuth(ctx)` |
| Check admin | `isAdmin(ctx)` |
| Check event role | `hasEventRole(ctx, eventId, "ORGANIZER")` |
| Look up any user | `authComponent.getAnyUserById(ctx, userId)` |
| Update user fields | `authComponent.getAuth(createAuth, ctx)` then `auth.api.updateUser()` |
| Create person for user | `ensurePersonRecord(ctx, userId)` |
