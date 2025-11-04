# Providers Directory

This directory contains all React context providers used throughout the application.

## Quick Reference

| Provider | Status | Used In | Purpose |
|----------|--------|---------|---------|
| `ThemeProvider` | ✅ Active | Root Layout | Dark/light mode theme state |
| `TooltipProvider` | ✅ Active | Root Layout | Radix UI tooltip context |
| `PusherBeamsProvider` | ✅ Active | Root Layout | Push notification state |
| `PusherChannelsProvider` | ⚠️ Unused | - | Real-time channel subscriptions |
| `SupabaseRealtimeProvider` | ⚠️ Unused | - | Supabase realtime subscriptions |
| `NotificationCloseContextProvider` | ✅ Active | Notification components | Notification UI state |
| `ClientProviders` | ⚠️ Duplicate | - | Bundle of providers (not used) |

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

## Unused Providers

### PusherChannelsProvider
- **File**: `pusher-channels-provider.tsx`
- **Status**: ⚠️ Implementation exists but not currently used
- **Purpose**: Would manage Pusher Channels (real-time events)
- **Note**: Ready to use if needed for real-time features

### SupabaseRealtimeProvider
- **File**: `supabase-realtime-provider.tsx`
- **Status**: ⚠️ Implementation exists but not currently used
- **Purpose**: Would manage Supabase real-time subscriptions
- **Note**: Currently minimal implementation

### ClientProviders
- **File**: `client-providers.tsx`
- **Status**: ⚠️ Duplicate of root layout providers
- **Purpose**: Bundle of providers (was likely from older architecture)
- **Recommendation**: Consider removing or refactoring

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed documentation on:
- Provider hierarchy and ordering
- Client initialization patterns
- Next.js 16 cache components compatibility
- Best practices and troubleshooting

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
    <MyContext.Provider value={/* your value */}>
      {children}
    </MyContext.Provider>
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
- `lib/supabase.ts` - Supabase client initialization
- `lib/auth-client.ts` - Auth client initialization

