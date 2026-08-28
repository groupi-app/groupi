import { beforeEach, describe, expect, it, vi } from 'vitest';
import { passkeyClient } from '@better-auth/passkey/client';

vi.mock('@better-auth/passkey/client', () => ({
  passkeyClient: vi.fn(),
}));

vi.mock('@lobehub/expo-better-auth-passkey', () => ({
  expoPasskeyClient: vi.fn(),
}));

vi.mock('expo-modules-core', () => ({
  requireOptionalNativeModule: vi.fn(() => null),
}));

import {
  isNativePasskeyAvailable,
  mergePasskeyActionGroups,
  nativePasskeyClient,
  safelyLoadNativePasskeyClient,
} from './native-passkey-client';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('isNativePasskeyAvailable', () => {
  it('reports a stale native build without the credential module', () => {
    expect(isNativePasskeyAvailable()).toBe(false);
  });
});

describe('safelyLoadNativePasskeyClient', () => {
  it('keeps stale native builds from crashing when the module load fails', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    expect(
      safelyLoadNativePasskeyClient(() => {
        throw new Error(
          "Cannot find native module 'BetterAuthReactNativePasskey'"
        );
      })
    ).toBeNull();
    expect(warn).toHaveBeenCalledWith(
      "Native passkey support could not be loaded: Cannot find native module 'BetterAuthReactNativePasskey'"
    );

    warn.mockRestore();
  });
});

describe('mergePasskeyActionGroups', () => {
  it('uses native ceremonies without losing passkey management actions', () => {
    const listUserPasskeys = vi.fn();
    const deletePasskey = vi.fn();
    const updatePasskey = vi.fn();
    const browserAddPasskey = vi.fn();
    const browserSignIn = vi.fn();
    const nativeAddPasskey = vi.fn();
    const nativeSignIn = vi.fn();

    const actions = mergePasskeyActionGroups(
      {
        signIn: { passkey: browserSignIn },
        passkey: {
          addPasskey: browserAddPasskey,
          listUserPasskeys,
          deletePasskey,
          updatePasskey,
        },
      },
      {
        signIn: { passkey: nativeSignIn },
        passkey: { addPasskey: nativeAddPasskey },
      }
    );

    expect(actions.signIn.passkey).toBe(nativeSignIn);
    expect(actions.passkey.addPasskey).toBe(nativeAddPasskey);
    expect(actions.passkey.listUserPasskeys).toBe(listUserPasskeys);
    expect(actions.passkey.deletePasskey).toBe(deletePasskey);
    expect(actions.passkey.updatePasskey).toBe(updatePasskey);
  });
});

describe('nativePasskeyClient', () => {
  it('fails native ceremonies closed in a stale binary', async () => {
    const listUserPasskeys = vi.fn();
    vi.mocked(passkeyClient).mockReturnValue({
      id: 'passkey',
      $InferServerPlugin: {},
      getActions: vi.fn(() => ({
        signIn: { passkey: vi.fn() },
        passkey: {
          addPasskey: vi.fn(),
          listUserPasskeys,
          deletePasskey: vi.fn(),
          updatePasskey: vi.fn(),
        },
      })),
    } as unknown as ReturnType<typeof passkeyClient>);

    const client = nativePasskeyClient();
    const actions = client.getActions({} as never, {} as never) as unknown as {
      signIn: {
        passkey: () => Promise<{ error?: { code?: string } }>;
      };
      passkey: {
        addPasskey: () => Promise<{ error?: { code?: string } }>;
        listUserPasskeys: typeof listUserPasskeys;
      };
    };
    const signInResult = await actions.signIn.passkey();
    const registerResult = await actions.passkey.addPasskey();

    expect(signInResult.error?.code).toBe('NATIVE_PASSKEY_UNAVAILABLE');
    expect(registerResult.error?.code).toBe('NATIVE_PASSKEY_UNAVAILABLE');
    expect(actions.passkey.listUserPasskeys).toBe(listUserPasskeys);
  });
});
