import { spawn } from 'node:child_process';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
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
let servers: Server[] = [];
beforeEach(async () => {
  config = await mkdtemp(join(tmpdir(), 'groupi-cli-test-'));
});
afterEach(async () => {
  for (const server of servers)
    await new Promise<void>(done => server.close(() => done()));
  servers = [];
  await rm(config, { recursive: true, force: true });
});

async function endpoint(
  handler: (req: IncomingMessage, res: ServerResponse) => void,
  advertiseReplay = true
) {
  const server = createServer((req, res) => {
    if (advertiseReplay && req.url === '/api/v2/health') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(
        JSON.stringify({
          status: 'ok',
          version: '2.0.0',
          capabilities: {
            eventWrites: { version: 1 },
            eventCreationIdempotency: { version: 1, retentionMs: 86400000 },
          },
        })
      );
      return;
    }
    handler(req, res);
  });
  servers.push(server);
  await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No test port');
  return `http://127.0.0.1:${address.port}/api/v2`;
}

function cli(
  args: string[],
  env: Record<string, string> = {},
  input = '',
  interactive = false
) {
  return new Promise<{ code: number | null; stdout: string; stderr: string }>(
    (resolveResult, reject) => {
      const child = spawn(
        process.execPath,
        [
          '--import',
          pathToFileURL(
            resolve(
              interactive
                ? 'tests/fixtures/interactive-environment.mjs'
                : 'tests/fixtures/keyring-environment.mjs'
            )
          ).href,
          process.env.CLI_TEST_BIN ?? resolve('bin/groupi.js'),
          ...args,
        ],
        {
          env: {
            ...process.env,
            GROUPI_CONFIG_DIR: config,
            GROUPI_API_KEY: '',
            GROUPI_API_KEY_PROFILE: '',
            GROUPI_PROFILE: '',
            ...env,
          },
          stdio: 'pipe',
        }
      );
      let stdout = '';
      let stderr = '';
      child.stdout.on('data', data => {
        stdout += data;
      });
      child.stderr.on('data', data => {
        stderr += data;
      });
      child.on('error', reject);
      child.on('close', code => resolveResult({ code, stdout, stderr }));
      child.stdin.on('error', () => {});
      child.stdin.end(input);
    }
  );
}

test('installed command explains event browsing without credentials', async () => {
  const result = await cli(['--help']);
  expect(result.code).toBe(0);
  expect(result.stdout).toContain('events');
  expect(result.stderr).toBe('');
});

test('a named profile browses a bounded event page using an explicitly scoped key', async () => {
  let request: { path?: string; key?: string | string[] } = {};
  const url = await endpoint((req, res) => {
    request = { path: req.url, key: req.headers['x-api-key'] };
    res.setHeader('content-type', 'application/json');
    res.end(
      JSON.stringify({
        items: [{ id: 'event-1', title: 'Dinner', extra: { retained: true } }],
        nextCursor: 'page-two',
      })
    );
  });
  expect((await cli(['profile', 'add', 'local', '--api-url', url])).code).toBe(
    0
  );
  const result = await cli(
    ['events', 'list', '--profile', 'local', '--format', 'json'],
    { GROUPI_API_KEY: 'local-secret', GROUPI_API_KEY_PROFILE: 'local' }
  );
  expect(result).toEqual({
    code: 0,
    stdout:
      '{"items":[{"id":"event-1","title":"Dinner","extra":{"retained":true}}],"nextCursor":"page-two"}\n',
    stderr: '',
  });
  expect(request).toEqual({
    path: '/api/v2/events?pagination=cursor&limit=20',
    key: 'local-secret',
  });
});

test.each([
  { args: ['events', 'list'], code: 'AUTH_REQUIRED', exit: 3 },
  {
    args: ['events', 'list', '--profile', 'typo'],
    code: 'UNKNOWN_PROFILE',
    exit: 2,
  },
  { args: ['events', 'get'], code: 'USAGE', exit: 2 },
  { args: ['events', 'list', '--limit', '0'], code: 'USAGE', exit: 2 },
  { args: ['events', 'list', '--limit', '1.5'], code: 'USAGE', exit: 2 },
  { args: [], code: 'USAGE', exit: 2 },
])(
  'JSON failures never prompt or pollute stdout: $code $args',
  async ({ args, code, exit }) => {
    const result = await cli([...args, '--format', 'json']);
    expect(result.code).toBe(exit);
    expect(result.stdout).toBe('');
    expect(JSON.parse(result.stderr).error.code).toBe(code);
  }
);

