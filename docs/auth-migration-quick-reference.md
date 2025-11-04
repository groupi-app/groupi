# Auth Migration Quick Reference

## Decision: Use Option A (Helper Functions)

Recommended approach: Create lightweight helpers that maintain ResultTuple pattern but use Better Auth directly.

## Quick Patterns

### Route Handler Migration

```typescript
// OLD
import { getCurrentUserId } from '@groupi/services';
const [error, userId] = await getCurrentUserId(request.headers);

// NEW
import { getUserId } from '@groupi/services';
const [error, userId] = await getUserId(request.headers);
```

### Server Component Migration

```typescript
// OLD
import { getCurrentUserId } from '@groupi/services';
export async function MyComponent() {
  'use cache: private';
  const [error, userId] = await getCurrentUserId();
}

// NEW
import { getUserId } from '@groupi/services';
import { headers } from 'next/headers';
export async function MyComponent() {
  'use cache: private';
  const [error, userId] = await getUserId(await headers());
}
```

### Server Action Migration

```typescript
// OLD
import { getCurrentUserId } from '@groupi/services';
const [error, userId] = await getCurrentUserId();

// NEW
import { getUserId } from '@groupi/services';
import { headers } from 'next/headers';
const [error, userId] = await getUserId(await headers());
```

### Service Layer Migration

```typescript
// OLD
import { getCurrentUserId } from './auth';
const [authError, userId] = await getCurrentUserId();

// NEW
import { getUserId } from './auth-helpers';
const [authError, userId] = await getUserId();
```

## Key Differences

1. **Import change**: `getCurrentUserId` → `getUserId`, `getCurrentSession` → `getSession`
2. **Server Components/Actions**: Must explicitly use `await headers()` and pass to helper
3. **Route Handlers**: No change - still pass `request.headers`
4. **Service Layer**: No change - helper handles `headers()` internally

## Files to Migrate (in order)

### Priority 1: Route Handlers (Easiest)

- `apps/web/app/api/auth/user/route.ts`
- `apps/web/app/api/pusher/beams-auth/route.ts`

### Priority 2: Server Components

- `apps/web/components/main-nav-dynamic-wrapper.tsx`
- `apps/web/app/(event)/event/[eventId]/availability/page.tsx`
- `apps/web/app/(post)/post/[postId]/components/full-post-server.tsx`
- `apps/web/app/(post)/post/[postId]/edit/page.tsx`
- `apps/web/app/(newEvent)/create/page.tsx`
- `apps/web/app/(settings)/settings/notifications/page.tsx`
- `apps/web/app/(post)/post/[postId]/components/replies.tsx`
- `apps/web/app/(invite)/invite/[inviteId]/page.tsx`

### Priority 3: Server Actions

- `apps/web/actions/settings-actions.ts`
- `apps/web/actions/notification-actions.ts`
- `apps/web/actions/event-actions.ts`

### Priority 4: Service Layer

- All files in `packages/services/src/domains/`
- All files in `packages/services/src/cache/`

## Critical Reminders

1. **`'use cache: private'` is required** for all Server Components that use auth
2. **Route Handlers**: Pass `request.headers` directly
3. **Server Components/Actions**: Use `await headers()` from `next/headers`
4. **Service Layer**: Helper handles headers internally (no change needed)

## Testing Checklist

After each migration:

- [ ] Component/page loads correctly
- [ ] Authentication works (logged in)
- [ ] Unauthorized redirects work (logged out)
- [ ] No prerendering errors in build
- [ ] No TypeScript errors
