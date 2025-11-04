# Auth Wrapper Migration Plan

## Overview

This document outlines the migration strategy to replace `getCurrentUserId()` and `getCurrentSession()` wrapper functions with direct Better Auth usage (`auth.api.getSession()`).

## Rationale

### Current State

- **Wrapper functions**: ~100 lines of Effect code with prerendering detection
- **Used in**: 27 files (88+ usages across web app and services)
- **Pattern**: ResultTuple `[error, data]` consistency

### Benefits of Migration

1. **Simpler code**: Direct Better Auth API usage (~5 lines vs ~100 lines)
2. **Better Auth patterns**: Follows official documentation
3. **Reduced complexity**: No custom prerendering detection needed
4. **Easier maintenance**: Less custom code to maintain
5. **Proven pattern**: Already works in 3 places (admin page, uploadthing)

### Trade-offs

- **ResultTuple consistency**: Service layer currently uses `[error, data]` pattern
- **Migration effort**: ~88 usages to migrate
- **Error handling**: Need to standardize on try/catch vs ResultTuple

## Migration Strategy

### Phase 1: Create Helper Utilities (Optional)

Create lightweight helpers that maintain ResultTuple pattern but use Better Auth directly:

```typescript
// packages/services/src/domains/auth-helpers.ts
import { auth } from './auth';
import { headers } from 'next/headers';
import type { ResultTuple } from '@groupi/schema';
import { AuthenticationError } from '@groupi/schema';

/**
 * Get current user ID using Better Auth directly
 * Returns ResultTuple for consistency with service layer
 */
export async function getUserId(
  requestHeaders?: Headers
): Promise<ResultTuple<AuthenticationError, string | null>> {
  try {
    const headersToUse = requestHeaders ?? (await headers());
    const session = await auth.api.getSession({ headers: headersToUse });

    if (!session?.user?.id) {
      return [null, null];
    }

    return [null, session.user.id];
  } catch (error) {
    return [
      new AuthenticationError({
        message: 'Failed to get session',
        cause: error instanceof Error ? error : new Error(String(error)),
      }),
      undefined,
    ];
  }
}

/**
 * Get current session using Better Auth directly
 * Returns ResultTuple for consistency with service layer
 */
export async function getSession(
  requestHeaders?: Headers
): Promise<ResultTuple<AuthenticationError, Session | null>> {
  try {
    const headersToUse = requestHeaders ?? (await headers());
    const session = await auth.api.getSession({ headers: headersToUse });

    if (!session) {
      return [null, null];
    }

    return [null, session];
  } catch (error) {
    return [
      new AuthenticationError({
        message: 'Failed to get session',
        cause: error instanceof Error ? error : new Error(String(error)),
      }),
      undefined,
    ];
  }
}
```

**Decision Point**: Choose one approach:

- **Option A**: Use helpers (maintains ResultTuple, ~20 lines)
- **Option B**: Direct Better Auth everywhere (cleaner, requires error handling changes)

### Phase 2: Migration Patterns by Context

#### Pattern 1: Route Handlers

**Before:**

```typescript
import { getCurrentUserId } from '@groupi/services';

export async function GET(request: NextRequest) {
  const [error, userId] = await getCurrentUserId(request.headers);
  if (error || !userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ...
}
```

**After (Option A - Helper):**

```typescript
import { getUserId } from '@groupi/services';

export async function GET(request: NextRequest) {
  const [error, userId] = await getUserId(request.headers);
  if (error || !userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ...
}
```

**After (Option B - Direct):**

```typescript
import { auth } from '@groupi/services';

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;
  // ...
}
```

#### Pattern 2: Server Components

**Before:**

```typescript
import { getCurrentUserId } from '@groupi/services';

export async function MyComponent() {
  'use cache: private';

  const [error, userId] = await getCurrentUserId();
  if (error || !userId) {
    redirect('/sign-in');
  }
  // ...
}
```

**After (Option A - Helper):**

```typescript
import { getUserId } from '@groupi/services';
import { headers } from 'next/headers';

export async function MyComponent() {
  'use cache: private';

  const [error, userId] = await getUserId(await headers());
  if (error || !userId) {
    redirect('/sign-in');
  }
  // ...
}
```

