import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
  type Server,
} from 'node:http';
import { afterEach, beforeEach, expect, test } from 'vitest';

let config: string;
const servers: Server[] = [];
beforeEach(async () => {
  config = await mkdtemp(join(tmpdir(), 'groupi-invites-'));
});
afterEach(async () => {
  for (const server of servers.splice(0))
    await new Promise<void>(done => server.close(() => done()));
  await rm(config, { recursive: true, force: true });
});
async function endpoint(
  handler: (req: IncomingMessage, res: ServerResponse) => void,
  capability = true
) {
  const server = createServer((req, res) => {
    res.setHeader('content-type', 'application/json');
    if (req.url === '/api/v2/health') {
      res.end(
        JSON.stringify({
          capabilities: capability
            ? { inviteWrites: { version: 1, retentionMs: 86400000 } }
            : {},
        })
      );
    } else handler(req, res);
  });
  servers.push(server);
  await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
  const address = server.address();
  if (!address || typeof address === 'string') throw Error('No port');
  await writeFile(
    join(config, 'test.json'),
    JSON.stringify({ apiUrl: `http://127.0.0.1:${address.port}/api/v2` })
  );
}
function cli(args: string[], json = true) {
  return new Promise<{ code: number | null; stdout: string; stderr: string }>(
    (done, reject) => {
      const child = spawn(
        process.execPath,
        [
          process.env.CLI_TEST_BIN ?? resolve('bin/groupi.js'),
          '--profile',
          'test',
          ...(json ? ['--format', 'json'] : []),
          ...args,
        ],
        {
          env: {
            ...process.env,
            GROUPI_CONFIG_DIR: config,
            GROUPI_API_KEY: 'private-test-key',
            GROUPI_API_KEY_PROFILE: 'test',
          },
          stdio: 'pipe',
        }
      );
      let stdout = '',
        stderr = '';
      child.stdout.on('data', data => (stdout += data));
      child.stderr.on('data', data => (stderr += data));
      child.on('error', reject);
      child.on('close', code => done({ code, stdout, stderr }));
      child.stdin.end();
    }
  );
}

test('creates a bearer link with bounded inputs and a replay identifier', async () => {
  const requests: unknown[] = [];
  await endpoint(async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;
    requests.push({
      path: req.url,
      method: req.method,
      body: JSON.parse(body),
      requestId: req.headers['idempotency-key'],
    });
    res.statusCode = 201;
    res.end(
      JSON.stringify({
        id: 'invite-1',
        token: 'bearer-1',
        apiKey: 'never-print',
      })
    );
  });
  const outcome = await cli([
    'invites',
    'links',
    'create',
    'event-1',
    '--name',
    'Dinner',
    '--uses',
    '3',
  ]);
  expect(outcome.code).toBe(0);
  expect(outcome.stderr).toBe('');
  const output = JSON.parse(outcome.stdout);
  expect(output).toEqual({
    id: 'invite-1',
    token: 'bearer-1',
    requestId: expect.stringMatching(/^\d{13}\.[0-9a-f-]{36}$/),
  });
  expect(requests).toEqual([
    {
      path: '/api/v2/events/event-1/invites',
      method: 'POST',
      body: { name: 'Dinner', maxUses: 3 },
      requestId: output.requestId,
    },
  ]);
  expect(outcome.stdout).not.toContain('never-print');
});

