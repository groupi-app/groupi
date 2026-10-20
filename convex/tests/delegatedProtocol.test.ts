// @vitest-environment node
import { afterEach, expect, test, vi } from 'vitest';
import { jwtVerify } from 'jose';
import { api, internal } from '../_generated/api';
import {
  setup,
  beginConsent,
  authorize,
  authorizationUrl,
  token,
  exchange,
} from './delegated-protocol.helpers';
afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

test('browser consent and S256 exchange produce only a signed app-specific identity when no identity fields or API actions are approved', async () => {
  const context = await setup();
  const { t, appId, owner, publicKeys } = context;
  const missingUrl = authorizationUrl(appId, 'openid');
  missingUrl.searchParams.delete('code_challenge');
  missingUrl.searchParams.delete('code_challenge_method');
  const missing = await t.fetch(missingUrl.pathname + missingUrl.search);
  expect(missing.status).toBe(303);
  expect(
    new URL(missing.headers.get('location')!).searchParams.get('error')
  ).toBe('invalid_request');
  const { code } = await authorize(context, {
    scopes: 'openid',
    actions: [],
    selector: { kind: 'selected', eventIds: [] },
    background: false,
  });
  const response = await token(t, exchange(appId, code));
  expect(response.status, await response.clone().text()).toBe(200);
  const tokens = await response.json();
  expect(tokens.refresh_token).toBeUndefined();
  expect(tokens.scope).toBe('');
  expect(tokens.expires_in).toBe(300);
  const identity = await jwtVerify(tokens.id_token, publicKeys, {
    issuer: 'https://some.convex.site/oauth',
    audience: appId,
  });
  expect(identity.payload.sub).not.toBe(owner.personId);
  expect(identity.payload.nonce).toBe('client-nonce');
  expect(identity.payload.name).toBeUndefined();
  expect(identity.payload.email).toBeUndefined();
  await expect(
    jwtVerify(tokens.id_token, publicKeys, {
      issuer: 'https://wrong-instance.example/oauth',
      audience: appId,
    })
  ).rejects.toThrow();
  await expect(
    jwtVerify(tokens.id_token, publicKeys, {
      issuer: 'https://some.convex.site/oauth',
      audience: 'wrong-app',
    })
  ).rejects.toThrow();
});

test('background refresh preserves selected API access and disconnect denies both existing access and renewal', async () => {
  const context = await setup();
  const { t, appId, owner, event } = context;
  const { code } = await authorize(context, {
    scopes: 'openid events.read offline_access',
    actions: ['events.read'],
    selector: { kind: 'selected', eventIds: [event.eventId] },
    background: true,
  });
  const exchanged = await token(t, exchange(appId, code));
  expect(exchanged.status, await exchanged.clone().text()).toBe(200);
  const initial = await exchanged.json();
  expect(initial.refresh_token).toBeTypeOf('string');
  expect(initial.scope).toBe('events.read');
  const permitted = await t.fetch(`/api/v2/events/${event.eventId}`, {
    headers: { authorization: `Bearer ${initial.access_token}` },
  });
  expect(permitted.status, await permitted.clone().text()).toBe(200);
  const expanded = await token(t, {
    grant_type: 'refresh_token',
    client_id: appId,
    refresh_token: initial.refresh_token,
    scope: 'events.read events.update',
  });
  expect(expanded.status).toBe(400);
  expect(await expanded.json()).toMatchObject({ error: 'invalid_scope' });
  const renewed = await token(t, {
    grant_type: 'refresh_token',
    client_id: appId,
    refresh_token: initial.refresh_token,
  });
  expect(renewed.status, await renewed.clone().text()).toBe(200);
  const current = await renewed.json();
  expect(current.scope).toBe('events.read');
  expect(current.refresh_token).not.toBe(initial.refresh_token);
  const connections = await owner.auth.query(
    api.delegatedApps.queries.listConnections,
    { now: Date.now() }
  );
  expect(connections).toMatchObject([
    {
      actions: ['events.read'],
      background: true,
      selector: { kind: 'selected', eventIds: [event.eventId] },
    },
  ]);
  await owner.auth.mutation(api.delegatedApps.mutations.disconnect, {
    grantId: connections[0].grantId,
  });
  const revoked = await t.fetch(`/api/v2/events/${event.eventId}`, {
    headers: { authorization: `Bearer ${current.access_token}` },
  });
  expect(revoked.status).toBe(401);
  const renewal = await token(t, {
    grant_type: 'refresh_token',
    client_id: appId,
    refresh_token: current.refresh_token,
  });
  expect(renewal.status).toBe(400);
  expect(await renewal.json()).toMatchObject({ error: 'invalid_grant' });
});