test('explicit all retrieval follows cursors and consumes only explicitly requested stdin credentials', async () => {
  const paths: string[] = [];
  const url = await endpoint((req, res) => {
    paths.push(req.url!);
    if (req.headers['x-api-key'] !== 'stdin-secret') {
      res.writeHead(401).end('{}');
      return;
    }
    res.setHeader('content-type', 'application/json');
    res.end(
      JSON.stringify(
        req.url?.includes('cursor=')
          ? { items: [{ id: 'two', title: 'Picnic' }], nextCursor: null }
          : {
              items: [{ id: 'one', title: 'Dinner' }],
              nextCursor: 'next opaque',
            }
      )
    );
  });
  await cli(['profile', 'add', 'local', '--api-url', url]);
  const result = await cli(
    [
      '--profile',
      'local',
      '--format=json',
      '--api-key-stdin',
      'events',
      'list',
      '--limit',
      '1',
      '--all',
    ],
    { GROUPI_API_KEY: 'ignored-env-key' },
    'stdin-secret\n'
  );
  expect(result.code).toBe(0);
  expect(result.stderr).toBe('');
  expect(JSON.parse(result.stdout)).toEqual({
    items: [
      { id: 'one', title: 'Dinner' },
      { id: 'two', title: 'Picnic' },
    ],
    nextCursor: null,
  });
  expect(paths).toEqual([
    '/api/v2/events?pagination=cursor&limit=1',
    '/api/v2/events?pagination=cursor&limit=1&cursor=next+opaque',
  ]);
});

test.each([
  [401, 'AUTH_REQUIRED', 3, 1],
  [403, 'FORBIDDEN', 3, 1],
  [404, 'NOT_FOUND', 4, 1],
  [429, 'RATE_LIMITED', 5, 3],
  [503, 'REMOTE_ERROR', 5, 3],
  [200, 'INVALID_RESPONSE', 5, 1],
] as const)(
  'HTTP %s has safe structured errors and bounded retries',
  async (status, code, exit, attempts) => {
    let requests = 0;
    const url = await endpoint((_req, res) => {
      requests++;
      res.writeHead(status, {
        'content-type': 'application/json',
        'retry-after': '0',
      });
      res.end('{"error":{"message":"secret-key-reflected"}}');
    });
    await cli(['profile', 'add', 'local', '--api-url', url]);
    const result = await cli(
      ['--profile', 'local', '--format', 'json', 'events', 'list'],
      {
        GROUPI_API_KEY: 'secret-key-reflected',
        GROUPI_API_KEY_PROFILE: 'local',
      }
    );
    expect(result.code).toBe(exit);
    expect(result.stdout).toBe('');
    expect(JSON.parse(result.stderr).error.code).toBe(code);
    expect(result.stderr).not.toContain('secret-key-reflected');
    expect(requests).toBe(attempts);
  }
);

test('authenticated redirects are refused before contacting another host', async () => {
  let leaked = false;
  const other = await endpoint((_req, res) => {
    leaked = true;
    res.end('{}');
  });
  const url = await endpoint((_req, res) => {
    res.writeHead(302, { location: other + '/events' }).end();
  });
  await cli(['profile', 'add', 'local', '--api-url', url]);
  const result = await cli(
    ['--profile', 'local', '--format', 'json', 'events', 'list'],
    { GROUPI_API_KEY: 'secret', GROUPI_API_KEY_PROFILE: 'local' }
  );
  expect(JSON.parse(result.stderr).error.code).toBe('UNSAFE_REDIRECT');
  expect(result.code).toBe(5);
  expect(leaked).toBe(false);
});

test('event detail is readable by default and preserves the API document in JSON mode', async () => {
  const detail = {
    id: 'event-one',
    title: 'Dinner',
    description: 'Bring snacks',
    location: 'Park',
    timezone: 'America/New_York',
  };
  const url = await endpoint((req, res) => {
    if (req.url !== '/api/v2/events/event-one') {
      res.writeHead(404).end('{}');
      return;
    }
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(detail));
  });
  await cli(['profile', 'add', 'local', '--api-url', url]);
  const env = {
    GROUPI_API_KEY: 'local-secret',
    GROUPI_API_KEY_PROFILE: 'local',
  };
  const human = await cli(
    ['--profile', 'local', 'events', 'get', 'event-one'],
    env
  );
  expect(human.code).toBe(0);
  expect(human.stdout).toContain('Dinner');
  expect(human.stdout).toContain('Bring snacks');
  expect(human.stdout).toContain('Park');
  expect(human.stdout.trim().startsWith('{')).toBe(false);
  const json = await cli(
    ['--profile', 'local', '--format', 'json', 'events', 'get', 'event-one'],
    env
  );
  expect(JSON.parse(json.stdout)).toEqual(detail);
});

test('profile selection fails closed and persists no credentials', async () => {
  let requests = 0;
  const url = await endpoint((_req, res) => {
    requests++;
    res.end('{}');
  });
  await cli(['profile', 'add', 'local', '--api-url', url]);
  const result = await cli(
    ['--profile', 'local', '--format=json', 'events', 'list'],
    { GROUPI_API_KEY: 'hosted-secret' }
  );
  expect(result.code).toBe(3);
  expect(JSON.parse(result.stderr).error.code).toBe('KEY_PROFILE_MISMATCH');
  expect(requests).toBe(0);
  expect(
    JSON.parse(await readFile(join(config, 'local.json'), 'utf8'))
  ).toEqual({ apiUrl: url });
  expect(
    (
      await cli([
        'profile',
        'add',
        'local',
        '--api-url',
        'https://example.com/api/v2',
      ])
    ).code
  ).toBe(2);
});

