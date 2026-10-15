import { afterAll, expect, test, vi } from 'vitest';
const delivery = vi.hoisted(() => {
  vi.stubEnv('RESEND_API_KEY', 'isolated-test-key');
  vi.stubEnv('SITE_URL', 'https://ui.example');
  return { send: vi.fn().mockResolvedValue({ error: null }) };
});
vi.mock('resend', () => ({
  Resend: class {
    emails = { send: delivery.send };
  },
}));
import { betterAuth } from 'better-auth/minimal';
import { api } from '../_generated/api';
import { createAuth, createAuthOptions } from '../auth';
import { createTestInstance } from './test_helpers';
import { createAuthAccount, registerBetterAuth } from './auth.helpers';
afterAll(() => vi.unstubAllEnvs());

test('the hosted auth HTTP boundary sends a real one-use link and creates a minimal new account', async () => {
  const t = createTestInstance();
  registerBetterAuth(t);
  const owner = await createAuthAccount(t, 'hosted-brand-owner');
  const appId = await owner.auth.mutation(
    api.delegatedApps.mutations.registerApp,
    {
      name: 'Red Room',
      purpose: 'Hosted community sign-in',
      clientType: 'native',
      redirectUris: ['https://redroom.example/callback'],
    }
  );
  await t.run(async ctx => {
    await ctx.db.patch(appId, {
      status: 'approved',
      appearance: {
        brandName: 'Red Room',
        senderName: 'Red Room',
        accent: '#991b1b',
      },
    });
    await ctx.db.insert('delegatedConsentRequests', {
      interactionId: 'trusted',
      appId,
      instanceId: 'https://issuer.example/oauth',
      requestedScopes: ['openid'],
      expiresAt: Date.now() + 60000,
    });
  });
  const request = async (input: Request) =>
    t.run(async ctx => {
      const response = await createAuth(ctx).handler(input);
      return {
        status: response.status,
        location: response.headers.get('location'),
        cookie: response.headers.get('set-cookie'),
        body: await response.text(),
      };
    });
  const response = await request(
    new Request('https://ui.example/api/auth/sign-in/magic-link', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'https://ui.example',
      },
      body: JSON.stringify({
        email: 'new-visitor@example.test',
        errorCallbackURL:
          '/sign-in?redirect=%252Foauth%252Fconsent%253FinteractionId%253Dtrusted',
        callbackURL:
          '/onboarding?redirect=%252Foauth%252Fconsent%253FinteractionId%253Dtrusted',
      }),
    })
  );
  expect(response.status).toBe(200);
  expect(delivery.send).toHaveBeenCalledOnce();
  const message = delivery.send.mock.calls[0][0];
  expect(message.subject).toBe('Sign in to Red Room');
  expect(message.from).toBe('Red Room <noreply@groupi.gg>');
  const link = message.html
    .match(/href="([^"]+)"/)?.[1]
    .replaceAll('&amp;', '&');
  expect(link).toBeTruthy();
  const verified = await request(new Request(link));
  expect(verified.status).toBe(302);
  expect(verified.location).toContain('/onboarding?redirect=');
  expect(verified.cookie).toContain('session_token');
  const reused = await request(new Request(link));
  expect(reused.location).toContain('error=INVALID_TOKEN');
  const recovery = new URL(reused.location!);
  expect(recovery.origin + recovery.pathname).toBe(
    'https://ui.example/sign-in'
  );
  expect(recovery.searchParams.get('redirect')).toBe(
    '/oauth/consent?interactionId=trusted'
  );
});

