'use client';

import { ReactNode, useState } from 'react';
import { ConvexReactClient } from 'convex/react';
import { authClient } from '@/lib/auth-client';
import {
  ConvexBetterAuthProvider,
  type AuthClient,
} from '@convex-dev/better-auth/react';
import { isDevelopment } from '@/lib/convex';

export function ConvexClientProvider({
  children,
  initialToken,
}: {
  children: ReactNode;
  initialToken?: string | null;
}) {
  const [client] = useState(
    () =>
      new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!, {
        unsavedChangesWarning: false,
        verbose: isDevelopment,
      })
  );

  return (
    <ConvexBetterAuthProvider
      client={client}
      authClient={authClient as unknown as AuthClient}
      initialToken={initialToken}
    >
      {children}
    </ConvexBetterAuthProvider>
  );
}
