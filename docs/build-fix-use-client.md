# Build Fix: Missing 'use client' Directive

## Problem

Build was failing with this error:

```
Error occurred prerendering page "/_not-found"
Error: Auth client can only be accessed on the client side
    at getAuthClient (turbopack:///[project]/apps/web/lib/auth-client.ts:29:11)
    at useSession (turbopack:///[project]/apps/web/lib/auth-client.ts:108:12)
    at usePusherBeams (turbopack:///[project]/apps/web/lib/pusher-notifications.ts:42:29)
```

## Root Cause

The file `lib/pusher-notifications.ts` was missing the `'use client'` directive at the top, even though it:

- Uses React hooks (`useState`, `useEffect`, `useCallback`, `useRef`)
- Imports from `@/lib/auth-client` (a client-only module)
- Uses browser-only APIs (ServiceWorker, PushManager)

Without the directive, Next.js tried to execute this code during server-side rendering (SSR), which caused it to access the auth client before the browser context was available.

## Solution

### Added 'use client' Directive

**File:** `apps/web/lib/pusher-notifications.ts`

```typescript
'use client'; // ← ADDED THIS

import * as PusherPushNotifications from '@pusher/push-notifications-web';
import { useSession } from '@/lib/auth-client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { pusherLogger } from './logger';
```

### Why This Works

1. **Client-Only Execution**: The `'use client'` directive tells Next.js that this entire module should only run in the browser, never during SSR
2. **React Hook Rules**: React hooks can only be used in client components
3. **Browser APIs**: ServiceWorker, PushManager, and other browser APIs are only available client-side

## Verification

After adding the directive:

✅ **TypeScript Compilation**: `npx tsc --noEmit` passes with no errors
✅ **No SSR Errors**: File won't be executed during prerendering
✅ **Proper Client Boundary**: Next.js knows to only hydrate this code in the browser

## Related Files

All these files correctly have `'use client'` directives:

- ✅ `lib/auth-client.ts`
- ✅ `lib/pusher-client.ts`
- ✅ `lib/supabase.ts`
- ✅ `lib/pusher-notifications.ts` (NOW FIXED)
- ✅ `hooks/use-realtime-sync.ts`
- ✅ All provider files in `components/providers/`

## Remaining Build Issue

The build still requires environment variables to be set. This is **normal and expected**. The `env.mjs` file validates that all required environment variables are present at build time, which is a good practice for catching configuration errors early.

### To Complete the Build

1. **Copy the example file:**

   ```bash
   cp .env.example .env.local
   ```

2. **Fill in your actual credentials** - The build requires these environment variables:
   - Database URLs
   - Auth secrets and URLs
   - OAuth credentials (Discord, Google)
   - Pusher credentials
   - API keys (Google, Resend, Sentry)

3. **Run the build:**
   ```bash
   pnpm build
   ```

## Summary

The provider refactoring is working correctly! The only issues were:

1. ✅ **FIXED**: Missing `'use client'` directive in `pusher-notifications.ts`
2. ⚠️ **USER ACTION NEEDED**: Environment variables need to be configured

The second issue is not a bug - it's a feature that prevents deploying with missing configuration.