**After (Option B - Direct):**

```typescript
import { auth } from '@groupi/services';
import { headers } from 'next/headers';

export async function MyComponent() {
  'use cache: private';

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    redirect('/sign-in');
  }
  const userId = session.user.id;
  // ...
}
```

#### Pattern 3: Server Actions

**Before:**

```typescript
import { getCurrentUserId } from '@groupi/services';

export async function myAction() {
  const [error, userId] = await getCurrentUserId();
  if (error || !userId) {
    return [
      new AuthenticationError({ message: 'Not authenticated' }),
      undefined,
    ];
  }
  // ...
}
```

**After (Option A - Helper):**

```typescript
import { getUserId } from '@groupi/services';
import { headers } from 'next/headers';

export async function myAction() {
  const [error, userId] = await getUserId(await headers());
  if (error || !userId) {
    return [
      error || new AuthenticationError({ message: 'Not authenticated' }),
      undefined,
    ];
  }
  // ...
}
```

**After (Option B - Direct):**

```typescript
import { auth } from '@groupi/services';
import { headers } from 'next/headers';
import { AuthenticationError } from '@groupi/schema';

export async function myAction() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return [
      new AuthenticationError({ message: 'Not authenticated' }),
      undefined,
    ];
  }
  const userId = session.user.id;
  // ...
}
```

#### Pattern 4: Service Layer (Domain Functions)

**Before:**

```typescript
import { getCurrentUserId } from './auth';

export const getPostFeedData = async ({ eventId }: Params) => {
  const [authError, userId] = await getCurrentUserId();
  if (authError || !userId) {
    return [
      authError || new AuthenticationError({ message: 'Not authenticated' }),
      undefined,
    ] as const;
  }

  const effect = Effect.gen(function* () {
    // Use userId here
  });
  // ...
};
```

**After (Option A - Helper):**

```typescript
import { getUserId } from './auth-helpers';

export const getPostFeedData = async ({ eventId }: Params) => {
  const [authError, userId] = await getUserId();
  if (authError || !userId) {
    return [
      authError || new AuthenticationError({ message: 'Not authenticated' }),
      undefined,
    ] as const;
  }

  const effect = Effect.gen(function* () {
    // Use userId here
  });
  // ...
};
```

**After (Option B - Direct):**

```typescript
import { auth } from './auth';
import { headers } from 'next/headers';
import { AuthenticationError } from '@groupi/schema';

export const getPostFeedData = async ({ eventId }: Params) => {
  let userId: string;
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return [
        new AuthenticationError({ message: 'Not authenticated' }),
        undefined,
      ] as const;
    }
    userId = session.user.id;
  } catch (error) {
    return [
      new AuthenticationError({
        message: 'Failed to get session',
        cause: error instanceof Error ? error : new Error(String(error)),
      }),
      undefined,
    ] as const;
  }

  const effect = Effect.gen(function* () {
    // Use userId here
  });
  // ...
};
```

### Phase 3: Migration Checklist

#### Step 1: Create Helper Utilities (if Option A)

- [ ] Create `packages/services/src/domains/auth-helpers.ts`
- [ ] Export `getUserId()` and `getSession()` helpers
- [ ] Add tests for helpers
- [ ] Update exports in `packages/services/src/index.ts`

#### Step 2: Fix Prerendering Issues First

- [ ] Ensure all Server Components using auth have `'use cache: private'`
- [ ] Verify build passes without prerendering errors
- [ ] Document: prerendering is prevented by `'use cache: private'`, not wrapper functions

#### Step 3: Migrate Route Handlers (Easiest)

- [ ] `apps/web/app/api/auth/user/route.ts`
- [ ] `apps/web/app/api/pusher/beams-auth/route.ts`
- [ ] Test each route handler

#### Step 4: Migrate Server Components