test('refresh scope narrowing is rejected without consuming the original bounded refresh token', async () => {
  const context = await setup();
  const { t, appId, event } = context;
  const { code } = await authorize(context, {
    scopes: 'openid events.read events.update offline_access',
    actions: ['events.read', 'events.update'],
    selector: { kind: 'selected', eventIds: [event.eventId] },
    background: true,
  });
  const initial = await (await token(t, exchange(appId, code))).json();
  const narrowed = await token(t, {
    grant_type: 'refresh_token',
    client_id: appId,
    refresh_token: initial.refresh_token,
    scope: 'events.read',
  });
  expect(narrowed.status).toBe(400);
  expect(await narrowed.json()).toMatchObject({ error: 'invalid_scope' });
  const unchanged = await token(t, {
    grant_type: 'refresh_token',
    client_id: appId,
    refresh_token: initial.refresh_token,
  });
  expect(unchanged.status, await unchanged.clone().text()).toBe(200);
  expect((await unchanged.json()).scope).toBe('events.read events.update');
});

test('refresh replay and concurrent redemption invalidate every descendant bearer', async () => {
  const context = await setup();
  const { t, appId, event } = context;
  const { code } = await authorize(context, {
    scopes: 'openid events.read offline_access',
    actions: ['events.read'],
    selector: { kind: 'selected', eventIds: [event.eventId] },
    background: true,
  });
  const initial = await (await token(t, exchange(appId, code))).json();
  const params = {
    grant_type: 'refresh_token',
    client_id: appId,
    refresh_token: initial.refresh_token,
  };
  const results = await Promise.all([token(t, params), token(t, params)]);
  expect(
    results.filter(result => result.status === 200).length
  ).toBeLessThanOrEqual(1);
  expect(results.some(result => result.status === 400)).toBe(true);
  for (const result of results) {
    if (result.status === 200) {
      const issued = await result.json();
      const request = await t.fetch(`/api/v2/events/${event.eventId}`, {
        headers: { authorization: `Bearer ${issued.access_token}` },
      });
      expect(request.status).toBe(401);
    } else
      expect(await result.json()).toMatchObject({ error: 'invalid_grant' });
  }
  const replay = await token(t, params);
  expect(replay.status).toBe(400);
  expect(await replay.json()).toMatchObject({ error: 'invalid_grant' });
  const original = await t.fetch(`/api/v2/events/${event.eventId}`, {
    headers: { authorization: `Bearer ${initial.access_token}` },
  });
  expect(original.status).toBe(401);
});

test('a transferred consent link cannot approve the attacker browser authorization request', async () => {
  const { t, owner, appId } = await setup();
  const url = authorizationUrl(appId, 'openid events.read');
  const attackerStart = await t.fetch(url.pathname + url.search);
  const attackerCookies = attackerStart.headers
    .getSetCookie()
    .map(value => value.split(';')[0])
    .join('; ');
  const attackerInteraction = new URL(attackerStart.headers.get('location')!);
  const landing = await t.fetch(attackerInteraction.pathname, {
    headers: { cookie: attackerCookies },
  });
  const sharedConsent = new URL(landing.headers.get('location')!);
  const interactionId = sharedConsent.searchParams.get('interactionId')!;
  const victimApproval = await owner.auth.mutation(
    api.delegatedApps.mutations.approveConsent,
    {
      interactionId,
      actions: [],
      selector: { kind: 'selected', eventIds: [] },
      background: false,
    }
  );
  const victimUrl = new URL(victimApproval.resumeUrl);
  const victimResume = await t.fetch(victimUrl.pathname + victimUrl.search);
  expect(victimResume.status).toBe(400);
  const attackerResume = await t.fetch(attackerInteraction.pathname, {
    headers: { cookie: attackerCookies },
  });
  expect(attackerResume.status).toBe(303);
  expect(new URL(attackerResume.headers.get('location')!).origin).toBe(
    'https://ui.example'
  );
  expect(
    await owner.auth.query(api.delegatedApps.queries.listConnections, {
      now: Date.now(),
    })
  ).toEqual([]);
});