test.each([
  'http://example.com/api/v2',
  'https://user:password@example.com/api/v2',
  'https://example.com/api/v2?token=secret',
  'file:///api/v2',
])('unsafe profile endpoint is rejected: %s', async url => {
  const result = await cli([
    '--format=json',
    'profile',
    'add',
    'unsafe',
    '--api-url',
    url,
  ]);
  expect(result.code).toBe(2);
  expect(JSON.parse(result.stderr).error.code).toBe('INVALID_ENDPOINT');
  expect(result.stderr).not.toContain('password');
  expect(result.stderr).not.toContain('token=secret');
});

test('reads recover from a temporary failure without leaking diagnostic text into JSON', async () => {
  let requests = 0;
  const url = await endpoint((_req, res) => {
    requests++;
    if (requests === 1) {
      res.writeHead(503, { 'retry-after': '0' }).end();
      return;
    }
    res.end(JSON.stringify({ items: [], nextCursor: null }));
  });
  await cli(['profile', 'add', 'local', '--api-url', url]);
  const result = await cli(
    [
      '--profile',
      'local',
      '--api-key-stdin',
      '--format=json',
      'events',
      'list',
    ],
    {},
    'key\n'
  );
  expect(result).toEqual({
    code: 0,
    stdout: '{"items":[],"nextCursor":null}\n',
    stderr: '',
  });
  expect(requests).toBe(2);
});

test('all retrieval rejects a repeated cursor instead of hanging or returning partial success', async () => {
  const url = await endpoint((_req, res) =>
    res.end(JSON.stringify({ items: [], nextCursor: 'repeat' }))
  );
  await cli(['profile', 'add', 'local', '--api-url', url]);
  const result = await cli(
    [
      '--profile',
      'local',
      '--api-key-stdin',
      '--format=json',
      'events',
      'list',
      '--all',
    ],
    {},
    'key'
  );
  expect(result.code).toBe(5);
  expect(result.stdout).toBe('');
  expect(JSON.parse(result.stderr).error.code).toBe('INVALID_RESPONSE');
});

test.each(
  [
    ['events', 'list'],
    ['invites', 'members', 'list'],
    ['notifications', 'list'],
    ['friends', 'list'],
    ['events', 'members', 'event1'],
    ['events', 'discover'],
    ['addons', 'list', 'event1'],
    ['discord', 'guilds', 'list'],
  ].map(command => ({ command, label: command.join(' ') }))
)(
  'bounded $label read rejects its repeated starting cursor without output',
  async ({ command }) => {
    let requests = 0;
    const url = await endpoint((req, res) => {
      if (req.url === '/api/v2/health') {
        res.end(
          JSON.stringify({
            capabilities: {
              notificationControls: { version: 1 },
              discordGuilds: { version: 1 },
            },
          })
        );
        return;
      }
      requests++;
      res.end(JSON.stringify({ items: [], nextCursor: 'start' }));
    }, false);
    await cli(['profile', 'add', 'local', '--api-url', url]);
    const result = await cli(
      [
        '--profile',
        'local',
        '--api-key-stdin',
        '--format=json',
        ...command,
        '--cursor',
        'start',
      ],
      {},
      'key'
    );
    expect(result.code).toBe(5);
    expect(result.stdout).toBe('');
    expect(JSON.parse(result.stderr).error.code).toBe('INVALID_RESPONSE');
    expect(requests).toBe(1);
  }
);

test.each([
  {
    page: {
      items: [
        { id: 'one', title: 'One' },
        { id: 'two', title: 'Two' },
      ],
      nextCursor: null,
    },
    all: false,
  },
  {
    page: {
      items: [
        { id: 'one', title: 'One' },
        { id: 'two', title: 'Two' },
      ],
      nextCursor: 'more',
    },
    all: true,
  },
  { page: { items: [] }, all: true },
  { page: { items: [{ id: 'invalid' }], nextCursor: null }, all: true },
])(
  'event pagination failure never emits partial success (all=$all, page=$page)',
  async ({ page, all }) => {
    let requests = 0;
    const url = await endpoint((_req, res) => {
      requests++;
      res.end(
        JSON.stringify(
          all && requests === 1
            ? { items: [{ id: 'valid', title: 'Valid' }], nextCursor: 'next' }
            : page
        )
      );
    });
    await cli(['profile', 'add', 'local', '--api-url', url]);
    const result = await cli(
      [
        '--profile',
        'local',
        '--api-key-stdin',
        '--format=json',
        'events',
        'list',
        '--limit',
        '1',
        ...(all ? ['--all'] : []),
      ],
      {},
      'key'
    );
    expect(result.code).toBe(5);
    expect(result.stdout).toBe('');
    expect(JSON.parse(result.stderr).error.code).toBe('INVALID_RESPONSE');
    expect(requests).toBe(all ? 2 : 1);
  }
);

