# Provider Architecture for Next.js 16

This document explains our provider setup and how it's optimized for Next.js 16 with cache components and static rendering.

## Overview

Our application uses several client-side providers to manage global state and third-party integrations. These are properly configured to work with Next.js 16's cache components feature.

## Provider Hierarchy

The providers are layered in the root layout (`app/layout.tsx`) in this order:

```
<ThemeProvider>          ← Theme state (dark/light mode)
  <TooltipProvider>      ← Radix UI tooltip context
    <PusherBeamsProvider> ← Push notifications (Pusher Beams)
      <Layout>
        {children}
        <GlobalPushNotifications /> ← Manages subscription state
      </Layout>
```

### Why This Order?

1. **ThemeProvider** - Must be outermost so all components can access theme state
2. **TooltipProvider** - Radix UI context needed by many UI components
3. **PusherBeamsProvider** - Push notification state, used by GlobalPushNotifications

## Provider Details

### 1. ThemeProvider (`theme-provider.tsx`)

**Purpose**: Manages dark/light mode theme state using `next-themes`.

**Type**: Pure context wrapper (no side effects)

**Static Rendering**: ✅ Compatible - Uses `suppressHydrationWarning` on `<html>` tag

### 2. TooltipProvider (`ui/tooltip.tsx`)

**Purpose**: Provides Radix UI tooltip context.

**Type**: Pure context wrapper

**Static Rendering**: ✅ Compatible - No side effects

### 3. PusherBeamsProvider (`pusher-beams-context-provider.tsx`)

**Purpose**: Manages push notification state and subscription.

**Type**: Context with client-side initialization

**Static Rendering**: ✅ Compatible - Only initializes in browser

**Key Features**:
- Lazy initialization (only when accessed)
- Browser-only (checks `typeof window`)
- Uses `useSession` hook from auth client

### 4. GlobalPushNotifications (`global-push-notifications.tsx`)

**Purpose**: Automatically checks for and manages existing push subscriptions.

**Type**: Effect-only component (renders null)

**Static Rendering**: ✅ Compatible - All side effects in `useEffect`

## Unused Providers

### ClientProviders (`client-providers.tsx`)

**Status**: ⚠️ Not currently used

This file contains a duplicate provider setup and is not imported anywhere in the codebase. It includes:
- PusherChannelsProvider
- SupabaseRealtimeProvider
- NotificationCloseContextProvider

These providers are used directly in specific components rather than globally:
- `usePusherChannels` - Not currently used
- `SupabaseRealtimeProvider` - Used in specific pages that need realtime
- `useNotificationCloseContext` - Used in notification components

**Recommendation**: Consider removing this file or refactoring to avoid duplication.

## Client Initialization Pattern

All our client libraries (Pusher, Supabase, Auth) follow a consistent pattern:

### Pattern: Lazy Singleton with Proxy

```typescript
let clientInstance: Client | null = null;

function getClient() {
  if (typeof window === 'undefined') {
    throw new Error('Client can only be accessed on the client side');
  }
  
  if (!clientInstance) {
    clientInstance = new Client(
      process.env.NEXT_PUBLIC_CONFIG!
    );
  }
  
  return clientInstance;
}

export const client = new Proxy({} as Client, {
  get(_target, prop) {
    const client = getClient();
    const value = client[prop as keyof Client];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});
```

### Why This Pattern?

1. **Lazy Initialization**: Client only created when first accessed
2. **Browser-Only**: Check `typeof window` prevents SSR execution
3. **Singleton**: Same instance reused across components
4. **Type-Safe**: Full TypeScript support with Proxy
5. **Static Rendering Compatible**: No execution during build/SSR

### Environment Variables

We use `process.env.NEXT_PUBLIC_*` directly instead of importing `env.mjs`. This is safe because:

1. **Build-Time Inlining**: Next.js replaces `process.env.NEXT_PUBLIC_*` at build time
2. **No Runtime Dependency**: No need to load env validation in client bundles
3. **Static Analysis**: Bundler can tree-shake unused code
4. **Cache Component Compatible**: No dynamic imports at module level

## Best Practices

### ✅ DO

1. Use `'use client'` directive at the top of provider files
2. Check `typeof window !== 'undefined'` before initializing browser APIs
3. Use lazy initialization (only create client when needed)
4. Access `process.env.NEXT_PUBLIC_*` directly in client code
5. Keep providers pure (side effects in useEffect only)
6. Document provider dependencies and order

### ❌ DON'T

1. Don't call `require('@/env.mjs')` in client code
2. Don't initialize clients at module level
3. Don't nest providers unnecessarily (causes re-renders)
4. Don't wrap components in providers they're already within
5. Don't mix server-side validation with client code
6. Don't use SSR fallbacks in `'use client'` files

## Cache Components Compatibility

Our setup is fully compatible with Next.js 16 cache components:

1. **Static Rendering**: Layout can be statically rendered up to the `DynamicRootContent` boundary
2. **Private Caching**: `'use cache: private'` directive used for session-dependent content
3. **No Build-Time Execution**: All client initialization happens at runtime in browser
4. **Tree-Shakeable**: Unused code can be eliminated from bundles

## Layout Structure

```tsx
// Root Layout (static)
<html>
  <body>
    <Suspense fallback={<LayoutShellWithoutSession />}>
      {/* Dynamic boundary - 'use cache: private' */}
      <DynamicRootContent>
        {/* All providers here */}
        <ThemeProvider>
          <TooltipProvider>
            <PusherBeamsProvider>
              <Layout>
                {children}
              </Layout>
            </PusherBeamsProvider>
          </TooltipProvider>
        </ThemeProvider>
      </DynamicRootContent>
    </Suspense>
    {/* Global UI outside providers - no state needed */}
    <GlobalUI />
  </body>
</html>
```

## Troubleshooting

### Error: "Cannot access env before initialization"

**Cause**: Trying to import `env.mjs` in client code

**Fix**: Use `process.env.NEXT_PUBLIC_*` directly

### Error: "Client can only be accessed on the client side"

**Cause**: Accessing client before component mount

**Fix**: Ensure access is in useEffect or event handler

### Warning: "Cannot update during render"

**Cause**: Provider initializing state during render

**Fix**: Move initialization to useEffect

### Layout not statically rendering

**Cause**: Dynamic code in layout before Suspense boundary

**Fix**: Move dynamic logic inside `DynamicRootContent` with `'use cache: private'`

## Migration Notes

### Changes from Previous Setup

1. ✅ Removed `require('@/env.mjs')` from client files
2. ✅ Simplified Proxy patterns to bind functions correctly
3. ✅ Fixed double wrapping in GlobalPushNotifications
4. ✅ Documented unused ClientProviders file
5. ✅ Added proper TypeScript documentation

### Breaking Changes

None - all changes are backward compatible.

## References

- [Next.js 16 Documentation](https://nextjs.org/docs)
- [Cache Components Guide](https://nextjs.org/docs/app/building-your-application/caching)
- [React Server Components](https://react.dev/blog/2023/03/22/react-labs-what-we-have-been-working-on-march-2023#react-server-components)