test('native private-use callbacks exchange with exact redirect and S256 while mismatches fail closed', async () => {
  const context = await setup({
    redirectUri: 'com.example.calendar:/callback',
  });
  const options = {
    scopes: 'openid',
    actions: [],
    selector: { kind: 'selected' as const, eventIds: [] },
    background: false,
  };
  const first = await authorize(context, options);
  const wrong = await token(context.t, {
    ...exchange(context.appId, first.code, context.redirectUri),
    redirect_uri: 'com.example.calendar:/other',
  });
  expect(wrong.status).toBe(400);
  expect(await wrong.json()).toMatchObject({ error: 'invalid_grant' });
  const second = await authorize(context, options);
  const badVerifier = await token(context.t, {
    ...exchange(context.appId, second.code, context.redirectUri),
    code_verifier: 'a'.repeat(43),
  });
  expect(badVerifier.status).toBe(400);
  expect(await badVerifier.json()).toMatchObject({ error: 'invalid_grant' });
  const third = await authorize(context, options);
  const good = await token(
    context.t,
    exchange(context.appId, third.code, context.redirectUri)
  );
  expect(good.status, await good.clone().text()).toBe(200);
});

test('confidential web clients authenticate with inline public keys and reject missing assertions', async () => {
  const context = await setup({ confidential: true });
  const first = await authorize(context, {
    scopes: 'openid',
    actions: [],
    selector: { kind: 'selected', eventIds: [] },
    background: false,
  });
  const missing = await token(context.t, exchange(context.appId, first.code));
  expect(missing.status).toBe(401);
  expect(await missing.json()).toMatchObject({ error: 'invalid_client' });
  const exchanged = await token(context.t, {
    ...exchange(context.appId, first.code),
    ...(await context.clientAuthentication()),
  });
  expect(exchanged.status, await exchanged.clone().text()).toBe(200);
});

test('Connected Apps reports the grant as expired at its expiry and keeps disconnect available', async () => {
  const context = await setup();
  const { code } = await authorize(context, {
    scopes: 'openid',
    actions: [],
    selector: { kind: 'selected', eventIds: [] },
    background: false,
  });
  expect((await token(context.t, exchange(context.appId, code))).status).toBe(
    200
  );
  const current = await context.owner.auth.query(
    api.delegatedApps.queries.listConnections,
    { now: Date.now() }
  );
  expect(current[0].status).toBe('active');
  const expired = await context.owner.auth.query(
    api.delegatedApps.queries.listConnections,
    { now: current[0].expiresAt! }
  );
  expect(expired[0].status).toBe('expired');
  await context.owner.auth.mutation(api.delegatedApps.mutations.disconnect, {
    grantId: expired[0].grantId,
  });
  expect(
    await context.owner.auth.query(api.delegatedApps.queries.listConnections, {
      now: current[0].expiresAt!,
    })
  ).toMatchObject([{ status: 'revoked' }]);
});

test('two apps on one callback host receive different subjects and delegated identity never exposes global profile identifiers', async () => {
  const context = await setup();
  const app2 = await context.owner.auth.mutation(
    api.delegatedApps.mutations.registerApp,
    {
      name: 'Calendar',
      purpose: 'Identity only',
      clientType: 'native',
      redirectUris: [context.redirectUri],
    }
  );
  const options = {
    scopes: 'openid identity.display-name',
    actions: ['identity.display-name' as const],
    selector: { kind: 'selected' as const, eventIds: [] },
    background: false,
  };
  const first = await authorize(context, options);
  const firstTokens = await (
    await token(context.t, exchange(context.appId, first.code))
  ).json();
  const second = await authorize({ ...context, appId: app2 }, options);
  const secondTokens = await (
    await token(context.t, exchange(app2, second.code))
  ).json();
  const one = await jwtVerify(firstTokens.id_token, context.publicKeys, {
    issuer: context.issuer,
    audience: context.appId,
  });
  const two = await jwtVerify(secondTokens.id_token, context.publicKeys, {
    issuer: context.issuer,
    audience: app2,
  });
  expect(one.payload.sub).not.toBe(two.payload.sub);
  expect(one.payload.name).toBe('delegated-owner');
  expect(one.payload.email).toBeUndefined();
  const globalProfile = await context.t.fetch('/api/v2/profile', {
    headers: { authorization: `Bearer ${firstTokens.access_token}` },
  });
  expect(globalProfile.status).toBe(403);
});