test('email batches queue invitations with explicit retry protection and preserve pending mode', async () => {
  const writes: { path?: string; body: unknown; id: unknown }[] = [];
  await endpoint(async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;
    writes.push({
      path: req.url,
      body: JSON.parse(body),
      id: req.headers['idempotency-key'],
    });
    if (writes.length === 1) {
      req.socket.destroy();
      return;
    }
    res.end(
      JSON.stringify({
        createdCount: 1,
        inviteIds: ['email-1'],
        queuedCount: 0,
        apiKey: 'private-test-key',
      })
    );
  });
  const id = `${Date.now()}.b5222690-666a-4cfc-92b8-a4a9c4572184`;
  const output = await cli([
    'invites',
    'email',
    'send',
    'event-1',
    '--invites',
    '[{"email":"guest@example.com","recipientName":"Guest","plusOnes":2}]',
    '--message',
    'Join us',
    '--no-send',
    '--request-id',
    id,
  ]);
  expect(output.code).toBe(0);
  expect(JSON.parse(output.stdout)).toEqual({
    createdCount: 1,
    inviteIds: ['email-1'],
    queuedCount: 0,
    requestId: id,
  });
  expect(writes).toHaveLength(2);
  expect(writes[0]).toEqual(writes[1]);
  expect(writes[0]).toEqual({
    path: '/api/v2/events/event-1/invites/email',
    body: {
      invites: [
        { email: 'guest@example.com', recipientName: 'Guest', plusOnes: 2 },
      ],
      customMessage: 'Join us',
      send: false,
    },
    id,
  });
  expect(output.stdout + output.stderr).not.toContain('private-test-key');
});

test('username invitations target a recipient, list received pending pages, and accept membership', async () => {
  const requests: { path?: string; method?: string; body: unknown }[] = [];
  const summary = {
    inviteId: 'member-invite',
    eventId: 'event-1',
    eventTitle: 'Dinner',
    inviterId: 'organizer',
    inviteeId: 'guest',
    role: 'ATTENDEE',
    status: 'PENDING',
    message: 'Come along',
    createdAt: 1,
    respondedAt: null,
  };
  await endpoint(async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;
    requests.push({
      path: req.url,
      method: req.method,
      body: body ? JSON.parse(body) : null,
    });
    if (req.url?.includes('/events/'))
      res.end(JSON.stringify({ inviteId: 'member-invite', status: 'PENDING' }));
    else if (req.method === 'GET')
      res.end(JSON.stringify({ items: [summary], nextCursor: null }));
    else
      res.end(
        JSON.stringify({
          eventId: 'event-1',
          membershipId: 'membership-guest',
          privateField: 'hidden',
        })
      );
  });
  const sent = await cli([
    'invites',
    'members',
    'send',
    'event-1',
    '--username',
    'guest',
    '--message',
    'Come along',
  ]);
  expect(sent.code).toBe(0);
  expect(JSON.parse(sent.stdout)).toMatchObject({
    inviteId: 'member-invite',
    status: 'PENDING',
  });
  const listed = await cli(['invites', 'members', 'list']);
  expect(listed.code).toBe(0);
  expect(JSON.parse(listed.stdout)).toEqual({
    items: [summary],
    nextCursor: null,
  });
  const accepted = await cli(['invites', 'members', 'accept', 'member-invite']);
  expect(accepted.code).toBe(0);
  expect(JSON.parse(accepted.stdout)).toEqual({
    eventId: 'event-1',
    membershipId: 'membership-guest',
  });
  expect(requests).toEqual([
    {
      path: '/api/v2/events/event-1/member-invites',
      method: 'POST',
      body: { username: 'guest', message: 'Come along' },
    },
    {
      path: '/api/v2/member-invites?pagination=cursor&limit=20',
      method: 'GET',
      body: null,
    },
    {
      path: '/api/v2/member-invites/member-invite/accept',
      method: 'POST',
      body: {},
    },
  ]);
});