- [ ] `apps/web/components/main-nav-dynamic-wrapper.tsx`
- [ ] `apps/web/app/(event)/event/[eventId]/availability/page.tsx`
- [ ] `apps/web/app/(post)/post/[postId]/components/full-post-server.tsx`
- [ ] `apps/web/app/(post)/post/[postId]/edit/page.tsx`
- [ ] `apps/web/app/(newEvent)/create/page.tsx`
- [ ] `apps/web/app/(settings)/settings/notifications/page.tsx`
- [ ] `apps/web/app/(post)/post/[postId]/components/replies.tsx`
- [ ] `apps/web/app/(invite)/invite/[inviteId]/page.tsx`
- [ ] Test each page/component

#### Step 5: Migrate Server Actions

- [ ] `apps/web/actions/settings-actions.ts`
- [ ] `apps/web/actions/notification-actions.ts`
- [ ] `apps/web/actions/event-actions.ts`
- [ ] Test each action

#### Step 6: Migrate Service Layer (Most Complex)

- [ ] `packages/services/src/domains/admin.ts`
- [ ] `packages/services/src/domains/reply.ts`
- [ ] `packages/services/src/domains/post.ts`
- [ ] `packages/services/src/domains/person.ts`
- [ ] `packages/services/src/domains/notification.ts`
- [ ] `packages/services/src/domains/membership.ts`
- [ ] `packages/services/src/domains/invite.ts`
- [ ] `packages/services/src/domains/settings.ts`
- [ ] `packages/services/src/domains/availability.ts`
- [ ] `packages/services/src/domains/event.ts`
- [ ] Test each domain service

#### Step 7: Migrate Cache Functions

- [ ] `packages/services/src/cache/event-cache.ts`
- [ ] `packages/services/src/cache/post-cache.ts`
- [ ] `packages/services/src/cache/user-cache.ts`
- [ ] Test cache invalidation

#### Step 8: Remove Old Wrapper Functions

- [ ] Remove `getCurrentUserId()` from `packages/services/src/domains/auth.ts`
- [ ] Remove `getCurrentSession()` from `packages/services/src/domains/auth.ts`
- [ ] Remove `getLegacyAuth()` if unused
- [ ] Update exports
- [ ] Search for any remaining usages

#### Step 9: Cleanup

- [ ] Remove unused imports
- [ ] Update documentation
- [ ] Verify build passes
- [ ] Run full test suite

## Testing Strategy

### Unit Tests

- Test helper functions (if Option A)
- Test error handling paths
- Test null session handling

### Integration Tests

- Test Route Handlers authentication
- Test Server Components with auth
- Test Server Actions with auth
- Test Service Layer auth checks

### E2E Tests

- Test protected routes
- Test authentication flows
- Test error states

## Prerendering Safety

### Key Principle

**`'use cache: private'` prevents prerendering** - wrapper functions don't need prerendering detection if components are properly marked.

### Verification

- All Server Components that call auth must have `'use cache: private'`
- Run `pnpm dlx next build --debug-prerender` to verify no prerendering errors
- If prerendering errors occur, add `'use cache: private'` to the component

## Rollback Plan

If issues arise:

1. Keep old wrapper functions in `auth.ts` (mark as deprecated)
2. Gradually migrate back if needed
3. Helper functions can coexist with wrappers during migration

## Recommendation

**Recommend Option A (Helper Functions)** because:

1. Maintains ResultTuple consistency in service layer
2. Minimal changes to existing code
3. Easier migration path
4. Can still migrate to Option B later if desired

**Helper functions provide**:

- ResultTuple pattern (`[error, data]`)
- Error transformation (to AuthenticationError)
- Simple Better Auth usage internally
- Same API surface as current wrappers

## Timeline Estimate

- **Phase 1**: 1-2 hours (create helpers)
- **Phase 2**: 4-6 hours (migrate Route Handlers + Server Components)
- **Phase 3**: 6-8 hours (migrate Server Actions + Service Layer)
- **Phase 4**: 2-3 hours (testing + cleanup)
- **Total**: ~13-19 hours

## Next Steps

1. **Decision**: Choose Option A (helpers) or Option B (direct)
2. **Start with Route Handlers**: Easiest migration, low risk
3. **Verify prerendering**: Ensure `'use cache: private'` is used correctly
4. **Gradual migration**: One context at a time
5. **Test thoroughly**: After each phase