test('approval tickets expire and do not create a grant when browser confirmation arrives late', async () => {
  const context = await setup();
  const pending = await beginConsent(context, 'openid');
  const approval = await context.owner.auth.mutation(
    api.delegatedApps.mutations.approveConsent,
    {
      interactionId: pending.interactionId,
      actions: [],
      selector: { kind: 'selected', eventIds: [] },
      background: false,
    }
  );
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(Date.now() + 61000);
  const url = new URL(approval.resumeUrl);
  const result = await context.t.fetch(url.pathname + url.search, {
    headers: { cookie: pending.cookies },
  });
  expect(result.status).toBe(400);
  expect(
    await context.owner.auth.query(api.delegatedApps.queries.listConnections, {
      now: Date.now(),
    })
  ).toEqual([]);
});

test('concurrent approval-ticket finalization creates one connection and consumes the ticket', async () => {
  const context = await setup();
  const pending = await beginConsent(context, 'openid');
  const approval = await context.owner.auth.mutation(
    api.delegatedApps.mutations.approveConsent,
    {
      interactionId: pending.interactionId,
      actions: [],
      selector: { kind: 'selected', eventIds: [] },
      background: false,
    }
  );
  const url = new URL(approval.resumeUrl);
  const results = await Promise.all([
    context.t.fetch(url.pathname + url.search, {
      headers: { cookie: pending.cookies },
    }),
    context.t.fetch(url.pathname + url.search, {
      headers: { cookie: pending.cookies },
    }),
  ]);
  expect(results.map(result => result.status).sort()).toEqual([303, 400]);
  expect(
    await context.owner.auth.query(api.delegatedApps.queries.listConnections, {
      now: Date.now(),
    })
  ).toHaveLength(1);
  const replay = await context.t.fetch(url.pathname + url.search, {
    headers: { cookie: pending.cookies },
  });
  expect(replay.status).toBe(400);
});

test('authorization codes are one-use and expire after sixty seconds', async () => {
  const context = await setup();
  const options = {
    scopes: 'openid',
    actions: [],
    selector: { kind: 'selected' as const, eventIds: [] },
    background: false,
  };
  const first = await authorize(context, options);
  const redeemed = await token(context.t, exchange(context.appId, first.code));
  expect(redeemed.status).toBe(200);
  const replay = await token(context.t, exchange(context.appId, first.code));
  expect(replay.status).toBe(400);
  expect(await replay.json()).toMatchObject({ error: 'invalid_grant' });
  const second = await authorize(context, options);
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(Date.now() + 61000);
  const expired = await token(context.t, exchange(context.appId, second.code));
  expect(expired.status).toBe(400);
  expect(await expired.json()).toMatchObject({ error: 'invalid_grant' });
});

