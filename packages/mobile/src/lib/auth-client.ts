import { createAuthClient } from 'better-auth/react';
import { convexClient } from '@convex-dev/better-auth/client/plugins';
import {
  usernameClient,
  magicLinkClient,
  emailOTPClient,
} from 'better-auth/client/plugins';
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
    expoClient({
      scheme: 'groupi',
      storagePrefix: 'groupi',
      storage: SecureStore,
    }),
  ],
});

export const authClient = baseAuthClient;
export const { signIn, signUp, signOut, useSession } = authClient;