test('a long Retry-After returns an actionable failure without retrying too early', async () => {
  let requests = 0;
  const url = await endpoint((_req, res) => {
    requests++;
    res.writeHead(429, { 'retry-after': '60' }).end();
  });
  await cli(['profile', 'add', 'local', '--api-url', url]);
  const result = await cli(
    [
      '--profile',
      'local',
      '--api-key-stdin',
      '--format=json',
      'events',
      'list',
    ],
    {},
    'key'
  );
  expect(JSON.parse(result.stderr).error.code).toBe('RATE_LIMITED');
  expect(requests).toBe(1);
}, 10000);

test('human detail output cannot emit terminal control codes from server field names', async () => {
  const url = await endpoint((_req, res) =>
    res.end(
      JSON.stringify({
        id: 'one',
        title: 'Dinner',
        '\u001b[2J': 'unexpected field',
      })
    )
  );
  await cli(['profile', 'add', 'local', '--api-url', url]);
  const result = await cli(
    ['--profile', 'local', '--api-key-stdin', 'events', 'get', 'one'],
    {},
    'key'
  );
  expect(result.code).toBe(0);
  expect(result.stdout).not.toContain('\u001b');
});

test('browser login refuses JSON and headless input without starting interaction', async () => {
  const result = await cli(['auth', 'login', '--format', 'json']);
  expect(result.code).toBe(3);
  expect(result.stdout).toBe('');
  expect(JSON.parse(result.stderr).error.code).toBe(
    'BROWSER_INTERACTION_REQUIRED'
  );
});

test('named profiles retain an explicit validated browser origin', async () => {
  const result = await cli([
    'profile',
    'add',
    'staging',
    '--api-url',
    'https://example.convex.site/api/v2',
    '--web-url',
    'https://app.example.com',
    '--format',
    'json',
  ]);
  expect(result.code).toBe(0);
  expect(JSON.parse(result.stdout).webUrl).toBe('https://app.example.com');
  expect(
    JSON.parse(await readFile(join(config, 'staging.json'), 'utf8'))
  ).toEqual({
    apiUrl: 'https://example.convex.site/api/v2',
    webUrl: 'https://app.example.com',
  });
});

test('authentication status verifies the selected account without printing its temporary key', async () => {
  const url = await endpoint((req, res) => {
    expect(req.url).toBe('/api/v2/profile');
    expect(req.headers['x-api-key']).toBe('status-secret');
    res.setHeader('content-type', 'application/json');
    res.end(
      JSON.stringify({
        userId: 'user-1',
        personId: 'person-1',
        name: 'Account',
        email: 'one@example.com',
      })
    );
  });
  await cli(['profile', 'add', 'local', '--api-url', url]);
  const result = await cli(
    ['--profile', 'local', 'auth', 'status', '--format', 'json'],
    { GROUPI_API_KEY: 'status-secret', GROUPI_API_KEY_PROFILE: 'local' }
  );
  expect(result.code).toBe(0);
  expect(JSON.parse(result.stdout)).toEqual({
    profile: 'local',
    apiUrl: url,
    source: 'environment',
    account: { id: 'user-1', name: 'Account', email: 'one@example.com' },
  });
  expect(result.stdout + result.stderr).not.toContain('status-secret');
});

test('logout removes only the selected saved credential and ignores temporary environment credentials', async () => {
  let requests = 0;
  const url = await endpoint((_req, res) => {
    requests++;
    res.end('{}');
  });
  await cli(['profile', 'add', 'local', '--api-url', url]);
  const result = await cli(
    ['--profile', 'local', 'auth', 'logout', '--format', 'json'],
    {
      GROUPI_API_KEY: 'unrelated-temporary-key',
      GROUPI_API_KEY_PROFILE: 'another',
      TEST_SAVED_CREDENTIAL: JSON.stringify({
        apiKey: 'saved-secret',
        expiresAt: Date.now() + 10000,
        account: { id: 'one', name: 'One', email: 'one@example.com' },
      }),
    }
  );
  expect(result.code).toBe(0);
  expect(JSON.parse(result.stdout)).toEqual({
    profile: 'local',
    removed: true,
    revoked: false,
  });
  expect(requests).toBe(0);
  expect(result.stdout + result.stderr).not.toMatch(
    /saved-secret|unrelated-temporary-key/
  );
});