test('bearer management confirms edits and revocation while acceptance uses its token', async () => {
  const requests: { path?: string; method?: string; body: unknown }[] = [];
  const summary = {
    id: 'invite-1',
    eventId: 'event-1',
    token: 'bearer-1',
    name: 'Updated',
    maxUses: null,
    usesTotal: null,
    usesRemaining: null,
    expiresAt: null,
    createdAt: 1,
    kind: 'link',
    email: null,
    recipientName: null,
    customMessage: null,
    emailStatus: null,
  };
  await endpoint(async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;
    requests.push({
      path: req.url,
      method: req.method,
      body: body ? JSON.parse(body) : null,
    });
    if (req.method === 'DELETE') {
      res.statusCode = 204;
      res.end();
    } else if (req.method === 'PATCH') res.end(JSON.stringify(summary));
    else
      res.end(
        JSON.stringify({ eventId: 'event-1', membershipId: 'membership-1' })
      );
  });
  const denied = await cli([
    'invites',
    'links',
    'edit',
    'invite-1',
    '--name',
    'Updated',
  ]);
  expect(denied.code).toBe(2);
  expect(JSON.parse(denied.stderr).error.code).toBe('CONFIRMATION_REQUIRED');
  expect(requests).toHaveLength(0);
  const edited = await cli([
    'invites',
    'links',
    'edit',
    'invite-1',
    '--name',
    'Updated',
    '--unlimited',
    '--no-expiry',
    '--yes',
  ]);
  expect(edited.code).toBe(0);
  expect(JSON.parse(edited.stdout)).toEqual(summary);
  const accepted = await cli(['invites', 'links', 'accept', 'bearer-1']);
  expect(accepted.code).toBe(0);
  expect(JSON.parse(accepted.stdout)).toEqual({
    eventId: 'event-1',
    membershipId: 'membership-1',
  });
  const revoked = await cli([
    'invites',
    'links',
    'revoke',
    'invite-1',
    '--yes',
  ]);
  expect(revoked.code).toBe(0);
  expect(JSON.parse(revoked.stdout)).toEqual({ id: 'invite-1', revoked: true });
  expect(requests).toEqual([
    {
      path: '/api/v2/invites/invite-1',
      method: 'PATCH',
      body: { name: 'Updated', maxUses: null, expiresAt: null },
    },
    { path: '/api/v2/invites/bearer-1/accept', method: 'POST', body: {} },
    { path: '/api/v2/invites/invite-1', method: 'DELETE', body: null },
  ]);
});

test('member decline and revoke require explicit confirmation and send only one write', async () => {
  const writes: { path?: string; method?: string }[] = [];
  await endpoint((req, res) => {
    writes.push({ path: req.url, method: req.method });
    res.end('{"success":true,"apiKey":"private-test-key"}');
  });
  for (const action of ['decline', 'revoke']) {
    const denied = await cli(['invites', 'members', action, 'member-invite']);
    expect(JSON.parse(denied.stderr).error.code).toBe('CONFIRMATION_REQUIRED');
    const success = await cli([
      'invites',
      'members',
      action,
      'member-invite',
      '--yes',
    ]);
    expect(success.code).toBe(0);
    expect(JSON.parse(success.stdout)).toEqual({ success: true });
  }
  expect(writes).toEqual([
    { path: '/api/v2/member-invites/member-invite/decline', method: 'POST' },
    { path: '/api/v2/member-invites/member-invite', method: 'DELETE' },
  ]);
});

test('link/email paging preserves filters and cursor continuity without exposing unknown fields', async () => {
  const paths: (string | undefined)[] = [];
  const summary = {
    id: 'email-1',
    eventId: 'event-1',
    token: 'bearer-1',
    name: null,
    maxUses: 1,
    usesTotal: 1,
    usesRemaining: 1,
    expiresAt: null,
    createdAt: 1,
    kind: 'email',
    email: 'guest@example.com',
    recipientName: null,
    customMessage: null,
    emailStatus: 'pending',
  };
  await endpoint((req, res) => {
    paths.push(req.url);
    const next = paths.length === 1 ? 'next-page' : null;
    res.end(
      JSON.stringify({
        items:
          paths.length === 1
            ? []
            : [{ ...summary, apiKey: 'private-test-key' }],
        nextCursor: next,
        privateField: 'hidden',
      })
    );
  });
  const output = await cli([
    'invites',
    'links',
    'list',
    'event-1',
    '--kind',
    'email',
    '--limit',
    '1',
    '--all',
  ]);
  expect(output.code).toBe(0);
  expect(JSON.parse(output.stdout)).toEqual({
    items: [summary],
    nextCursor: null,
  });
  expect(paths).toEqual([
    '/api/v2/events/event-1/invites?pagination=cursor&limit=1&kind=email',
    '/api/v2/events/event-1/invites?pagination=cursor&limit=1&cursor=next-page&kind=email',
  ]);
  expect(output.stdout).not.toContain('private-test-key');
});

