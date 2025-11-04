# Prerendering Issue Summary

## The Problem

Build fails with:

```
Error [InvariantError]: Invariant: Expected workUnitAsyncStorage to have a store. This is a bug in Next.js.
```

This error occurs during `next build` when trying to statically prerender pages.

## What We've Tried

### 1. Complex Effect-based wrappers with prerendering detection ❌

- Wrapped `headers()` calls in Effect.tryPromise
- Detected `workUnitAsyncStorage` errors
- Still failed during prerendering

### 2. Direct Better Auth usage with `'use cache: private'` in helpers ❌

- Added `'use cache: private'` + `cacheLife()` to helper functions
- Caused `HANGING_PROMISE_REJECTION` in Route Handlers
- Still failed during prerendering

### 3. Separate helpers for Route Handlers vs Server Components ❌

- Created `getUserId()` (with caching) and `getUserIdUncached()` (without)
- Still failed during prerendering

### 4. `export const dynamic = 'force-dynamic'` ❌

- Added to root layout and pages
- **Not compatible with `cacheComponents: true`**

### 5. `connection()` from 'next/server' ❌

- Added to components to explicitly mark as dynamic
- Still failed during prerendering

### 6. `'use cache: private'` on components (current approach) ⏳

- Removed from helpers, added to components
- Using `cacheLife({ stale: 60 })`
- Still failing, but this is the correct pattern per Next.js docs

## Current Architecture

### Helper Functions (auth-helpers.ts)

```typescript
// NO 'use cache' directive in helpers
export async function getUserId() {
  const headersToUse = await headers();
  const session = await auth.api.getSession({ headers: headersToUse });
  // ...
}

// Separate uncached version for Route Handlers
export async function getUserIdUncached() {
  const headersToUse = await headers();
  const session = await auth.api.getSession({ headers: headersToUse });
  // ...
}
```

### Server Components

```typescript
export async function MainNavDynamicWrapper() {
  'use cache: private';
  cacheLife({ stale: 60 });

  const [error, session] = await getSession();
  // ...
}
```

### Route Handlers

```typescript
export async function GET() {
  const [error, userId] = await getUserIdUncached();
  // ...
}
```

## Root Cause

The error occurs because:

1. Next.js tries to statically prerender ALL pages during build
2. The root layout includes `MainNavDynamicWrapper` which calls `getSession()`
3. `getSession()` calls `headers()` from `next/headers`
4. During prerendering (no request context), `headers()` throws `InvariantError`

Even with:

- Suspense boundaries
- `'use cache: private'` directive
- `cacheLife()` configuration
- `connection()` calls

Next.js still attempts to evaluate the layout during static generation.

## Next.js Configuration

```javascript
// next.config.mjs
{
  cacheComponents: true,
  cacheLife: {
    default: { stale: 300, revalidate: 120, expire: 3600 },
    // ... other profiles
  }
}
```

## Possible Solutions to Explore

### Option 1: Use Next.js Devtools MCP

Use the Next.js MCP integration to get runtime debugging:

```bash
__NEXT_EXPERIMENTAL_MCP_SERVER=true pnpm dev
```

Then query runtime state to understand why prerendering is still occurring.

### Option 2: Completely Remove Auth from Root Layout

Move authentication to individual page-level components:

- Remove `MainNavDynamicWrapper` from root layout
- Add session fetching to each protected page
- Trade-off: No user display in global nav

### Option 3: Client-Side Auth State

Use client-side auth with Better Auth's `useSession()` hook:

- Remove all server-side session fetching from layout
- Fetch session client-side in `MainNavDynamic`
- Trade-off: Flash of unauthenticated state

### Option 4: Disable `cacheComponents` Temporarily

```javascript
{
  cacheComponents: false;
}
```

- Allows `export const dynamic = 'force-dynamic'` on root layout
- Trade-off: Lose all caching benefits

### Option 5: Report to Next.js Team

This might be a genuine bug or limitation in Next.js 16's `cacheComponents` feature with `headers()` in layouts.

## Recommended Next Steps

1. **Try MCP Devtools** - Get detailed runtime info about what's being prerendered
2. **Test without layout auth** - Verify the build passes when auth is removed from layout
3. **Check Better Auth docs** - See if there's a recommended pattern for Next.js 16 + cacheComponents
4. **Consider client-side session** - For navigation only, might be acceptable

## Key Learnings

1. **`'use cache: private'` placement**: Should be on components, not helper functions
2. **Route Handler caching**: `'use cache: private'` causes hanging promises in Route Handlers
3. **`connection()` usage**: Marks components as dynamic but doesn't prevent layout prerendering
4. **`cacheComponents` limitations**: Incompatible with `export const dynamic = 'force-dynamic'`
5. **Better Auth `nextCookies()`**: Essential plugin for Server Actions/Components (already added)

## Files Modified

**Helpers:**

- `packages/services/src/domains/auth-helpers.ts` - Simplified helpers without caching

**Components:**

- `apps/web/components/main-nav-dynamic-wrapper.tsx` - Added `'use cache: private'` + `cacheLife()`
- All protected pages - Wrapped in Suspense, removed `'use cache: private'`

**Route Handlers:**

- `apps/web/app/api/auth/user/route.ts` - Uses `getUserIdUncached()`
- `apps/web/app/api/pusher/beams-auth/route.ts` - Uses `getUserIdUncached()`
- `apps/web/app/api/uploadthing/*` - Uses direct `auth.api.getSession()`

**Auth Config:**

- `packages/services/src/domains/auth.ts` - Added `nextCookies()` plugin
