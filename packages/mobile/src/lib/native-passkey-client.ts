import { passkeyClient } from '@better-auth/passkey/client';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

interface PasskeyActionGroups {
  signIn: object;
  passkey: object;
}

export function isNativePasskeyAvailable() {
  if (Platform.OS === 'web') {
    return (
      typeof (globalThis as { PublicKeyCredential?: unknown })
        .PublicKeyCredential !== 'undefined'
    );
  }

  return Boolean(requireOptionalNativeModule('BetterAuthReactNativePasskey'));
}

const unavailableNativePasskeyCeremony = async () => ({
  data: null,
  error: {
    code: 'NATIVE_PASSKEY_UNAVAILABLE',
    message:
      'Passkeys are not available in this build yet. Install the latest version of Groupi and try again.',
    status: 503,
    statusText: 'SERVICE_UNAVAILABLE',
  },
});

export function safelyLoadNativePasskeyClient<T>(loadClient: () => T) {
  try {
    return loadClient();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    console.warn(`Native passkey support could not be loaded: ${message}`);
    return null;
  }
}

export function mergePasskeyActionGroups<
  TBrowser extends PasskeyActionGroups,
  TNative extends Partial<PasskeyActionGroups>,
>(browserActions: TBrowser, nativeActions: TNative) {
  return {
    ...browserActions,
    ...nativeActions,
    signIn: {
      ...browserActions.signIn,
      ...nativeActions.signIn,
    },
    passkey: {
      ...browserActions.passkey,
      ...nativeActions.passkey,
    },
  };
}

/**
 * Uses the platform credential APIs for passkey ceremonies while retaining
 * Better Auth's ordinary list, rename, and delete management actions.
 */
export function nativePasskeyClient() {
  const browserClient = passkeyClient();

  if (Platform.OS === 'web') {
    return browserClient;
  }

  const platformClient = isNativePasskeyAvailable()
    ? safelyLoadNativePasskeyClient(() => {
        // Metro keeps this require inside the guarded runtime path. Older
        // development binaries can therefore continue loading the app when
        // the JavaScript bundle gains this native dependency first.
        /* eslint-disable @typescript-eslint/no-require-imports */
        const passkeyModule =
          require('@lobehub/expo-better-auth-passkey') as typeof import('@lobehub/expo-better-auth-passkey');
        /* eslint-enable @typescript-eslint/no-require-imports */

        return passkeyModule.expoPasskeyClient();
      })
    : null;

  if (!platformClient) {
    // Keep management actions usable in a stale development build, but fail
    // native ceremonies closed instead of invoking browser WebAuthn APIs.
    return {
      ...browserClient,
      getActions: (...args: Parameters<typeof browserClient.getActions>) => {
        const browserActions = browserClient.getActions(...args);

        return mergePasskeyActionGroups(browserActions, {
          signIn: { passkey: unavailableNativePasskeyCeremony },
          passkey: { addPasskey: unavailableNativePasskeyCeremony },
        }) as typeof browserActions;
      },
    };
  }

  return {
    ...platformClient,
    getActions: (...args: Parameters<typeof browserClient.getActions>) => {
      const browserActions = browserClient.getActions(...args);
      const platformActions = platformClient.getActions(...args);

      return mergePasskeyActionGroups(
        browserActions,
        platformActions
      ) as typeof browserActions;
    },
  };
}