test('member invitation traversal preserves its status filter on every page', async () => {
  const paths: (string | undefined)[] = [];
  await endpoint((req, res) => {
    paths.push(req.url);
    res.end(
      JSON.stringify({
        items: [],
        nextCursor: paths.length === 1 ? 'next' : null,
      })
    );
  });
  const result = await cli([
    'invites',
    'members',
    'list',
    'event-1',
    '--status',
    'ACCEPTED',
    '--all',
  ]);
  expect(result.code).toBe(0);
  expect(JSON.parse(result.stdout)).toEqual({ items: [], nextCursor: null });
  expect(paths).toEqual([
    '/api/v2/events/event-1/member-invites?pagination=cursor&limit=20&status=ACCEPTED',
    '/api/v2/events/event-1/member-invites?pagination=cursor&limit=20&cursor=next&status=ACCEPTED',
  ]);
});

test('repeated invitation cursor fails rather than looping or silently returning partial results', async () => {
  let reads = 0;
  await endpoint((_req, res) => {
    reads++;
    res.end('{"items":[],"nextCursor":"repeat"}');
  });
  const output = await cli([
    'invites',
    'members',
    'list',
    '--cursor',
    'repeat',
    '--all',
  ]);
  expect(output.code).toBe(5);
  expect(JSON.parse(output.stderr).error.code).toBe('INVALID_RESPONSE');
  expect(output.stdout).toBe('');
  expect(reads).toBe(1);
});

test.each([
  ['invites', 'links', 'create', 'event-1', '--uses', '0'],
  ['invites', 'links', 'create', 'event-1', '--uses', '10001'],
  [
    'invites',
    'links',
    'create',
    'event-1',
    '--expires',
    '2001-01-01T00:00:00Z',
  ],
  [
    'invites',
    'links',
    'create',
    'event-1',
    '--expires',
    '2027-02-30T00:00:00Z',
  ],
  ['invites', 'links', 'edit', 'invite-1', '--uses', '1', '--unlimited'],
  ['invites', 'links', 'edit', 'invite-1'],
  ['invites', 'links', 'decline', 'bearer-token'],
  ['invites', 'links', 'get', 'https://groupi.gg/i/bearer'],
  ['invites', 'members', 'send', 'event-1'],
  ['invites', 'members', 'send', 'event-1', '--username', 'x'],
  [
    'invites',
    'members',
    'send',
    'event-1',
    '--username',
    'guest',
    '--role',
    'ORGANIZER',
  ],
  [
    'invites',
    'members',
    'send',
    'event-1',
    '--username',
    'guest',
    '--message',
    'a'.repeat(481),
  ],
  ['invites', 'members', 'list', '--limit', '101'],
  ['invites', 'email', 'send', 'event-1', '--invites', 'not-json'],
  ['invites', 'email', 'send', 'event-1', '--invites', '[]'],
  [
    'invites',
    'email',
    'send',
    'event-1',
    '--invites',
    '[{"email":"guest@example.com","plusOnes":100}]',
  ],
  [
    'invites',
    'email',
    'send',
    'event-1',
    '--invites',
    '[{"email":"guest@example.com","apiKey":"private-test-key"}]',
  ],
  ['invites', 'links', 'create', 'event-1', '--request-id', 'wrong'],
])(
  'invalid/headless invitation inputs reject before any network call: %j',
  async (...args) => {
    let requests = 0;
    await endpoint((_req, res) => {
      requests++;
      res.end('{}');
    }, false);
    const output = await cli(args);
    expect(output.code).toBe(2);
    expect(JSON.parse(output.stderr).error.code).toBe('USAGE');
    expect(output.stdout).toBe('');
    expect(requests).toBe(0);
    expect(output.stderr).not.toContain('private-test-key');
  }
);