test('a browser with an existing issuer session can consent again without losing its session', async () => {
  const context = await setup();
  const { t, owner, appId, publicKeys } = context;
  const cookiePairs = (response: Response) =>
    response.headers.getSetCookie().map(value => value.split(';')[0]);
  async function finish(interactionId: string, cookies: string) {
    const approval = await owner.auth.mutation(
      api.delegatedApps.mutations.approveConsent,
      {
        interactionId,
        actions: [],
        selector: { kind: 'selected', eventIds: [] },
        background: false,
      }
    );
    const approvedUrl = new URL(approval.resumeUrl);
    const approved = await t.fetch(approvedUrl.pathname + approvedUrl.search, {
      headers: { cookie: cookies },
    });
    expect(approved.status).toBe(303);
    const resume = new URL(approved.headers.get('location')!);
    const completed = await t.fetch(resume.pathname + resume.search, {
      headers: { cookie: cookies },
    });
    expect(completed.status).toBe(303);
    const callback = new URL(completed.headers.get('location')!);
    expect(callback.origin + callback.pathname).toBe(context.redirectUri);
    const code = callback.searchParams.get('code');
    expect(code).toBeTruthy();
    const exchanged = await token(t, exchange(appId, code!));
    expect(exchanged.status, await exchanged.clone().text()).toBe(200);
    const identity = await jwtVerify(
      (await exchanged.json()).id_token,
      publicKeys,
      { issuer: context.issuer, audience: appId }
    );
    return { completed, subject: identity.payload.sub };
  }
  const initial = await beginConsent(context, 'openid');
  const first = await finish(initial.interactionId, initial.cookies);
  // Upgrade fixture: existing sessions were saved before the UID index existed.
  await t.run(async ctx => {
    const rows = await ctx.db
      .query('delegatedArtifacts')
      .withIndex('by_model_and_key', q => q.eq('model', 'Session'))
      .collect();
    for (const row of rows)
      await ctx.db.patch(row._id, { sessionUidHash: undefined });
  });
  async function migrateLegacySessions() {
    let cursor: string | null = null;
    let updated = 0;
    for (;;) {
      const page = await t.mutation(
        internal.delegatedApps.storage.backfillSessionUidHashes,
        {
          paginationOpts: { cursor, numItems: 1 },
        }
      );
      updated += page.updated;
      if (page.isDone) return updated;
      cursor = page.continueCursor;
    }
  }
  expect(await migrateLegacySessions()).toBe(1);
  expect(await migrateLegacySessions()).toBe(0);
  const sessionCookies = cookiePairs(first.completed)
    .filter(
      cookie =>
        cookie.startsWith('_session=') || cookie.startsWith('_session.sig=')
    )
    .join('; ');
  expect(sessionCookies).toContain('_session=');
  const nextUrl = authorizationUrl(appId, 'openid');
  const nextStart = await t.fetch(nextUrl.pathname + nextUrl.search, {
    headers: { cookie: sessionCookies },
  });
  expect(nextStart.status).toBe(303);
  const cookies = [sessionCookies, ...cookiePairs(nextStart)].join('; ');
  const interactionUrl = new URL(nextStart.headers.get('location')!);
  const nextInteraction = await t.fetch(interactionUrl.pathname, {
    headers: { cookie: cookies, accept: 'text/html' },
  });
  expect(nextInteraction.status).toBe(303);
  const hosted = new URL(nextInteraction.headers.get('location')!);
  expect(hosted.origin + hosted.pathname).toBe(
    'https://ui.example/oauth/consent'
  );
  const interactionId = hosted.searchParams.get('interactionId')!;
  expect(
    await owner.auth.query(api.delegatedApps.queries.getConsentRequest, {
      interactionId,
    })
  ).toMatchObject({ appName: 'Calendar' });
  const second = await finish(interactionId, cookies);
  expect(second.subject).toBe(first.subject);
  // A session that expires after a new interaction starts must not be revived by UID lookup.
  const latestSessionCookies = cookiePairs(second.completed)
    .filter(
      cookie =>
        cookie.startsWith('_session=') || cookie.startsWith('_session.sig=')
    )
    .join('; ');
  const thirdStart = await t.fetch(nextUrl.pathname + nextUrl.search, {
    headers: { cookie: latestSessionCookies || sessionCookies },
  });
  expect(thirdStart.status).toBe(303);
  const thirdCookies = [
    latestSessionCookies || sessionCookies,
    ...cookiePairs(thirdStart),
  ].join('; ');
  await t.run(async ctx => {
    const rows = await ctx.db
      .query('delegatedArtifacts')
      .withIndex('by_model_and_key', q => q.eq('model', 'Session'))
      .collect();
    for (const row of rows)
      await ctx.db.patch(row._id, { expiresAt: Date.now() - 1 });
  });
  const thirdUrl = new URL(thirdStart.headers.get('location')!);
  const expired = await t.fetch(thirdUrl.pathname, {
    headers: { cookie: thirdCookies, accept: 'text/html' },
  });
  expect(expired.status).toBe(303);
  const recovery = new URL(expired.headers.get('location')!);
  expect(recovery.origin + recovery.pathname).toBe(
    'https://ui.example/oauth/error'
  );
});