test('social identity linking requires an explicit action from the existing account', async () => {
  const t = createTestInstance();
  registerBetterAuth(t);
  await createAuthAccount(t, 'existing-visitor');
  const request = async (input: Request) =>
    t.run(async ctx => {
      const options = createAuthOptions(ctx);
      const auth = betterAuth({
        ...options,
        socialProviders: {
          google: {
            clientId: 'isolated-client',
            clientSecret: 'isolated-secret',
            getUserInfo: async () => ({
              user: {
                id: 'other-provider-subject',
                name: 'Other identity',
                email: 'existing-visitor@example.com',
                emailVerified: true,
              },
              data: {},
            }),
          },
        },
      });
      const response = await auth.handler(input);
      return {
        status: response.status,
        location: response.headers.get('location'),
        cookie: response.headers.get('set-cookie'),
        body: await response.text(),
      };
    });
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation(
      async () =>
        new Response(
          JSON.stringify({
            access_token: 'isolated-access',
            token_type: 'Bearer',
            expires_in: 3600,
          }),
          { headers: { 'content-type': 'application/json' } }
        )
    )
  );
  try {
    const start = await request(
      new Request('https://ui.example/api/auth/sign-in/social', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          origin: 'https://ui.example',
        },
        body: JSON.stringify({
          provider: 'google',
          callbackURL: '/oauth/consent?interactionId=trusted',
        }),
      })
    );
    const url = new URL(JSON.parse(start.body).url);
    const callback = new URL('https://ui.example/api/auth/callback/google');
    callback.searchParams.set('code', 'isolated-code');
    callback.searchParams.set('state', url.searchParams.get('state')!);
    const result = await request(
      new Request(callback, { headers: { cookie: start.cookie ?? '' } })
    );
    expect(result.location).toContain('error=account_not_linked');
    // Linking is a separate action from a verified existing session.
    await request(
      new Request('https://ui.example/api/auth/sign-in/magic-link', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          origin: 'https://ui.example',
        },
        body: JSON.stringify({
          email: 'existing-visitor@example.com',
          callbackURL: '/settings/account',
        }),
      })
    );
    const loginLink = delivery.send.mock.calls
      .at(-1)![0]
      .html.match(/href="([^"]+)"/)[1]
      .replaceAll('&amp;', '&');
    const signedIn = await request(new Request(loginLink));
    const explicit = await request(
      new Request('https://ui.example/api/auth/link-social', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          origin: 'https://ui.example',
          cookie: signedIn.cookie ?? '',
        },
        body: JSON.stringify({
          provider: 'google',
          callbackURL: '/settings/account',
        }),
      })
    );
    expect(explicit.status).toBe(200);
    const explicitUrl = new URL(JSON.parse(explicit.body).url);
    callback.searchParams.set('state', explicitUrl.searchParams.get('state')!);
    const linked = await request(
      new Request(callback, {
        headers: { cookie: `${signedIn.cookie}; ${explicit.cookie}` },
      })
    );
    expect(linked.location).toBe('/settings/account');
    const accounts = await request(
      new Request('https://ui.example/api/auth/list-accounts', {
        headers: { cookie: signedIn.cookie ?? '' },
      })
    );
    expect(JSON.parse(accounts.body)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          providerId: 'google',
          accountId: 'other-provider-subject',
        }),
      ])
    );
  } finally {
    vi.unstubAllGlobals();
  }
});

test('an expired email link cannot create a session and returns to the exact hosted recovery', async () => {
  const t = createTestInstance();
  registerBetterAuth(t);
  const request = async (input: Request) =>
    t.run(async ctx => {
      const response = await createAuth(ctx).handler(input);
      return {
        status: response.status,
        location: response.headers.get('location'),
        cookie: response.headers.get('set-cookie'),
      };
    });
  await request(
    new Request('https://ui.example/api/auth/sign-in/magic-link', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'https://ui.example',
      },
      body: JSON.stringify({
        email: 'expired-visitor@example.test',
        callbackURL: '/onboarding',
        errorCallbackURL:
          '/sign-in?redirect=%252Foauth%252Fconsent%253FinteractionId%253Dtrusted',
      }),
    })
  );
  const link = delivery.send.mock.calls
    .at(-1)![0]
    .html.match(/href="([^"]+)"/)[1]
    .replaceAll('&amp;', '&');
  vi.useFakeTimers({ toFake: ['Date'] });
  try {
    vi.setSystemTime(Date.now() + 300001);
    const expired = await request(new Request(link));
    const recovery = new URL(expired.location!);
    expect(recovery.pathname).toBe('/sign-in');
    expect(recovery.searchParams.get('error')).toBe('INVALID_TOKEN');
    expect(recovery.searchParams.get('redirect')).toBe(
      '/oauth/consent?interactionId=trusted'
    );
    expect(expired.cookie).toBeNull();
  } finally {
    vi.useRealTimers();
  }
});

test('unavailable email delivery does not acknowledge a successful sign-in email', async () => {
  const t = createTestInstance();
  registerBetterAuth(t);
  delivery.send.mockResolvedValueOnce({
    error: { message: 'Isolated provider unavailable' },
  });
  const result = await t.run(async ctx => {
    const response = await createAuth(ctx).handler(
      new Request('https://ui.example/api/auth/sign-in/magic-link', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          origin: 'https://ui.example',
        },
        body: JSON.stringify({
          email: 'unavailable-visitor@example.test',
          callbackURL: '/onboarding',
        }),
      })
    );
    return { status: response.status, body: await response.text() };
  });
  expect(result.status).toBe(500);
  expect(result.body).not.toContain('"status":true');
});