test('unsupported invitation servers reject mutations before sending a write', async () => {
  let writes = 0;
  await endpoint((_req, res) => {
    writes++;
    res.end('{}');
  }, false);
  const output = await cli(['invites', 'email', 'send-pending', 'event-1']);
  expect(output.code).toBe(5);
  expect(JSON.parse(output.stderr).error.code).toBe('UNSUPPORTED_SERVER');
  expect(writes).toBe(0);
});

test.each([401, 403, 404, 409, 422])(
  'invitation HTTP %s errors are actionable and secret-safe',
  async status => {
    let writes = 0;
    await endpoint((_req, res) => {
      writes++;
      res.statusCode = status;
      res.end(
        '{"error":{"message":"private-test-key bearer-secret","code":"UNTRUSTED"}}'
      );
    });
    const output = await cli(['invites', 'links', 'accept', 'bearer-secret']);
    expect(output.code).toBe(
      [401, 403].includes(status) ? 3 : status === 404 ? 4 : 2
    );
    expect(writes).toBe(1);
    expect(output.stdout).toBe('');
    expect(output.stderr).not.toMatch(/private-test-key|bearer-secret/);
  }
);

test('an ambiguous acceptance is never retried and recovery never echoes its bearer token', async () => {
  let writes = 0;
  await endpoint(req => {
    writes++;
    req.socket.destroy();
  });
  const output = await cli(['invites', 'links', 'accept', 'bearer-secret']);
  expect(output.code).toBe(5);
  expect(JSON.parse(output.stderr).error.code).toBe('UNCERTAIN_OUTCOME');
  expect(writes).toBe(1);
  expect(output.stderr).toContain('events list');
  expect(output.stderr).not.toContain('bearer-secret');
});

test('pending email delivery reports queued count, never a delivery claim', async () => {
  await endpoint((req, res) => {
    expect(req.url).toBe('/api/v2/events/event-1/invites/send-pending');
    expect(req.headers['idempotency-key']).toMatch(/^\d{13}\./);
    res.end('{"queuedCount":2}');
  });
  const output = await cli(
    ['invites', 'email', 'send-pending', 'event-1'],
    false
  );
  expect(output.code).toBe(0);
  expect(output.stdout).toContain('queued');
  expect(output.stdout).toContain('does not confirm delivery');
  expect(output.stdout).not.toContain('private-test-key');
});

test.each(['links', 'email'])(
  'an expired invitation can replay the original %s creation request within retention',
  async kind => {
    const requests: unknown[] = [];
    const requestId = `${Date.now()}.b5222690-666a-4cfc-92b8-a4a9c4572184`;
    await endpoint(async (req, res) => {
      let body = '';
      for await (const chunk of req) body += chunk;
      requests.push(JSON.parse(body));
      res.end(
        JSON.stringify(
          kind === 'links'
            ? { id: 'original-invite', token: 'original-token' }
            : {
                createdCount: 1,
                inviteIds: ['original-invite'],
                queuedCount: 1,
              }
        )
      );
    });
    const result = await cli([
      'invites',
      kind,
      kind === 'links' ? 'create' : 'send',
      'event-1',
      ...(kind === 'email'
        ? ['--invites', '[{"email":"guest@example.com"}]']
        : []),
      '--expires',
      '2020-01-01T00:00:00Z',
      '--request-id',
      requestId,
    ]);
    expect(result.code).toBe(0);
    expect(JSON.parse(result.stdout).requestId).toBe(requestId);
    expect(requests).toHaveLength(1);
  }
);