test('an expired saved key requires explicit login without a network request', async () => {
  let requests = 0;
  const url = await endpoint((_req, res) => {
    requests++;
    res.end('{}');
  });
  await cli(['profile', 'add', 'local', '--api-url', url]);
  const result = await cli(
    ['--profile', 'local', 'events', 'list', '--format', 'json'],
    {
      TEST_SAVED_CREDENTIAL: JSON.stringify({
        apiKey: 'expired-secret',
        expiresAt: 1,
        account: { id: 'one', name: 'One', email: 'one@example.com' },
      }),
    }
  );
  expect(result.code).toBe(3);
  expect(JSON.parse(result.stderr).error.code).toBe('AUTH_EXPIRED');
  expect(result.stdout).toBe('');
  expect(requests).toBe(0);
});

test('saved-key status rejects an account mismatch instead of silently changing identity', async () => {
  const url = await endpoint((_req, res) => {
    res.setHeader('content-type', 'application/json');
    res.end(
      JSON.stringify({
        userId: 'other',
        name: 'Other',
        email: 'other@example.com',
      })
    );
  });
  await cli(['profile', 'add', 'local', '--api-url', url]);
  const result = await cli(
    ['--profile', 'local', 'auth', 'status', '--format', 'json'],
    {
      TEST_SAVED_CREDENTIAL: JSON.stringify({
        apiKey: 'saved-secret',
        expiresAt: Date.now() + 10000,
        account: { id: 'one', name: 'One', email: 'one@example.com' },
      }),
    }
  );
  expect(result.code).toBe(3);
  expect(JSON.parse(result.stderr).error.code).toBe('ACCOUNT_MISMATCH');
  expect(result.stdout).toBe('');
});

test('logout --revoke revokes the saved key rather than an environment override', async () => {
  const keys: (string | string[] | undefined)[] = [];
  const url = await endpoint((req, res) => {
    keys.push(req.headers['x-api-key']);
    expect(req.url).toBe('/api/v2/auth/cli/revoke');
    res.setHeader('content-type', 'application/json');
    res.end('{}');
  });
  await cli(['profile', 'add', 'local', '--api-url', url]);
  const result = await cli(
    ['--profile', 'local', 'auth', 'logout', '--revoke', '--format', 'json'],
    {
      GROUPI_API_KEY: 'temporary-secret',
      GROUPI_API_KEY_PROFILE: 'local',
      TEST_SAVED_CREDENTIAL: JSON.stringify({
        apiKey: 'saved-secret',
        expiresAt: Date.now() + 10000,
        account: { id: 'one', name: 'One', email: 'one@example.com' },
      }),
    }
  );
  expect(result.code).toBe(0);
  expect(keys).toEqual(['saved-secret']);
  expect(JSON.parse(result.stdout)).toEqual({
    profile: 'local',
    removed: true,
    revoked: true,
  });
});

test('creates an event headlessly with a reusable request identifier and JSON result', async () => {
  const writes: {
    method?: string;
    requestId?: string | string[];
    body: unknown;
  }[] = [];
  const url = await endpoint(async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;
    writes.push({
      method: req.method,
      requestId: req.headers['idempotency-key'],
      body: JSON.parse(body),
    });
    res.writeHead(201, { 'content-type': 'application/json' });
    res.end(
      JSON.stringify({
        eventId: 'event-created',
        membershipId: 'membership-organizer',
      })
    );
  });
  await cli(['profile', 'add', 'local', '--api-url', url]);
  const result = await cli(
    [
      'events',
      'create',
      '--title',
      'Dinner',
      '--profile',
      'local',
      '--format',
      'json',
    ],
    { GROUPI_API_KEY: 'local-secret', GROUPI_API_KEY_PROFILE: 'local' }
  );
  expect(result.code).toBe(0);
  expect(result.stderr).toBe('');
  const output = JSON.parse(result.stdout);
  expect(output).toEqual({
    eventId: 'event-created',
    membershipId: 'membership-organizer',
    requestId: expect.stringMatching(/^\d{13}\.[0-9a-f-]{36}$/),
  });
  expect(writes).toEqual([
    { method: 'POST', requestId: output.requestId, body: { title: 'Dinner' } },
  ]);
  expect(result.stdout).not.toContain('local-secret');
});

test('replays event creation after a lost response using the same request identifier and payload', async () => {
  const writes: { id: unknown; body: string }[] = [];
  const url = await endpoint(async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;
    writes.push({ id: req.headers['idempotency-key'], body });
    if (writes.length === 1) {
      req.socket.destroy();
      return;
    }
    res.writeHead(201, { 'content-type': 'application/json' });
    res.end(
      JSON.stringify({ eventId: 'one-event', membershipId: 'one-organizer' })
    );
  });
  await cli(['profile', 'add', 'local', '--api-url', url]);
  const id = `${Date.now()}.b5222690-666a-4cfc-92b8-a4a9c4572184`;
  const result = await cli(
    [
      'events',
      'create',
      '--title',
      'Dinner',
      '--request-id',
      id,
      '--profile',
      'local',
      '--format',
      'json',
    ],
    { GROUPI_API_KEY: 'secret', GROUPI_API_KEY_PROFILE: 'local' }
  );
  expect(result.code).toBe(0);
  expect(JSON.parse(result.stdout)).toEqual({
    eventId: 'one-event',
    membershipId: 'one-organizer',
    requestId: id,
  });
  expect(writes).toEqual([
    { id, body: '{"title":"Dinner"}' },
    { id, body: '{"title":"Dinner"}' },
  ]);
});

