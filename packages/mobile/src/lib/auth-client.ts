import { createAuthClient } from 'better-auth/react';
import { convexClient } from '@convex-dev/better-auth/client/plugins';
import {
  usernameClient,
  magicLinkClient,
  emailOTPClient,
} from 'better-auth/client/plugins';
import { apiKeyClient } from '@better-auth/api-key/client';
import { passkeyClient } from '@better-auth/passkey/client';
import { expoClient } from '@better-auth/expo/client';
import * as SecureStore from 'expo-secure-store';

const baseURL = process.env.EXPO_PUBLIC_BETTER_AUTH_URL;

if (!baseURL) {
  console.warn(
    'Missing EXPO_PUBLIC_BETTER_AUTH_URL - OAuth and magic link will not work. ' +
      'Set it to your web app URL (e.g. http://localhost:3000).'
  );
}

const baseAuthClient = createAuthClient({
  baseURL: baseURL || undefined,
  plugins: [
    convexClient(),
    usernameClient(),
    magicLinkClient(),
    emailOTPClient(),
    apiKeyClient(),
    passkeyClient(),
    expoClient({
      scheme: 'groupi',
      storagePrefix: 'groupi',
      storage: SecureStore,
    }),
  ],
});

// Type-assert to include plugin methods that TypeScript can't infer
export const authClient = baseAuthClient as typeof baseAuthClient & {
  emailOtp: {
    sendVerificationOtp: (options: {
      email: string;
      type: 'sign-in' | 'email-verification' | 'forget-password';
    }) => Promise<{ error?: { message: string } }>;
  };
  signIn: typeof baseAuthClient.signIn & {
    magicLink: (options: {
      email: string;
      callbackURL?: string;
    }) => Promise<{ error?: { message: string } }>;
  };
  apiKey: {
    list: () => Promise<{
      data?: {
        apiKeys: Array<{
          id: string;
          name?: string | null;
          start?: string | null;
          createdAt: Date;
          expiresAt?: Date | null;
        }>;
      };
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

export const { signIn, signUp, signOut, useSession } = authClient;
