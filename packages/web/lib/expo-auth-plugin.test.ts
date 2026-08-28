// @vitest-environment node

import { expo } from '@better-auth/expo';
import { getTestInstance } from 'better-auth/test';
import { magicLink } from 'better-auth/plugins';
import { describe, expect, it } from 'vitest';

describe('Better Auth Expo server plugin', () => {
  it('proxies native OAuth authorization while preserving state', async () => {
    const { auth } = await getTestInstance(
      {
        plugins: [expo()],
        trustedOrigins: ['groupi://'],
      },
      { disableTestUser: true }
    );
    const authorizationURL =
      'https://accounts.example.test/authorize?client_id=groupi&state=oauth-state';

    const response = await auth.handler(
      new Request(
        `http://localhost:3000/api/auth/expo-authorization-proxy?authorizationURL=${encodeURIComponent(authorizationURL)}`
      )
    );

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe(authorizationURL);
    expect(response.headers.get('set-cookie')).toContain('better-auth.state');
  });

  it('continues to serve ordinary web auth requests with the plugin enabled', async () => {
    const { auth } = await getTestInstance(
      { plugins: [expo()] },
      { disableTestUser: true }
    );

    const response = await auth.handler(
      new Request('http://localhost:3000/api/auth/ok', {
        headers: { origin: 'http://localhost:3000' },
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  it('returns session cookies to a trusted native magic-link callback', async () => {
    let verificationURL = '';
    const { auth } = await getTestInstance(
      {
        plugins: [
          magicLink({
            sendMagicLink: async ({ url }) => {
              verificationURL = url;
            },
          }),
          expo(),
        ],
        trustedOrigins: ['groupi://'],
      },
      { disableTestUser: true }
    );

    const requestResponse = await auth.handler(
      new Request('http://localhost:3000/api/auth/sign-in/magic-link', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          origin: 'http://localhost:3000',
        },
        body: JSON.stringify({
          email: 'native@example.test',
          callbackURL: 'groupi:///callback?returnTo=%2Fnotifications',
        }),
      })
    );

    expect(requestResponse.status).toBe(200);
    expect(verificationURL).not.toBe('');

    const verifyResponse = await auth.handler(new Request(verificationURL));
    const location = new URL(verifyResponse.headers.get('location') ?? '');

    expect(verifyResponse.status).toBe(302);
    expect(location.protocol).toBe('groupi:');
    expect(location.pathname).toBe('/callback');
    expect(location.searchParams.get('returnTo')).toBe('/notifications');
    expect(location.searchParams.get('cookie')).toContain(
      'better-auth.session_token'
    );
  });

  it('leaves an ordinary web callback URL and cookies unchanged', async () => {
    let verificationURL = '';
    const { auth } = await getTestInstance(
      {
        plugins: [
          magicLink({
            sendMagicLink: async ({ url }) => {
              verificationURL = url;
            },
          }),
          expo(),
        ],
      },
      { disableTestUser: true }
    );

    await auth.handler(
      new Request('http://localhost:3000/api/auth/sign-in/magic-link', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          origin: 'http://localhost:3000',
        },
        body: JSON.stringify({
          email: 'web@example.test',
          callbackURL: 'http://localhost:3000/events',
        }),
      })
    );

    const response = await auth.handler(new Request(verificationURL));
    const location = new URL(response.headers.get('location') ?? '');

    expect(response.status).toBe(302);
    expect(location.toString()).toBe('http://localhost:3000/events');
    expect(location.searchParams.has('cookie')).toBe(false);
    expect(response.headers.get('set-cookie')).toContain(
      'better-auth.session_token'
    );
  });
});