test('creates an event with explicit offset date inputs and basic details', async () => {
  let payload: unknown;
  const url = await endpoint(async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;
    payload = JSON.parse(body);
    res.writeHead(201, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ eventId: 'dinner', membershipId: 'organizer' }));
  });
  await cli(['profile', 'add', 'local', '--api-url', url]);
  const result = await cli(
    [
      'events',
      'create',
      '--title',
      'Dinner',
      '--description',
      'Bring snacks',
      '--location',
      'Cafe',
      '--start',
      '2027-03-05T18:00:00-05:00',
      '--end',
      '2027-03-05T20:00:00-05:00',
      '--profile',
      'local',
      '--format',
      'json',
    ],
    { GROUPI_API_KEY: 'secret', GROUPI_API_KEY_PROFILE: 'local' }
  );
  expect(result.code).toBe(0);
  expect(payload).toEqual({
    title: 'Dinner',
    description: 'Bring snacks',
    location: 'Cafe',
    chosenDateTime: '2027-03-05T18:00:00-05:00',
    chosenEndDateTime: '2027-03-05T20:00:00-05:00',
  });
});

test('edits basic event details and reports lost responses without repeating the write', async () => {
  let attempts = 0;
  let storedTitle = 'Before';
  const url = await endpoint(async (req, res) => {
    attempts++;
    let body = '';
    for await (const chunk of req) body += chunk;
    expect(req.method).toBe('PATCH');
    expect(req.url).toBe('/api/v2/events/event-1');
    storedTitle = JSON.parse(body).title;
    req.socket.destroy();
  });
  await cli(['profile', 'add', 'local', '--api-url', url]);
  const result = await cli(
    [
      'events',
      'edit',
      'event-1',
      '--title',
      'After',
      '--profile',
      'local',
      '--format',
      'json',
    ],
    { GROUPI_API_KEY: 'secret', GROUPI_API_KEY_PROFILE: 'local' }
  );
  expect(result.code).toBe(5);
  expect(result.stdout).toBe('');
  expect(JSON.parse(result.stderr).error).toEqual({
    code: 'UNCERTAIN_OUTCOME',
    message: expect.stringContaining('events get event-1'),
  });
  expect(storedTitle).toBe('After');
  expect(attempts).toBe(1);
});

test.each([
  ['events', 'create', '--title', '   '],
  ['events', 'create', '--title', 'Dinner', '--start', '2027-03-05T18:00:00'],
  ['events', 'create', '--title', 'Dinner', '--start', '2027-02-30T18:00:00Z'],
  ['events', 'create', '--title', 'Dinner', '--end', '2027-03-05T20:00:00Z'],
  [
    'events',
    'create',
    '--title',
    'Dinner',
    '--start',
    '2027-03-05T20:00:00Z',
    '--end',
    '2027-03-05T18:00:00Z',
  ],
  ['events', 'create', '--title', 'Dinner', '--request-id', 'invalid'],
  ['events', 'edit', 'event-1'],
  ['events', 'edit', 'event-1', '--title', ' '],
])(
  'rejects invalid event input before sending any request: %j',
  async (...args) => {
    let requests = 0;
    const url = await endpoint((_req, res) => {
      requests++;
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(
        JSON.stringify({
          eventId: 'unexpected',
          membershipId: 'unexpected',
          id: 'unexpected',
          title: 'unexpected',
        })
      );
    });
    await cli(['profile', 'add', 'local', '--api-url', url]);
    const result = await cli(
      [...args, '--profile', 'local', '--format', 'json'],
      { GROUPI_API_KEY: 'secret', GROUPI_API_KEY_PROFILE: 'local' }
    );
    expect(result.code).toBe(2);
    expect(JSON.parse(result.stderr).error.code).toBe('USAGE');
    expect(result.stdout).toBe('');
    expect(requests).toBe(0);
  }
);

test('replacing proposed dates requires explicit headless confirmation and preserves option notes', async () => {
  const writes: unknown[] = [];
  const url = await endpoint(async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;
    writes.push(JSON.parse(body));
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(
      JSON.stringify({
        id: 'event-1',
        title: 'Dinner',
        potentialDateTimeOptions: [
          { id: 'option-1', start: 1804302000000, end: null, note: 'Early' },
        ],
      })
    );
  });
  await cli(['profile', 'add', 'local', '--api-url', url]);
  const args = [
    'events',
    'edit',
    'event-1',
    '--date-options',
    '[{"start":"2027-03-05T18:00:00-05:00","note":"Early"}]',
    '--profile',
    'local',
    '--format',
    'json',
  ];
  const env = { GROUPI_API_KEY: 'secret', GROUPI_API_KEY_PROFILE: 'local' };
  const rejected = await cli(args, env);
  expect(rejected.code).toBe(2);
  expect(JSON.parse(rejected.stderr).error.code).toBe('CONFIRMATION_REQUIRED');
  expect(writes).toEqual([]);
  const accepted = await cli([...args, '--yes'], env);
  expect(accepted.code).toBe(0);
  expect(accepted.stderr).toBe('');
  expect(JSON.parse(accepted.stdout).potentialDateTimeOptions[0].note).toBe(
    'Early'
  );
  expect(writes).toEqual([
    {
      potentialDateTimeOptions: [
        { start: '2027-03-05T18:00:00-05:00', note: 'Early' },
      ],
    },
  ]);
});

