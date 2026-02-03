'use client';

import { ReactNode } from 'react';
import { ConvexReactClient } from 'convex/react';
import { authClient } from '@/lib/auth-client';
import {
  ConvexBetterAuthProvider,
  type AuthClient,
} from '@convex-dev/better-auth/react';
import { isDevelopment } from '@/lib/convex';

// 🚀 Enhanced Convex client with performance optimizations
const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!, {
  // 🗄️ Optimized for real-time performance
  unsavedChangesWarning: false, // Disabled for better UX with optimistic updates
  verbose: isDevelopment,
});

export function ConvexClientProvider({
  children,
  initialToken,
}: {
  children: ReactNode;
  initialToken?: string | null;
}) {
  return (
    <ConvexBetterAuthProvider
      client={convex}
      authClient={authClient as unknown as AuthClient}
      initialToken={initialToken}
    >
      {children}
    </ConvexBetterAuthProvider>
  );
}
