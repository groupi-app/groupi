// @vitest-environment node
import { afterEach, expect, test, vi } from 'vitest';
import { generateKeyPair, exportJWK, jwtVerify, createLocalJWKSet } from 'jose';
import { createTestInstance } from './test_helpers';
import { createAuthAccount, registerBetterAuth } from './auth.helpers';
import { api } from '../_generated/api';
afterEach(() => vi.unstubAllEnvs());

test('browser authorization requires PKCE and redirects only to local consent for an eligible app', async () => {
  const key = await generateKeyPair('RS256', { extractable: true });
  const privateKey = {
    ...(await exportJWK(key.privateKey)),
    kid: 'test-signing',
    alg: 'RS256',
    use: 'sig',
  };
  vi.stubEnv('DELEGATED_ISSUER', 'https://some.convex.site/oauth');
  vi.stubEnv('DELEGATED_SIGNING_JWKS', JSON.stringify({ keys: [privateKey] }));
  vi.stubEnv(
    'DELEGATED_COOKIE_KEYS',
    JSON.stringify(['test-only-cookie-key-with-at-least-32-characters'])
  );
  vi.stubEnv('SITE_URL', 'https://ui.example');
  const t = createTestInstance();
  registerBetterAuth(t);
  const owner = await createAuthAccount(t, 'delegated-owner');
  const appId = await owner.auth.mutation(
    api.delegatedApps.mutations.registerApp,
    {
      name: 'Calendar',
      purpose: 'View my selected events',
      clientType: 'native',
      redirectUris: ['https://app.example/callback'],
    }
  );
  const url = new URL('https://some.convex.site/oauth/auth');
  url.search = new URLSearchParams({
    client_id: appId,
    redirect_uri: 'https://app.example/callback',
    response_type: 'code',
    scope: 'openid offline_access',
    state: 'client-state',
    nonce: 'client-nonce',
  }).toString();
  const missing = await t.fetch(url.pathname + url.search);
  expect(missing.status).toBe(303);
  expect(
    new URL(missing.headers.get('location')!).searchParams.get('error')
  ).toBe('invalid_request');
  url.searchParams.set(
    'code_challenge',
    'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM'
  );
  url.searchParams.set('code_challenge_method', 'S256');
  const start = await t.fetch(url.pathname + url.search);
  expect(start.status, await start.clone().text()).toBe(303);
  expect(start.headers.get('location')).toMatch(
    /^https:\/\/some\.convex\.site\/oauth\/interaction\//
  );
  const cookies = start.headers
    .getSetCookie()
    .map(value => value.split(';')[0])
    .join('; ');
  const interactionUrl = new URL(start.headers.get('location')!);
  const interaction = await t.fetch(interactionUrl.pathname, {
    headers: { cookie: cookies },
  });
  expect(interaction.status, await interaction.clone().text()).toBe(303);
  const consentUrl = new URL(interaction.headers.get('location')!);
  expect(consentUrl.origin).toBe('https://ui.example');
  const interactionId = consentUrl.searchParams.get('interactionId')!;
  const consent = await owner.auth.query(
    api.delegatedApps.queries.getConsentRequest,
    { interactionId }
  );
  expect(consent).toMatchObject({ requestedActions: [], appName: 'Calendar' });
  const approval = await owner.auth.mutation(
    api.delegatedApps.mutations.approveConsent,
    {
      interactionId,
      actions: [],
      selector: { kind: 'selected', eventIds: [] },
      background: false,
    }
  );
  const approved = await t.fetch(new URL(approval.resumeUrl).pathname, {
    headers: { cookie: cookies },
  });
  expect(approved.status, await approved.clone().text()).toBe(303);
  const resumeUrl = new URL(approved.headers.get('location')!);
  const completed = await t.fetch(resumeUrl.pathname + resumeUrl.search, {
    headers: { cookie: cookies },
  });
  expect(completed.status, await completed.clone().text()).toBe(303);
  const callback = new URL(completed.headers.get('location')!);
  expect(callback.origin).toBe('https://app.example');
  expect(callback.searchParams.get('state')).toBe('client-state');
  const code = callback.searchParams.get('code');
  expect(code).toBeTruthy();
  const exchange = await t.fetch('/oauth/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: appId,
      redirect_uri: 'https://app.example/callback',
      code: code!,
      code_verifier: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
    }).toString(),
  });
  expect(exchange.status, await exchange.clone().text()).toBe(200);
  const tokens = await exchange.json();
  expect(tokens.refresh_token).toBeUndefined();
  expect(tokens.scope).toBe('');
  const identity = await jwtVerify(
    tokens.id_token,
    createLocalJWKSet({
      keys: [
        {
          ...(await exportJWK(key.publicKey)),
          kid: 'test-signing',
          alg: 'RS256',
          use: 'sig',
        },
      ],
    }),
    { issuer: 'https://some.convex.site/oauth', audience: appId }
  );
  expect(identity.payload.sub).not.toBe(owner.personId);
  expect(identity.payload.nonce).toBe('client-nonce');
  expect(identity.payload.name).toBeUndefined();
  expect(identity.payload.email).toBeUndefined();
  expect(tokens.expires_in).toBe(300);
});
