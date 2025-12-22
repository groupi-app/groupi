'use client';

import { createAuthClient } from 'better-auth/react';
import {
  usernameClient,
  magicLinkClient,
  twoFactorClient,
  oneTapClient,
} from 'better-auth/client/plugins';

/**
 * Better Auth client instance.
 *
 * Following the official Better Auth pattern from:
 * https://www.better-auth.com/docs/concepts/client
 *
 * This is a simple, straightforward client setup that works with Next.js 16.
 * The 'use client' directive ensures this only runs in the browser.
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
  plugins: [
    usernameClient(),
    magicLinkClient(),
    twoFactorClient(),
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

// Export commonly used methods for convenience
export const { signIn, signUp, signOut, useSession } = authClient;

// Helper function to send magic link with either email or username
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
    // Need to look up email from username first
    // We'll call a custom API endpoint to get the email for the username
    try {
      const response = await fetch('/api/auth/username-to-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: identifier }),
      });

      if (!response.ok) {
        return {
          error: {
            message: 'Username not found',
          },
        };
      }

      const { email } = await response.json();

      // Now send magic link with the email
      return await authClient.signIn.magicLink({
        email,
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