test('refuses to create against an older server that cannot guarantee safe replay', async () => {
  let writes = 0;
  const url = await endpoint((req, res) => {
    res.writeHead(200, { 'content-type': 'application/json' });
    if (req.method === 'GET')
      res.end(JSON.stringify({ status: 'ok', version: '2.0.0' }));
    else {
      writes++;
      res.end(JSON.stringify({ eventId: 'unsafe', membershipId: 'unsafe' }));
    }
  }, false);
  await cli(['profile', 'add', 'local', '--api-url', url]);
  const result = await cli(
    [
      'events',
      'create',
      '--title',
      'Dinner',
      '--profile',
      'local',
      '--format',
      'json',
    ],
    { GROUPI_API_KEY: 'secret', GROUPI_API_KEY_PROFILE: 'local' }
  );
  expect(result.code).toBe(5);
  expect(JSON.parse(result.stderr).error.code).toBe('UNSUPPORTED_SERVER');
  expect(writes).toBe(0);
});

test.each(['no\n', '', '\u0003'])(
  'interactive proposed-date replacement cancels without a write on decline or closed input: %j',
  async answer => {
    let writes = 0;
    const url = await endpoint((_req, res) => {
      writes++;
      res.end('{}');
    });
    await cli(['profile', 'add', 'local', '--api-url', url]);
    const result = await cli(
      [
        'events',
        'edit',
        'event-1',
        '--date-options',
        '[]',
        '--profile',
        'local',
      ],
      { GROUPI_API_KEY: 'secret', GROUPI_API_KEY_PROFILE: 'local' },
      answer,
      true
    );
    expect(result.code).toBe(2);
    expect(result.stdout).toBe('');
    expect(result.stderr).toContain('event-1 on profile local');
    expect(result.stderr).toContain('CANCELLED');
    expect(writes).toBe(0);
  }
);

test('explains that fixed events need an explicit date reset before replacing proposals', async () => {
  let writes = 0;
  const url = await endpoint((_req, res) => {
    writes++;
    res.writeHead(409, { 'content-type': 'application/json' });
    res.end(
      JSON.stringify({
        error: { code: 'DATE_RESET_REQUIRED', message: 'Do not echo secret' },
      })
    );
  });
  await cli(['profile', 'add', 'local', '--api-url', url]);
  const result = await cli(
    [
      'events',
      'edit',
      'event-1',
      '--date-options',
      '[]',
      '--yes',
      '--profile',
      'local',
      '--format',
      'json',
    ],
    { GROUPI_API_KEY: 'secret', GROUPI_API_KEY_PROFILE: 'local' }
  );
  expect(result.code).toBe(2);
  expect(writes).toBe(1);
  expect(JSON.parse(result.stderr).error.code).toBe('DATE_RESET_REQUIRED');
  expect(JSON.parse(result.stderr).error.message).toContain(
    'Reset the confirmed date'
  );
  expect(result.stderr).not.toContain('secret');
});

test('refuses edits against older servers that silently ignore new fields', async () => {
  let writes = 0;
  const url = await endpoint((req, res) => {
    res.writeHead(200, { 'content-type': 'application/json' });
    if (req.method === 'GET')
      res.end(JSON.stringify({ status: 'ok', version: '2.0.0' }));
    else {
      writes++;
      res.end(JSON.stringify({ id: 'event-1', title: 'Unchanged' }));
    }
  }, false);
  await cli(['profile', 'add', 'local', '--api-url', url]);
  const result = await cli(
    [
      'events',
      'edit',
      'event-1',
      '--title',
      'Updated',
      '--profile',
      'local',
      '--format',
      'json',
    ],
    { GROUPI_API_KEY: 'secret', GROUPI_API_KEY_PROFILE: 'local' }
  );
  expect(result.code).toBe(5);
  expect(JSON.parse(result.stderr).error.code).toBe('UNSUPPORTED_SERVER');
  expect(writes).toBe(0);
});

