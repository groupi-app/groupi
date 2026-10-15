import { expect, vi } from 'vitest';
import { generateKeyPair, exportJWK, createLocalJWKSet, SignJWT } from 'jose';
import { createTestInstance, createTestEventWithUser } from './test_helpers';
import { createAuthAccount, registerBetterAuth } from './auth.helpers';
import { api } from '../_generated/api';
import type {
  AuthorizationAction,
  EventSelector,
} from '../authorization/model';
const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
const challenge = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM';
export async function setup(
  options: {
    redirectUri?: string;
    confidential?: boolean;
    issuer?: string;
  } = {}
) {
  const issuer = options.issuer ?? 'https://some.convex.site/oauth';
  const redirectUri = options.redirectUri ?? 'https://app.example/callback';
  const clientKey = options.confidential
    ? await generateKeyPair('RS256', { extractable: true })
    : undefined;
  const key = await generateKeyPair('RS256', { extractable: true });
  vi.stubEnv('DELEGATED_ISSUER', issuer);
  vi.stubEnv(
    'DELEGATED_SIGNING_JWKS',
    JSON.stringify({
      keys: [
        {
          ...(await exportJWK(key.privateKey)),
          kid: 'test-signing',
          alg: 'RS256',
          use: 'sig',
        },
      ],
    })
  );
  vi.stubEnv(
    'DELEGATED_COOKIE_KEYS',
    JSON.stringify(['test-only-cookie-key-with-at-least-32-characters'])
  );
  vi.stubEnv('SITE_URL', 'https://ui.example');
  const t = createTestInstance();
  registerBetterAuth(t);
  const event = await createTestEventWithUser(t);
  const owner = await createAuthAccount(t, 'delegated-owner', event.personId);
  const appId = await owner.auth.mutation(
    api.delegatedApps.mutations.registerApp,
    {
      name: 'Calendar',
      purpose: 'View my selected events',
      clientType: options.confidential ? 'confidential' : 'native',
      redirectUris: [redirectUri],
      ...(clientKey
        ? {
            publicJwks: JSON.stringify({
              keys: [
                {
                  ...(await exportJWK(clientKey.publicKey)),
                  kid: 'client-key',
                  alg: 'RS256',
                  use: 'sig',
                },
              ],
            }),
          }
        : {}),
    }
  );
  const publicKeys = createLocalJWKSet({
    keys: [
      {
        ...(await exportJWK(key.publicKey)),
        kid: 'test-signing',
        alg: 'RS256',
        use: 'sig',
      },
    ],
  });
  async function clientAuthentication() {
    return clientKey
      ? {
          client_id: appId,
          client_assertion_type:
            'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
          client_assertion: await new SignJWT({})
            .setProtectedHeader({ alg: 'RS256', kid: 'client-key' })
            .setIssuer(appId)
            .setSubject(appId)
            .setAudience(`${issuer}/token`)
            .setIssuedAt()
            .setExpirationTime('1m')
            .setJti(crypto.randomUUID())
            .sign(clientKey.privateKey),
        }
      : { client_id: appId };
  }
  return {
    t,
    owner,
    appId,
    event,
    publicKeys,
    redirectUri,
    clientAuthentication,
    issuer,
  };
}
export function authorizationUrl(
  appId: string,
  scopes: string,
  redirectUri = 'https://app.example/callback',
  issuer = 'https://some.convex.site/oauth'
) {
  const url = new URL(`${issuer}/auth`);
  url.search = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes,
    state: 'client-state',
    nonce: 'client-nonce',
    prompt: 'consent',
    code_challenge: challenge,
    code_challenge_method: 'S256',
  }).toString();
  return url;
}
export async function token(
  t: ReturnType<typeof createTestInstance>,
  params: Record<string, string>
) {
  return t.fetch('/oauth/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params).toString(),
  });
}
export async function beginConsent(
  context: Awaited<ReturnType<typeof setup>>,
  scopes: string
) {
  const { t, owner, appId } = context;
  const url = authorizationUrl(
    appId,
    scopes,
    context.redirectUri,
    context.issuer
  );
  const start = await t.fetch(url.pathname + url.search);
  expect(start.status, await start.clone().text()).toBe(303);
  const cookies = start.headers
    .getSetCookie()
    .map(value => value.split(';')[0])
    .join('; ');
  const interaction = await t.fetch(
    new URL(start.headers.get('location')!).pathname,
    { headers: { cookie: cookies } }
  );
  expect(interaction.status, await interaction.clone().text()).toBe(303);
  const consentUrl = new URL(interaction.headers.get('location')!);
  expect(consentUrl.origin).toBe('https://ui.example');
  const interactionId = consentUrl.searchParams.get('interactionId')!;
  const consent = await owner.auth.query(
    api.delegatedApps.queries.getConsentRequest,
    { interactionId }
  );
  expect(consent?.appName).toBe('Calendar');
  return { interactionId, cookies };
}
export async function authorize(
  context: Awaited<ReturnType<typeof setup>>,
  options: {
    scopes: string;
    actions: AuthorizationAction[];
    selector: EventSelector;
    background: boolean;
  }
) {
  const { t, owner } = context;
  const { interactionId, cookies } = await beginConsent(
    context,
    options.scopes
  );
  const approval = await owner.auth.mutation(
    api.delegatedApps.mutations.approveConsent,
    {
      interactionId,
      actions: options.actions,
      selector: options.selector,
      background: options.background,
    }
  );
  const approvalUrl = new URL(approval.resumeUrl);
  const approved = await t.fetch(approvalUrl.pathname + approvalUrl.search, {
    headers: { cookie: cookies },
  });
  expect(approved.status, await approved.clone().text()).toBe(303);
  const resumeUrl = new URL(approved.headers.get('location')!);
  const completed = await t.fetch(resumeUrl.pathname + resumeUrl.search, {
    headers: { cookie: cookies },
  });
  expect(completed.status, await completed.clone().text()).toBe(303);
  const callback = new URL(completed.headers.get('location')!);
  expect(callback.protocol).toBe(new URL(context.redirectUri).protocol);
  expect(callback.hostname).toBe(new URL(context.redirectUri).hostname);
  expect(callback.pathname).toBe(new URL(context.redirectUri).pathname);
  expect(callback.searchParams.get('state')).toBe('client-state');
  const code = callback.searchParams.get('code')!;
  expect(code).toBeTruthy();
  return { code, interactionId };
}
export function exchange(
  appId: string,
  code: string,
  redirectUri = 'https://app.example/callback'
) {
  return {
    grant_type: 'authorization_code',
    client_id: appId,
    redirect_uri: redirectUri,
    code,
    code_verifier: verifier,
  };
}
