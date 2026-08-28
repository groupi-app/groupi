import * as SecureStore from 'expo-secure-store';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getNativeAuthCallbackPath,
  persistNativeAuthCallbackCookies,
} from './native-auth';

const secureStore = new Map<string, string>();

describe('native Better Auth callbacks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    secureStore.clear();
    vi.mocked(SecureStore.getItem).mockImplementation(
      key => secureStore.get(key) ?? null
    );
    vi.mocked(SecureStore.setItem).mockImplementation((key, value) => {
      secureStore.set(key, value);
    });
  });

  it('retains only an allowlisted in-app return destination', () => {
    expect(getNativeAuthCallbackPath('/invite/invite-token')).toBe(
      '/callback?returnTo=%2Finvite%2Finvite-token'
    );
    expect(getNativeAuthCallbackPath('https://evil.test')).toBe('/callback');
  });

  it('merges session cookies into the Expo client storage format', async () => {
    secureStore.set(
      'groupi_cookie',
      JSON.stringify({
        'better-auth.oauth_state': {
          value: 'state',
          expires: null,
        },
      })
    );

    await persistNativeAuthCallbackCookies(
      'better-auth.session_token=token; Path=/; HttpOnly; SameSite=Lax, better-auth.session_data=data; Path=/; HttpOnly; SameSite=Lax'
    );

    expect(JSON.parse(secureStore.get('groupi_cookie') ?? '{}')).toEqual(
      expect.objectContaining({
        'better-auth.oauth_state': expect.objectContaining({ value: 'state' }),
        'better-auth.session_token': expect.objectContaining({
          value: 'token',
        }),
        'better-auth.session_data': expect.objectContaining({ value: 'data' }),
      })
    );
  });

  it('rejects callbacks without a Better Auth session cookie', async () => {
    await expect(
      persistNativeAuthCallbackCookies('tracking=value; Path=/')
    ).rejects.toThrow('Invalid authentication callback');
    expect(SecureStore.setItem).not.toHaveBeenCalled();
  });

  it('rejects unreasonably large callback payloads', async () => {
    await expect(
      persistNativeAuthCallbackCookies(
        `better-auth.session_token=${'x'.repeat(65_536)}`
      )
    ).rejects.toThrow('Invalid authentication callback');
  });
});