test('does not claim an edit succeeded when the response names a different event', async () => {
  const url = await endpoint((_req, res) => {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ id: 'another-event', title: 'Unrelated' }));
  });
  await cli(['profile', 'add', 'local', '--api-url', url]);
  const result = await cli(
    [
      'events',
      'edit',
      'event-1',
      '--title',
      'Updated',
      '--profile',
      'local',
      '--format',
      'json',
    ],
    { GROUPI_API_KEY: 'secret', GROUPI_API_KEY_PROFILE: 'local' }
  );
  expect(result.code).toBe(5);
  expect(result.stdout).toBe('');
  expect(JSON.parse(result.stderr).error.code).toBe('UNCERTAIN_OUTCOME');
});

test('exhausted creation retries preserve the identifier in actionable recovery output', async () => {
  const ids: unknown[] = [];
  const url = await endpoint(req => {
    ids.push(req.headers['idempotency-key']);
    req.socket.destroy();
  });
  await cli(['profile', 'add', 'local', '--api-url', url]);
  const result = await cli(
    [
      'events',
      'create',
      '--title',
      'Dinner',
      '--profile',
      'local',
      '--format',
      'json',
    ],
    { GROUPI_API_KEY: 'secret', GROUPI_API_KEY_PROFILE: 'local' }
  );
  expect(result.code).toBe(5);
  expect(result.stdout).toBe('');
  expect(ids).toHaveLength(3);
  expect(new Set(ids).size).toBe(1);
  const failure = JSON.parse(result.stderr).error;
  expect(failure.code).toBe('UNCERTAIN_OUTCOME');
  expect(failure.message).toContain(`--request-id ${ids[0]}`);
  expect(failure.message).toContain('profile local');
  expect(result.stderr).not.toContain('secret');
});

test.each([
  [400, 'VALIDATION_ERROR', 2, 'USAGE'],
  [401, 'UNAUTHORIZED', 3, 'AUTH_REQUIRED'],
  [403, 'FORBIDDEN', 3, 'FORBIDDEN'],
  [404, 'NOT_FOUND', 4, 'NOT_FOUND'],
  [409, 'IDEMPOTENCY_CONFLICT', 2, 'IDEMPOTENCY_CONFLICT'],
  [409, 'IDEMPOTENCY_EXPIRED', 2, 'IDEMPOTENCY_EXPIRED'],
  [429, 'RATE_LIMITED', 5, 'RATE_LIMITED'],
])(
  'creation handles explicit HTTP %i rejection without retry or reflected secrets',
  async (status, serverCode, exitCode, code) => {
    let writes = 0;
    const url = await endpoint((_req, res) => {
      writes++;
      res.writeHead(status, {
        'content-type': 'application/json',
        'retry-after': '60',
      });
      res.end(
        JSON.stringify({
          error: { code: serverCode, message: 'reflected secret' },
        })
      );
    });
    await cli(['profile', 'add', 'local', '--api-url', url]);
    const result = await cli(
      [
        'events',
        'create',
        '--title',
        'Dinner',
        '--profile',
        'local',
        '--format',
        'json',
      ],
      { GROUPI_API_KEY: 'secret', GROUPI_API_KEY_PROFILE: 'local' }
    );
    expect(result.code).toBe(exitCode);
    expect(writes).toBe(1);
    expect(result.stdout).toBe('');
    expect(JSON.parse(result.stderr).error.code).toBe(code);
    expect(result.stderr).not.toContain('secret');
  }
);

test('creation refuses redirects without forwarding credentials or retrying the write', async () => {
  let leaked = 0;
  let writes = 0;
  const other = await endpoint((_req, res) => {
    leaked++;
    res.end('{}');
  });
  const url = await endpoint((_req, res) => {
    writes++;
    res.writeHead(307, { location: other + '/events' });
    res.end();
  });
  await cli(['profile', 'add', 'local', '--api-url', url]);
  const result = await cli(
    [
      'events',
      'create',
      '--title',
      'Dinner',
      '--profile',
      'local',
      '--format',
      'json',
    ],
    { GROUPI_API_KEY: 'secret', GROUPI_API_KEY_PROFILE: 'local' }
  );
  expect(result.code).toBe(5);
  expect(JSON.parse(result.stderr).error.code).toBe('UNCERTAIN_OUTCOME');
  expect(writes).toBe(1);
  expect(leaked).toBe(0);
});

test('interactive confirmation identifies the target and applies one accepted replacement', async () => {
  let writes = 0;
  const url = await endpoint((_req, res) => {
    writes++;
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ id: 'event-1', title: 'Dinner' }));
  });
  await cli(['profile', 'add', 'local', '--api-url', url]);
  const result = await cli(
    ['events', 'edit', 'event-1', '--date-options', '[]', '--profile', 'local'],
    { GROUPI_API_KEY: 'secret', GROUPI_API_KEY_PROFILE: 'local' },
    'yes\n',
    true
  );
  expect(result.code).toBe(0);
  expect(writes).toBe(1);
  expect(result.stderr).toContain('clearing existing availability');
  expect(result.stderr).toContain(`event-1 on profile local (${url})`);
  expect(result.stdout).toBe('Updated event event-1: Dinner\n');
});
