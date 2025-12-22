# Providers Directory

This directory contains all React context providers used throughout the application.

## Quick Reference

| Provider                           | Status    | Used In                 | Purpose                     |
| ---------------------------------- | --------- | ----------------------- | --------------------------- |
| `ThemeProvider`                    | ✅ Active | Root Layout             | Dark/light mode theme state |
| `TooltipProvider`                  | ✅ Active | Root Layout             | Radix UI tooltip context    |
| `PusherBeamsProvider`              | ✅ Active | Root Layout             | Push notification state     |
| `NotificationCloseContextProvider` | ✅ Active | Notification components | Notification UI state       |

## Active Providers

### ThemeProvider

- **File**: `theme-provider.tsx`
- **Library**: `next-themes`
- **Purpose**: Manages application theme (dark/light mode)
- **Usage**: Wrap entire app, accessed via `useTheme()` hook

### TooltipProvider

- **File**: `ui/tooltip.tsx` (Radix UI)
- **Purpose**: Provides context for Radix UI tooltips
- **Usage**: Wrap entire app, tooltips work automatically

### PusherBeamsProvider

- **File**: `pusher-beams-context-provider.tsx`
- **Purpose**: Manages push notification subscription state
- **Hook**: `usePusherBeams()`
- **Usage**:
  ```tsx
  const { subscribe, unsubscribe, isSubscribed } = usePusherBeams();
  ```

### NotificationCloseContextProvider

- **File**: `notif-close-provider.tsx`
- **Purpose**: Manages notification popover/sheet open state
- **Hook**: `useNotificationCloseContext()`
- **Used By**: Notification components, mobile nav

## Architecture

### Provider Hierarchy

Providers are layered in the root layout (`app/layout.tsx`) in this order:

```
<ThemeProvider>          ← Theme state (dark/light mode)
  <TooltipProvider>      ← Radix UI tooltip context
    <PusherBeamsProvider> ← Push notifications (Pusher Beams)
      <Layout>
        {children}
      </Layout>
```

### Client Initialization Pattern

All client libraries (Pusher, Auth) use lazy singleton initialization:

- **Lazy**: Client only created when first accessed
- **Browser-only**: Checks `typeof window` to prevent SSR execution
- **Singleton**: Same instance reused across components
- **Static rendering compatible**: No execution during build/SSR

### Next.js 16 Compatibility

- All providers use `'use client'` directive
- Side effects are in `useEffect` hooks only
- Compatible with Next.js 16 cache components
- Uses `process.env.NEXT_PUBLIC_*` directly (not `env.mjs`) for client code

## Adding a New Provider

1. Create a new file in this directory
2. Use `'use client'` directive
3. Follow the lazy initialization pattern (see ARCHITECTURE.md)
4. Add it to the root layout in the correct order
5. Update this README
6. Export a custom hook for accessing the context

### Template

```tsx
'use client';

import { createContext, useContext, ReactNode } from 'react';

interface MyContextValue {
  // Your state/methods here
}

const MyContext = createContext<MyContextValue | null>(null);

export function MyProvider({ children }: { children: ReactNode }) {
  // Your logic here

  return (
    <MyContext.Provider value={/* your value */}>{children}</MyContext.Provider>
  );
}

export function useMyContext() {
  const context = useContext(MyContext);
  if (!context) {
    throw new Error('useMyContext must be used within MyProvider');
  }
  return context;
}
```

## Common Issues

### Provider Order Matters

Providers must be nested in the correct order. Inner providers can use outer provider hooks, but not vice versa.

### Avoid Over-Wrapping

Don't wrap components in providers they're already within. This causes unnecessary re-renders.

### Client-Side Only

All providers in this directory are client-side only. For server-side context, use React Server Components patterns.

## Related Files

- `app/layout.tsx` - Root layout with provider hierarchy
- `lib/pusher-client.ts` - Pusher client initialization
- `lib/auth-client.ts` - Auth client initialization
