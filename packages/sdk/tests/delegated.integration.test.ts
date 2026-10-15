import { createAuthAccount } from '../../../convex/tests/auth.helpers';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createServer } from 'node:https';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync, spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { httpActionGeneric, makeFunctionReference } from 'convex/server';
const backendRoot =
  process.env.SDK_BACKEND_ROOT ??
  fileURLToPath(new URL('../../..', import.meta.url));
const helpers = await import(
  pathToFileURL(
    resolve(backendRoot, 'convex/tests/delegated-protocol.helpers.ts')
  ).href
);
const nativeHelpers = await import(
  pathToFileURL(resolve(backendRoot, 'convex/tests/test_helpers.ts')).href
);
const router = (
  await import(pathToFileURL(resolve(backendRoot, 'convex/http.ts')).href)
).default;
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});
async function fixture(confidential = false) {
  const temp = mkdtempSync(join(tmpdir(), 'groupi-sdk-oauth-'));
  const cert = join(temp, 'certificate.pem'),
    key = join(temp, 'key.pem');
  execFileSync(
    'openssl',
    [
      'req',
      '-x509',
      '-newkey',
      'rsa:2048',
      '-nodes',
      '-keyout',
      key,
      '-out',
      cert,
      '-subj',
      '/CN=127.0.0.1',
      '-addext',
      'subjectAltName=IP:127.0.0.1',
      '-days',
      '1',
    ],
    { stdio: 'ignore' }
  );
  let context: Awaited<ReturnType<typeof helpers.setup>>;
  let origin: string;
  const seenHeaders: Array<{
    authorization: string | undefined;
    key: string | undefined;
  }> = [];
  // Same real router/action context bridge as convex-test, preserving the TLS URL.
  const invoke = httpActionGeneric(async (ctx, request) => {
    const found = router.lookup(new URL(request.url).pathname, request.method);
    if (!found) return new Response('Not found', { status: 404 });
    return found[0]._handler(
      {
        ...ctx,
        runQuery: context.t.query,
        runMutation: context.t.mutation,
        runAction: context.t.action,
      },
      request
    );
  });
  const server = createServer(
    { cert: readFileSync(cert), key: readFileSync(key) },
    async (req, res) => {
      try {
        if (req.url === '/test/client-assertion') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(await context.clientAuthentication()));
          return;
        }
        if (req.url?.startsWith('/api/v2'))
          seenHeaders.push({
            authorization: req.headers.authorization,
            key: req.headers['x-api-key'] as string | undefined,
          });
        const chunks: Buffer[] = [];
        for await (const chunk of req) chunks.push(Buffer.from(chunk));
        const body = Buffer.concat(chunks);
        const headers = new Headers();
        for (const [name, value] of Object.entries(req.headers))
          if (value !== undefined)
            headers.set(name, Array.isArray(value) ? value.join(',') : value);
        const response = await invoke.invokeHttpAction(
          new Request(origin + (req.url ?? '/'), {
            method: req.method,
            headers,
            ...(body.length ? { body: new Uint8Array(body) } : {}),
          })
        );
        res.writeHead(response.status, Object.fromEntries(response.headers));
        res.end(new Uint8Array(await response.arrayBuffer()));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            error: { code: 'FIXTURE_FAILURE', message: String(error) },
          })
        );
      }
    }
  );
  await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
  const address = server.address();
  if (!address || typeof address === 'string')
    throw new Error('Missing TLS port');
  origin = `https://127.0.0.1:${address.port}`;
  try {
    context = await helpers.setup({ issuer: origin + '/oauth', confidential });
  } catch (error) {
    server.closeAllConnections();
    await new Promise<void>(done => server.close(() => done()));
    rmSync(temp, { recursive: true, force: true });
    throw error;
  }
  context.t.fetch = (path: string, init?: RequestInit) =>
    invoke.invokeHttpAction(new Request(origin + path, init));
  async function driver(language: string) {
    const child =
      language === 'typescript'
        ? spawn(
            process.execPath,
            [fileURLToPath(new URL('./delegated-driver.mjs', import.meta.url))],
            {
              env: { ...process.env, NODE_EXTRA_CA_CERTS: cert },
              stdio: ['pipe', 'pipe', 'pipe'],
            }
          )
        : spawn(
            'python3',
            [
              fileURLToPath(
                new URL(
                  '../../python-sdk/tests/delegated_driver.py',
                  import.meta.url
                )
              ),
            ],
            {
              env: {
                ...process.env,
                SSL_CERT_FILE: cert,
                PYTHONPATH: fileURLToPath(
                  new URL('../../python-sdk', import.meta.url)
                ),
              },
              stdio: ['pipe', 'pipe', 'pipe'],
            }
          );
    const lines = createInterface({ input: child.stdout });
    const iterator = lines[Symbol.asyncIterator]();
    let stderr = '';
    child.stderr.on('data', chunk => (stderr += String(chunk)));
    return {
      async request(command: object) {
        child.stdin.write(JSON.stringify(command) + '\n');
        const line = await iterator.next();
        if (line.done) throw new Error('SDK driver ended: ' + stderr);
        return JSON.parse(line.value);
      },
      async close() {
        child.stdin.end();
        await new Promise<void>(done => child.once('close', () => done()));
        lines.close();
      },
    };
  }
  return {
    context,
    origin,
    seenHeaders,
    driver,
    async close() {
      server.closeAllConnections();
      await new Promise<void>(done => server.close(() => done()));
      rmSync(temp, { recursive: true, force: true });
    },
  };
}
for (const language of ['typescript', 'python'])
  describe(language + ' delegated SDK public journey', () => {
    it('reads selected Group context with generated SDK and denies unrelated Groups', async () => {
      const f = await fixture();
      const d = await f.driver(language);
      try {
        const { context, origin } = f;
        const groupId = await context.owner.auth.mutation(
          makeFunctionReference('groups/mutations:createGroup'),
          { name: 'Red Room' }
        );
        const otherId = await context.owner.auth.mutation(
          makeFunctionReference('groups/mutations:createGroup'),
          { name: 'Other' }
        );
        const authorization = await helpers.authorize(context, {
          scopes: 'openid groups.context.read groups.events.read',
          actions: ['groups.context.read', 'groups.events.read'],
          selector: { kind: 'selected-group', groupId },
          background: false,
        });
        expect(
          await d.request({
            operation: 'initialize',
            config: {
              instance: origin,
              issuer: origin + '/oauth',
              audience: origin + '/api/v2',
              clientId: context.appId,
              clientType: 'native',
              actions: ['groups.context.read', 'groups.events.read'],
            },
            exchange: {
              code: authorization.code,
              codeVerifier: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
              redirectUri: context.redirectUri,
              state: 'client-state',
              expectedState: 'client-state',
              background: false,
            },
          })
        ).toMatchObject({ ok: true });
        expect(
          await d.request({ operation: 'community', groupId })
        ).toMatchObject({
          ok: true,
          result: {
            contractVersion: 'red-room.v1',
            group: { id: groupId, name: 'Red Room' },
            applications: [],
          },
        });
        expect(
          await d.request({ operation: 'community', groupId: otherId })
        ).toMatchObject({ ok: false, code: 'FORBIDDEN', status: 403 });
        expect(
          await d.request({ operation: 'current-event', groupId })
        ).toMatchObject({ ok: true, result: { kind: 'none' } });
        await context.owner.auth.mutation(
          makeFunctionReference(
            'groupEventAudiences/mutations:shareEventWithGroup'
          ),
          { groupId, eventId: context.event.eventId }
        );
        expect(
          await d.request({ operation: 'current-event', groupId })
        ).toMatchObject({
          ok: true,
          result: {
            kind: 'event',
            event: { id: context.event.eventId },
            supportedRsvpChoices: ['PENDING', 'YES', 'NO', 'MAYBE'],
            allowedRsvpTransitions: [],
            allowedActions: ['groups.events.read'],
          },
        });
        expect(
          await d.request({ operation: 'current-event', groupId: otherId })
        ).toMatchObject({ ok: false, code: 'FORBIDDEN', status: 403 });
      } finally {
        await d.close();
        await f.close();
      }
    }, 30000);
    it('submits, replays, edits and withdraws selected Group applications through the generated public client', async () => {
      const f = await fixture();
      const d = await f.driver(language);
      try {
        const { context, origin } = f;
        const staff = await createAuthAccount(
          context.t,
          'sdk-application-staff'
        );
        const groupId = await staff.auth.mutation(
          makeFunctionReference('groups/mutations:createGroup'),
          { name: 'Application community' }
        );
        await staff.auth.mutation(
          makeFunctionReference(
            'groupApplications/mutations:configureGroupApplications'
          ),
          {
            groupId,
            applicationsEnabled: true,
            questions: [
              {
                id: 'welcome',
                label: 'Welcome?',
                required: true,
                type: 'LONG_ANSWER',
              },
            ],
          }
        );
        const actions = [
          'groups.context.read',
          'groups.applications.submit',
          'groups.applications.edit',
          'groups.applications.withdraw',
        ] as const;
        const authorization = await helpers.authorize(context, {
          scopes: `openid ${actions.join(' ')}`,
          actions: [...actions],
          selector: { kind: 'selected-group', groupId },
          background: false,
        });
        expect(
          await d.request({
            operation: 'initialize',
            config: {
              instance: origin,
              issuer: origin + '/oauth',
              audience: origin + '/api/v2',
              clientId: context.appId,
              clientType: 'native',
              actions,
            },
            exchange: {
              code: authorization.code,
              codeVerifier: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
              redirectUri: context.redirectUri,
              state: 'client-state',
              expectedState: 'client-state',
              background: false,
            },
          })
        ).toMatchObject({ ok: true });
        const read = await d.request({ operation: 'community', groupId });
        const intent = {
          operation: 'application',
          method: 'submitCommunityApplication',
          operationId: crypto.randomUUID(),
          input: {
            path: { groupId },
            body: {
              formRevision: read.result.form.revision,
              answers: { welcome: 'SDK answer' },
            },
          },
        };
        const first = await d.request(intent);
        expect(first).toMatchObject({
          ok: true,
          result: { outcome: 'committed', result: { status: 'PENDING' } },
        });
        expect(await d.request(intent)).toEqual(first);
        expect(
          await d.request({
            ...intent,
            input: {
              ...intent.input,
              body: { ...intent.input.body, answers: { welcome: 'Different' } },
            },
          })
        ).toMatchObject({
          ok: false,
          status: 409,
          code: 'IDEMPOTENCY_CONFLICT',
        });
        const path = {
          groupId,
          applicationId: first.result.result.applicationId,
        };
        const edited = await d.request({
          operation: 'application',
          method: 'editCommunityApplication',
          operationId: crypto.randomUUID(),
          input: {
            path,
            body: {
              expectedRevision: first.result.result.revision,
              answers: { welcome: 'Edited SDK answer' },
            },
          },
        });
        expect(edited).toMatchObject({
          ok: true,
          result: { result: { status: 'PENDING' } },
        });
        expect(
          await d.request({
            operation: 'application',
            method: 'withdrawCommunityApplication',
            operationId: crypto.randomUUID(),
            input: {
              path,
              body: { expectedRevision: edited.result.result.revision },
            },
          })
        ).toMatchObject({
          ok: true,
          result: { result: { status: 'WITHDRAWN' } },
        });
        const history = await d.request({ operation: 'community', groupId });
        expect(history.result.applications).toHaveLength(1);
        expect(history.result.applications[0]).toMatchObject({
          status: 'WITHDRAWN',
          answers: { welcome: 'Edited SDK answer' },
        });
      } finally {
        await d.close();
        await f.close();
      }
    }, 30000);
    it.each([false, true])(
      'S256 consent, narrow grant, transparent rotating renewal, expiry and disconnect (confidential=%s)',
      async confidential => {
        const f = await fixture(confidential);
        const d = await f.driver(language);
        try {
          const { context, origin } = f;
          const other = await context.owner.auth.mutation(
            makeFunctionReference('events/mutations:createEvent'),
            { title: 'Owned but unselected' }
          );
          const authorization = await helpers.authorize(context, {
            scopes: 'openid events.read offline_access',
            actions: ['events.read'],
            selector: { kind: 'selected', eventIds: [context.event.eventId] },
            background: true,
          });
          const initialized = await d.request({
            operation: 'initialize',
            config: {
              instance: origin,
              issuer: origin + '/oauth',
              audience: origin + '/api/v2',
              clientId: context.appId,
              clientType: confidential ? 'confidentialWeb' : 'native',
              actions: ['events.read', 'events.update'],
            },
            exchange: {
              code: authorization.code,
              codeVerifier: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
              redirectUri: context.redirectUri,
              state: 'client-state',
              expectedState: 'client-state',
              background: true,
            },
          });
          expect(initialized).toMatchObject({
            ok: true,
            result: { grantedActions: ['events.read'] },
          });
          expect(
            await d.request({
              operation: 'read',
              eventId: context.event.eventId,
            })
          ).toMatchObject({ ok: true, result: { id: context.event.eventId } });
          expect(
            await d.request({ operation: 'read', eventId: other.eventId })
          ).toMatchObject({ ok: false, status: 403 });
          expect(
            await d.request({
              operation: 'write',
              eventId: context.event.eventId,
            })
          ).toMatchObject({ ok: false, status: 403 });
          expect(
            await d.request({
              operation: 'renew',
              eventId: context.event.eventId,
            })
          ).toMatchObject({
            ok: true,
            result: { rotated: true, grantedActions: ['events.read'] },
          });
          vi.useFakeTimers({ toFake: ['Date'] });
          vi.setSystemTime(Date.now() + 301000);
          expect(
            await d.request({
              operation: 'read',
              eventId: context.event.eventId,
            })
          ).toMatchObject({ ok: false, status: 401 });
          vi.useRealTimers();
          const connections = await context.owner.auth.query(
            makeFunctionReference('delegatedApps/queries:listConnections'),
            { now: Date.now() }
          );
          await context.owner.auth.mutation(
            makeFunctionReference('delegatedApps/mutations:disconnect'),
            { grantId: connections[0].grantId }
          );
          expect(
            await d.request({
              operation: 'read',
              eventId: context.event.eventId,
            })
          ).toMatchObject({ ok: false, status: 401 });
          expect(await d.request({ operation: 'refresh' })).toMatchObject({
            ok: false,
            code: 'invalid_grant',
          });
          expect(
            f.seenHeaders
              .filter(header => header.authorization)
              .every(header => header.key === undefined)
          ).toBe(true);
        } finally {
          await d.close();
          await f.close();
        }
      },
      30000
    );
    it('a broad current/future grant remains account-bound and has no background renewal without consent', async () => {
      const f = await fixture();
      const d = await f.driver(language);
      try {
        const { context, origin } = f;
        const auth = await helpers.authorize(context, {
          scopes: 'openid events.read',
          actions: ['events.read'],
          selector: { kind: 'all-current-and-future' },
          background: false,
        });
        expect(
          await d.request({
            operation: 'initialize',
            config: {
              instance: origin,
              issuer: origin + '/oauth',
              audience: origin + '/api/v2',
              clientId: context.appId,
              clientType: 'native',
              actions: ['events.read'],
            },
            exchange: {
              code: auth.code,
              codeVerifier: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
              redirectUri: context.redirectUri,
              state: 'client-state',
              expectedState: 'client-state',
              background: false,
            },
          })
        ).toMatchObject({ ok: true });
        expect(
          await d.request({ operation: 'read', eventId: context.event.eventId })
        ).toMatchObject({ ok: true });
        const future = await context.owner.auth.mutation(
          makeFunctionReference('events/mutations:createEvent'),
          { title: 'Created after broad consent' }
        );
        expect(
          await d.request({ operation: 'read', eventId: future.eventId })
        ).toMatchObject({ ok: true, result: { id: future.eventId } });
        const unrelated = await nativeHelpers.createTestEventWithUser(
          context.t
        );
        expect(
          await d.request({ operation: 'read', eventId: unrelated.eventId })
        ).toMatchObject({ ok: false, status: 403 });
        expect(await d.request({ operation: 'refresh' })).toMatchObject({
          ok: false,
          code: 'UNAUTHORIZED',
        });
      } finally {
        await d.close();
        await f.close();
      }
    }, 30000);
    it('explicit bounded named keys stay selected, expire, and revoke without credential fallback', async () => {
      const f = await fixture();
      const d = await f.driver(language);
      try {
        const { context, origin } = f;
        const unselected = await context.owner.auth.mutation(
          makeFunctionReference('events/mutations:createEvent'),
          { title: 'Another owned event' }
        );
        const grant = await context.owner.auth.mutation(
          makeFunctionReference('authorization/mutations:issue'),
          {
            name: 'SDK bounded reader',
            principalKind: 'user',
            actions: ['events.read'],
            selector: { kind: 'selected', eventIds: [context.event.eventId] },
            expiresAt: Date.now() + 60000,
          }
        );
        expect(
          await d.request({
            operation: 'bounded',
            instance: origin,
            key: grant.key,
          })
        ).toMatchObject({ ok: true });
        expect(
          await d.request({ operation: 'read', eventId: context.event.eventId })
        ).toMatchObject({ ok: true });
        expect(
          await d.request({ operation: 'read', eventId: unselected.eventId })
        ).toMatchObject({ ok: false, status: 403 });
        expect(
          await d.request({
            operation: 'write',
            eventId: context.event.eventId,
          })
        ).toMatchObject({ ok: false, status: 403 });
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(Date.now() + 61000);
        expect(
          await d.request({ operation: 'read', eventId: context.event.eventId })
        ).toMatchObject({ ok: false, status: 401 });
        vi.useRealTimers();
        await context.owner.auth.mutation(
          makeFunctionReference('authorization/mutations:revoke'),
          { grantId: grant.grantId }
        );
        expect(
          await d.request({ operation: 'read', eventId: context.event.eventId })
        ).toMatchObject({ ok: false, status: 401 });
      } finally {
        await d.close();
        await f.close();
      }
    }, 30000);
  });
