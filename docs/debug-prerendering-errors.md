# Debug Logging for Prerendering Errors

## Overview

Enhanced debug logging has been added to help identify exactly where `headers()` is being called during prerendering, which causes the `workUnitAsyncStorage` error.

## What Was Added

### 1. Debug Utility (`packages/services/src/utils/debug-headers.ts`)

A wrapper around `headers()` that:

- Captures stack traces showing exactly where `headers()` is called
- Logs file paths, function names, and line numbers
- Provides detailed error messages during build/prerendering

### 2. Enhanced Auth Helpers

Updated `auth-helpers.ts` to:

- Use `getHeadersWithDebug()` instead of direct `headers()` calls
- Detect prerendering errors and log detailed information
- Provide clearer error messages indicating which component needs `'use cache: private'`

### 3. Enhanced Auth Functions

Updated `auth.ts` functions (`getCurrentUserId`, `getCurrentSession`) to:

- Use `getHeadersWithDebug()` wrapper
- Log detailed stack traces through Effect logger
- Better identify prerendering issues

## How to Use

When you run `next build`, you'll now see detailed error logs like:

```
[DEBUG] headers() called during build/prerendering:
  File: apps/web/app/(admin)/admin/page.tsx
  Function: AdminContent
  Line: 32
  Stack:
    at AdminContent (apps/web/app/(admin)/admin/page.tsx:32:10)
    at AdminPage (apps/web/app/(admin)/admin/page.tsx:12:5)
    ...

[PRERENDER ERROR] headers() called during prerendering:
  File: apps/web/app/(admin)/admin/page.tsx
  Function: AdminContent
  Line: 32
  Error: Invariant: Expected workUnitAsyncStorage to have a store. This is a bug in Next.js.
  Full Stack:
    ...

This component needs 'use cache: private' directive or should be wrapped in Suspense.
```

## What to Look For

When you see these errors:

1. **Check the File Path**: The log shows exactly which file is calling `headers()`
2. **Check the Function**: The function name tells you which component needs fixing
3. **Check the Line Number**: The line number shows where the problematic call is
4. **Add 'use cache: private'**: Components that call `getUserId()` or `getSession()` need:
   ```typescript
   'use cache: private';
   cacheLife({ stale: 60 }); // or appropriate cache time
   ```

## Common Patterns

### Pattern 1: Server Component Calling Auth Directly

```typescript
// ❌ Bad - will fail during prerendering
export default async function MyPage() {
  const [error, userId] = await getUserId();
  // ...
}

// ✅ Good - prevents prerendering
export default async function MyPage() {
  return (
    <Suspense fallback={<Loading />}>
      <DynamicContent />
    </Suspense>
  );
}

async function DynamicContent() {
  'use cache: private';
  cacheLife({ stale: 60 });
  const [error, userId] = await getUserId();
  // ...
}
```

### Pattern 2: Cache Functions Already Protected

Cache functions in `packages/services/src/cache/` already have `'use cache: private'`, so they're safe to call from any server component.

## Next Steps

1. Run `next build` and collect all the error logs
2. For each error, add `'use cache: private'` to the component
3. Wrap components in Suspense boundaries if they're not already
4. Re-run the build to verify fixes

## Files Modified

- `packages/services/src/utils/debug-headers.ts` (new)
- `packages/services/src/domains/auth-helpers.ts` (updated)
- `packages/services/src/domains/auth.ts` (updated)
