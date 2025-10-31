// Import only client-side auth utilities
import { createAuthClient } from 'better-auth/react';
import {
  usernameClient,
  magicLinkClient,
  twoFactorClient,
  oneTapClient,
} from 'better-auth/client/plugins';

/**
 * Get auth client configuration.
 * Uses process.env directly - NEXT_PUBLIC_* vars are inlined at build time.
 */
function getAuthClientConfig() {
  return {
    baseURL: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
    googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  };
}

let authClientInstance: ReturnType<typeof createAuthClient> | null = null;

/**
 * Get or create the singleton auth client instance.
 * Safe for use in client components - will only initialize in the browser.
 */
function getAuthClient() {
  if (typeof window === 'undefined') {
    throw new Error('Auth client can only be accessed on the client side');
  }

  if (!authClientInstance) {
    const config = getAuthClientConfig();
    authClientInstance = createAuthClient({
      baseURL: config.baseURL,
      plugins: [
        usernameClient(),
        magicLinkClient(),
        twoFactorClient(),
        // Conditionally add Google One Tap if client ID is configured
        ...(config.googleClientId
          ? [
              oneTapClient({
                clientId: config.googleClientId,
              }),
            ]
          : []),
      ],
    });
  }

  return authClientInstance;
}

/**
 * Lazy getter object for auth client.
 * This approach works with Next.js 16 because:
 * - It only accesses the client when properties are accessed (not at module load)
 * - All access happens in client components after mount
 * - process.env.NEXT_PUBLIC_* vars are inlined at build time
 */
export const authClient = new Proxy({} as ReturnType<typeof createAuthClient>, {
  get(_target, prop) {
    const client = getAuthClient();
    const value = client[prop as keyof typeof client];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

// Export individual properties - these are lazy getters that only evaluate when accessed
export const signIn = new Proxy(
  {} as ReturnType<typeof createAuthClient>['signIn'],
  {
    get(_target, prop) {
      const client = getAuthClient();
      const value = client.signIn[prop as keyof typeof client.signIn];
      return typeof value === 'function' ? value.bind(client.signIn) : value;
    },
  }
);

export const signUp = new Proxy(
  {} as ReturnType<typeof createAuthClient>['signUp'],
  {
    get(_target, prop) {
      const client = getAuthClient();
      const value = client.signUp[prop as keyof typeof client.signUp];
      return typeof value === 'function' ? value.bind(client.signUp) : value;
    },
  }
);

export const signOut = new Proxy(() => {}, {
  get(_target, prop) {
    const client = getAuthClient();
    return (client.signOut as unknown as Record<string, unknown>)[
      prop as string
    ];
  },
  apply(_target, _thisArg, args) {
    const client = getAuthClient();
    return (client.signOut as (...args: unknown[]) => unknown)(...args);
  },
}) as ReturnType<typeof createAuthClient>['signOut'];

export const useSession = new Proxy(() => {}, {
  apply() {
    return getAuthClient().useSession();
  },
}) as ReturnType<typeof createAuthClient>['useSession'];

export const getSession = new Proxy(() => {}, {
  apply() {
    return getAuthClient().getSession();
  },
}) as ReturnType<typeof createAuthClient>['getSession'];

// Type-safe wrapper for isUsernameAvailable plugin method
export async function isUsernameAvailable(username: string): Promise<boolean> {
  const client = getAuthClient() as any;
  if (typeof client.isUsernameAvailable === 'function') {
    return await client.isUsernameAvailable(username);
  }
  throw new Error('isUsernameAvailable plugin not available');
}

export const $Infer = new Proxy({}, {
  get(_target, prop) {
    const client = getAuthClient();
    return (client.$Infer as Record<string, unknown>)[prop as string];
  },
}) as ReturnType<typeof createAuthClient>['$Infer'];

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
    const client = getAuthClient() as any;
    return await client.signIn.magicLink({
      email: identifier,
      callbackURL: callbackURL || '/events',
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
      const client = getAuthClient() as any;
      return await client.signIn.magicLink({
        email,
        callbackURL: callbackURL || '/events',
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
