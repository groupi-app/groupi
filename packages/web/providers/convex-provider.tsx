'use client';

import { ReactNode } from 'react';
import { ConvexReactClient } from 'convex/react';
import { authClient } from '@/lib/auth-client';
import {
  ConvexBetterAuthProvider,
  type AuthClient,
} from '@convex-dev/better-auth/react';
import { isDevelopment } from '@/lib/convex';

let convexClient: ConvexReactClient | null = null;

function getConvexClient() {
  if (!convexClient) {
    convexClient = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!, {
      unsavedChangesWarning: false,
      verbose: isDevelopment,
    });
  }
  return convexClient;
}

export function ConvexClientProvider({
  children,
  initialToken,
}: {
  children: ReactNode;
  initialToken?: string | null;
}) {
  return (
    <ConvexBetterAuthProvider
      client={getConvexClient()}
      authClient={authClient as unknown as AuthClient}
      initialToken={initialToken}
    >
      {children}
    </ConvexBetterAuthProvider>
  );
}
