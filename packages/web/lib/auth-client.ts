'use client';

import { createAuthClient } from 'better-auth/react';
import { convexClient } from '@convex-dev/better-auth/client/plugins';

// Import your existing plugins
import { usernameClient } from 'better-auth/client/plugins';
import { magicLinkClient } from 'better-auth/client/plugins';
import { oneTapClient } from 'better-auth/client/plugins';
import { adminClient } from 'better-auth/client/plugins';
import { apiKeyClient } from 'better-auth/client/plugins';
import { multiSessionClient } from 'better-auth/client/plugins';
import { passkeyClient } from '@better-auth/passkey/client';

// Import Convex client for username lookup
import { convex } from './convex';

// Lazy-load API to avoid deep type instantiation issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let authQueries: any;
function initAuthApi() {
  if (!authQueries) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { api } = require('@/convex/_generated/api');
    authQueries = api.auth?.queries ?? {};
  }
}
initAuthApi();

/**
 * Better Auth client instance with Convex integration.
 *
 * This replaces the previous Better Auth setup with the official Convex component.
 * The 'use client' directive ensures this only runs in the browser.
 */
const baseAuthClient = createAuthClient({
  plugins: [
    convexClient(),
    usernameClient(),
    magicLinkClient(),
    adminClient(),
    apiKeyClient(),
    passkeyClient(),
    multiSessionClient(),
    // Conditionally add Google One Tap if client ID is configured
    ...(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
      ? [
          oneTapClient({
            clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          }),
        ]
      : []),
  ],
});

// Type-assert the auth client to include all plugin methods
// This is needed because TypeScript has trouble inferring complex plugin types
export const authClient = baseAuthClient as typeof baseAuthClient & {
  signIn: typeof baseAuthClient.signIn & {
    magicLink: (options: {
      email: string;
      callbackURL?: string;
    }) => Promise<{ error?: { message: string } }>;
  };
  admin: {
    setRole: (options: {
      userId: string;
      role: string;
    }) => Promise<{ error?: { message: string } }>;
    banUser: (options: { userId: string }) => Promise<{
      error?: { message: string };
    }>;
    unbanUser: (options: { userId: string }) => Promise<{
      error?: { message: string };
    }>;
  };
  apiKey: {
    list: () => Promise<{
      data?: Array<{
        id: string;
        name?: string | null;
        start?: string;
        createdAt: string;
        expiresAt?: string | null;
      }>;
      error?: { message: string };
    }>;
    create: (options: { name: string; expiresIn?: number }) => Promise<{
      data?: { key: string };
      error?: { message: string };
    }>;
    delete: (options: { keyId: string }) => Promise<{
      error?: { message: string };
    }>;
  };
  passkey: {
    addPasskey: (options?: { name?: string }) => Promise<{
      error?: { message: string };
    }>;
    listUserPasskeys: () => Promise<{
      data?: Array<{
        id: string;
        name?: string | null;
        createdAt: string;
      }>;
      error?: { message: string };
    }>;
    deletePasskey: (options: { id: string }) => Promise<{
      error?: { message: string };
    }>;
    updatePasskey: (options: { id: string; name: string }) => Promise<{
      error?: { message: string };
    }>;
  };
};

// Export commonly used functions (matching your current exports)
export const { signIn, signUp, signOut, useSession } = authClient;

// Helper function to send magic link with either email or username
// (maintaining compatibility with existing code)
export async function sendMagicLinkWithEmailOrUsername({
  identifier,
  callbackURL,
}: {
  identifier: string;
  callbackURL?: string;
}) {
  // Check if identifier is an email (contains @)
  const isEmail = identifier.includes('@');

  if (isEmail) {
    // Send magic link directly with email
    return await authClient.signIn.magicLink({
      email: identifier,
      callbackURL: callbackURL || '/onboarding',
    });
  } else {
    // Look up email from username using Convex query
    try {
      const result = await convex.query(authQueries.getEmailForUsername, {
        username: identifier,
      });

      if (!result || !result.email) {
        return {
          error: {
            message: 'Username not found',
          },
        };
      }

      // Now send magic link with the email
      return await authClient.signIn.magicLink({
        email: result.email,
        callbackURL: callbackURL || '/onboarding',
      });
    } catch {
      return {
        error: {
          message: 'Failed to send magic link',
        },
      };
    }
  }
}
