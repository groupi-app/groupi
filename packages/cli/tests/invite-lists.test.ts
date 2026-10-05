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
const summary = {
  inviteListId: 'list-1',
  name: 'Dinner',
  personCount: 2,
  availablePersonCount: 2,
  needsAttention: false,
  createdAt: 1,
  updatedAt: 1,
};
const person = {
  personId: 'person-1',
  name: 'Guest',
  username: 'guest',
  image: null,
  available: true,
};
const detail = {
  ...summary,
  people: [person, { ...person, personId: 'person-2', username: 'other' }],
};
beforeEach(async () => {
  config = await mkdtemp(join(tmpdir(), 'groupi-invite-lists-'));
});
afterEach(async () => {
  for (const server of servers.splice(0))
    await new Promise<void>(done => server.close(() => done()));
  await rm(config, { recursive: true, force: true });
});
async function endpoint(
  handler: (req: IncomingMessage, res: ServerResponse) => void,
  capability = true,
  version = 1,
  retentionMs = 86400000
) {
  const server = createServer((req, res) => {
    res.setHeader('content-type', 'application/json');
    if (req.url === '/api/v2/health')
      res.end(
        JSON.stringify({
          capabilities: capability
            ? {
                inviteLists: {
                  version,
                  ...(version >= 2 ? { retentionMs } : {}),
                },
              }
            : {},
        })
      );
    else handler(req, res);
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
          'invite-lists',
          ...args,
        ],
        {
          env: {
            ...process.env,
            GROUPI_CONFIG_DIR: config,
            GROUPI_API_KEY: 'synthetic-invite-list-key',
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

test('creates a private invite list with a trimmed name and distinct existing people', async () => {
  const requests: unknown[] = [];
  await endpoint(async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;
    requests.push({
      path: req.url,
      method: req.method,
      key: req.headers['x-api-key'],
      body: JSON.parse(body),
      requestId: req.headers['idempotency-key'],
    });
    res.statusCode = 201;
    res.end(
      JSON.stringify({
        ...detail,
        apiKey: 'never-print',
        ownerId: 'never-print-owner',
      })
    );
  });
  const result = await cli([
    'create',
    '--name',
    '  Dinner  ',
    '--person-ids',
    '["person-1","person-2","person-1"]',
  ]);
  expect(result).toEqual({
    code: 0,
    stdout: JSON.stringify(detail) + '\n',
    stderr: '',
  });
  expect(requests).toEqual([
    {
      path: '/api/v2/invite-lists',
      method: 'POST',
      key: 'synthetic-invite-list-key',
      body: { name: 'Dinner', personIds: ['person-1', 'person-2'] },
      requestId: undefined,
    },
  ]);
});

test('browses owned lists and inspects current people without leaking extra server fields', async () => {
  const paths: string[] = [];
  await endpoint((req, res) => {
    paths.push(req.url!);
    res.end(
      JSON.stringify(
        req.url === '/api/v2/invite-lists'
          ? { items: [{ ...summary, ownerId: 'secret' }], apiKey: 'secret' }
          : {
              ...detail,
              people: detail.people.map(row => ({
                ...row,
                email: 'private@example.com',
              })),
            }
      )
    );
  });
  const collection = await cli(['list']);
  expect(collection).toEqual({
    code: 0,
    stdout: JSON.stringify({ items: [summary] }) + '\n',
    stderr: '',
  });
  const inspected = await cli(['get', 'list-1']);
  expect(inspected).toEqual({
    code: 0,
    stdout: JSON.stringify(detail) + '\n',
    stderr: '',
  });
  expect(paths).toEqual([
    '/api/v2/invite-lists',
    '/api/v2/invite-lists/list-1',
  ]);
});

test('discovers existing users by username and accepted friends without an event prerequisite', async () => {
  const paths: string[] = [];
  await endpoint((req, res) => {
    paths.push(req.url!);
    res.end(
      JSON.stringify({
        items: [{ ...person, email: 'private@example.com', isFriend: false }],
      })
    );
  });
  for (const args of [
    ['people', '--search', '  gu  '],
    ['people', '--friends'],
  ]) {
    expect(await cli(args)).toEqual({
      code: 0,
      stdout: JSON.stringify({ items: [person] }) + '\n',
      stderr: '',
    });
  }
  expect(paths).toEqual([
    '/api/v2/invite-lists/people/search?q=gu',
    '/api/v2/invite-lists/people/friends',
  ]);
});

test.each([
  ['create', '--name', '  ', '--person-ids', '["person-1"]'],
  ['create', '--name', 'x'.repeat(101), '--person-ids', '["person-1"]'],
  ['create', '--name', 'Dinner', '--person-ids', '[]'],
  ['create', '--name', 'Dinner', '--person-ids', 'not-json'],
  ['create', '--name', 'Dinner', '--person-ids', '{"personId":"person-1"}'],
  ['create', '--name', 'Dinner', '--person-ids', '["../other"]'],
  ['create', '--name', 'Dinner', '--person-ids', '[1]'],
  [
    'create',
    '--name',
    'Dinner',
    '--person-ids',
    JSON.stringify(Array.from({ length: 101 }, (_, i) => `person-${i}`)),
  ],
  [
    'create',
    '--name',
    'Dinner',
    '--person-ids',
    '["person-1"]',
    '--owner-id',
    'other',
  ],
  [
    'create',
    '--name',
    'Dinner',
    '--person-ids',
    '["person-1"]',
    '--request-id',
    'unsupported',
  ],
  ['get', '../other'],
  ['people'],
  ['people', '--search', 'a'],
  ['people', '--search', 'guest', '--friends'],
])(
  'rejects invalid invite list inputs before submitting a request: %j',
  async (...args) => {
    const requests: string[] = [];
    await endpoint((req, res) => {
      requests.push(req.url!);
      res.end('{}');
    });
    const result = await cli(args);
    expect(result.code).toBe(2);
    expect(result.stdout).toBe('');
    expect(JSON.parse(result.stderr).error.code).toBe('USAGE');
    expect(requests).toEqual([]);
  }
);

test.each([
  ['list'],
  ['get', 'list-1'],
  ['people', '--friends'],
  ['create', '--name', 'Dinner', '--person-ids', '["person-1"]'],
])(
  'requires advertised private invite list capability: %j',
  async (...args) => {
    const requests: string[] = [];
    await endpoint((req, res) => {
      requests.push(req.url!);
      res.end('{}');
    }, false);
    const result = await cli(args);
    expect(result.code).toBe(5);
    expect(JSON.parse(result.stderr).error.code).toBe('UNSUPPORTED_SERVER');
    expect(result.stdout).toBe('');
    expect(requests).toEqual([]);
  }
);

test.each([
  [400, 'USAGE', 2],
  [403, 'FORBIDDEN', 3],
  [409, 'CONFLICT', 2],
  [404, 'NOT_FOUND', 4],
])(
  'creation HTTP %s returns a structured safe error',
  async (status, code, exit) => {
    await endpoint((_req, res) => {
      res.statusCode = Number(status);
      res.end(
        JSON.stringify({
          error: {
            code: 'PRIVATE_ERROR',
            message: 'synthetic-invite-list-key',
          },
        })
      );
    });
    const result = await cli([
      'create',
      '--name',
      'Dinner',
      '--person-ids',
      '["person-1"]',
    ]);
    expect(result.code).toBe(exit);
    expect(JSON.parse(result.stderr).error.code).toBe(code);
    expect(result.stdout).toBe('');
    expect(result.stderr).not.toContain('synthetic-invite-list-key');
  }
);

test('an uncertain creation is sent once and tells the caller to inspect owned lists', async () => {
  let attempts = 0;
  await endpoint(req => {
    attempts++;
    req.socket.destroy();
  });
  const result = await cli([
    'create',
    '--name',
    'Dinner',
    '--person-ids',
    '["person-1"]',
  ]);
  expect(result.code).toBe(5);
  expect(JSON.parse(result.stderr).error.code).toBe('UNCERTAIN_OUTCOME');
  expect(result.stderr).toContain('invite-lists list --profile test');
  expect(result.stdout).toBe('');
  expect(attempts).toBe(1);
});

test('incomplete successful creation output remains an uncertain outcome', async () => {
  await endpoint((_req, res) => {
    res.statusCode = 201;
    res.end('{"inviteListId":"list-1"}');
  });
  const result = await cli([
    'create',
    '--name',
    'Dinner',
    '--person-ids',
    '["person-1"]',
  ]);
  expect(result.code).toBe(5);
  expect(JSON.parse(result.stderr).error.code).toBe('UNCERTAIN_OUTCOME');
  expect(result.stderr).toContain('invite-lists list');
  expect(result.stdout).toBe('');
});

test('text output strips terminal controls and anonymizes unavailable profiles', async () => {
  await endpoint((_req, res) =>
    res.end(
      JSON.stringify({
        ...summary,
        name: 'Dinner\u001b[2J',
        personCount: 1,
        availablePersonCount: 0,
        needsAttention: true,
        people: [
          {
            ...person,
            available: false,
            name: 'deleted name',
            username: 'deleted username',
            image: 'deleted image',
          },
        ],
      })
    )
  );
  const result = await cli(['get', 'list-1'], false);
  expect(result.code).toBe(0);
  expect(result.stdout).toContain('Dinner [2J');
  expect(result.stdout).toContain('needsAttention: true');
  expect(result.stdout).not.toContain('\u001b');
  expect(result.stdout).not.toContain('deleted');
});

test('edits an owned list with partial name or people changes and accepts v2 for foundation reads', async () => {
  const requests: unknown[] = [];
  await endpoint(
    async (req, res) => {
      if (req.method === 'GET') {
        res.end(JSON.stringify(detail));
        return;
      }
      let body = '';
      for await (const chunk of req) body += chunk;
      requests.push({
        path: req.url,
        method: req.method,
        body: JSON.parse(body),
        requestId: req.headers['idempotency-key'],
      });
      res.end(JSON.stringify({ ...detail, ...JSON.parse(body) }));
    },
    true,
    2
  );
  expect((await cli(['get', 'list-1'])).code).toBe(0);
  const renamed = await cli(['edit', 'list-1', '--name', '  Weekend  ']);
  expect(renamed.code).toBe(0);
  expect(JSON.parse(renamed.stdout)).toEqual({ ...detail, name: 'Weekend' });
  expect(renamed.stderr).toBe('');
  const selected = await cli([
    'edit',
    'list-1',
    '--person-ids',
    '["person-2","person-1","person-2"]',
  ]);
  expect(selected.code).toBe(0);
  expect(JSON.parse(selected.stdout)).toEqual(detail);
  expect(selected.stderr).toBe('');
  expect(requests).toEqual([
    {
      path: '/api/v2/invite-lists/list-1',
      method: 'PATCH',
      body: { name: 'Weekend' },
      requestId: undefined,
    },
    {
      path: '/api/v2/invite-lists/list-1',
      method: 'PATCH',
      body: { personIds: ['person-2', 'person-1'] },
      requestId: undefined,
    },
  ]);
});

test('deleting a private list requires destructive confirmation and returns the server receipt', async () => {
  const writes: unknown[] = [];
  await endpoint(
    (req, res) => {
      writes.push({
        path: req.url,
        method: req.method,
        requestId: req.headers['idempotency-key'],
      });
      res.end(
        JSON.stringify({
          deleted: true,
          inviteListId: 'list-1',
          apiKey: 'never-print',
        })
      );
    },
    true,
    2
  );
  for (const json of [true, false]) {
    const denied = await cli(['delete', 'list-1'], json);
    expect(denied.code).toBe(2);
    expect(denied.stdout).toBe('');
    expect(denied.stderr).toContain(json ? 'CONFIRMATION_REQUIRED' : '--yes');
  }
  expect(writes).toEqual([]);
  const result = await cli(['delete', 'list-1', '--yes']);
  expect(result).toEqual({
    code: 0,
    stdout: '{"deleted":true,"inviteListId":"list-1"}\n',
    stderr: '',
  });
  expect(writes).toEqual([
    {
      path: '/api/v2/invite-lists/list-1',
      method: 'DELETE',
      requestId: undefined,
    },
  ]);
});

test.each([
  ['edit', 'list-1'],
  ['edit', 'list-1', '--name', ' '],
  ['edit', 'list-1', '--name', 'x'.repeat(101)],
  ['edit', 'list-1', '--person-ids', '[]'],
  ['edit', 'list-1', '--person-ids', '[false]'],
  [
    'edit',
    'list-1',
    '--person-ids',
    JSON.stringify(Array.from({ length: 101 }, (_, i) => `person-${i}`)),
  ],
  ['edit', '../other', '--name', 'Dinner'],
  ['delete', '../other', '--yes'],
])('rejects invalid management input before sending: %j', async (...args) => {
  const requests: string[] = [];
  await endpoint(
    (req, res) => {
      requests.push(req.url!);
      res.end('{}');
    },
    true,
    2
  );
  const result = await cli(args);
  expect(result.code).toBe(2);
  expect(JSON.parse(result.stderr).error.code).toBe('USAGE');
  expect(requests).toEqual([]);
});

test.each([
  ['edit', 'list-1', '--name', 'Dinner'],
  ['delete', 'list-1', '--yes'],
])('management refuses foundation-only capabilities: %j', async (...args) => {
  const writes: string[] = [];
  await endpoint((req, res) => {
    writes.push(req.url!);
    res.end('{}');
  });
  const result = await cli(args);
  expect(result.code).toBe(5);
  expect(JSON.parse(result.stderr).error.code).toBe('UNSUPPORTED_SERVER');
  expect(writes).toEqual([]);
});

test.each([
  ['edit', 'list-1', '--name', 'Dinner'],
  ['delete', 'list-1', '--yes'],
])(
  'uncertain management writes are sent once with inspection guidance: %j',
  async (...args) => {
    let attempts = 0;
    await endpoint(
      req => {
        attempts++;
        req.socket.destroy();
      },
      true,
      2
    );
    const result = await cli(args);
    expect(result.code).toBe(5);
    expect(JSON.parse(result.stderr).error.code).toBe('UNCERTAIN_OUTCOME');
    expect(result.stderr).toContain('invite-lists get list-1 --profile test');
    expect(result.stdout).toBe('');
    expect(attempts).toBe(1);
  }
);

test.each([400, 403, 404, 409])(
  'management HTTP %s rejects without a success payload or private error details',
  async status => {
    await endpoint(
      (_req, res) => {
        res.statusCode = status;
        res.end(
          '{"error":{"code":"PRIVATE","message":"synthetic-invite-list-key"}}'
        );
      },
      true,
      2
    );
    for (const args of [
      ['edit', 'list-1', '--name', 'Weekend'],
      ['delete', 'list-1', '--yes'],
    ]) {
      const result = await cli(args);
      expect(result.code).toBe(status === 403 ? 3 : status === 404 ? 4 : 2);
      expect(result.stdout).toBe('');
      expect(result.stderr).not.toContain('synthetic-invite-list-key');
    }
  }
);

test('explicitly invites a list in one REST operation with role, REST-length message, and retained request ID', async () => {
  const requests: unknown[] = [];
  const requestId = `${Date.now()}.b5222690-666a-4cfc-92b8-a4a9c4572184`;
  const result = {
    eventId: 'event-1',
    totalCount: 3,
    sentCount: 1,
    skippedCount: 2,
    results: [
      { personId: 'person-1', status: 'sent', inviteId: 'invite-1' },
      { personId: 'person-2', status: 'skipped', reason: 'ALREADY_MEMBER' },
      { personId: 'person-3', status: 'skipped', reason: 'UNAVAILABLE' },
    ],
  };
  await endpoint(
    async (req, res) => {
      let body = '';
      for await (const chunk of req) body += chunk;
      requests.push({
        path: req.url,
        method: req.method,
        body: JSON.parse(body),
        requestId: req.headers['idempotency-key'],
      });
      res.end(
        JSON.stringify({
          ...result,
          apiKey: 'never-print',
          results: result.results.map(row => ({
            ...row,
            privateReason: 'never-print',
          })),
        })
      );
    },
    true,
    2
  );
  const outcome = await cli([
    'invite',
    'list-1',
    '--event',
    'event-1',
    '--role',
    'MODERATOR',
    '--message',
    'm'.repeat(320),
    '--request-id',
    requestId,
  ]);
  expect(outcome).toEqual({
    code: 0,
    stdout: JSON.stringify({ ...result, requestId }) + '\n',
    stderr: '',
  });
  expect(requests).toEqual([
    {
      path: '/api/v2/invite-lists/list-1/invite-to-event',
      method: 'POST',
      body: { eventId: 'event-1', role: 'MODERATOR', message: 'm'.repeat(320) },
      requestId,
    },
  ]);
});

test('a lost list-invitation response retries the identical request and default Attendee role', async () => {
  const writes: unknown[] = [];
  const requestId = `${Date.now()}.b5222690-666a-4cfc-92b8-a4a9c4572184`;
  const result = {
    eventId: 'event-1',
    totalCount: 1,
    sentCount: 1,
    skippedCount: 0,
    results: [{ personId: 'person-1', status: 'sent', inviteId: 'invite-1' }],
  };
  await endpoint(
    async (req, res) => {
      let body = '';
      for await (const chunk of req) body += chunk;
      writes.push({
        path: req.url,
        body: JSON.parse(body),
        requestId: req.headers['idempotency-key'],
      });
      if (writes.length === 1) {
        req.socket.destroy();
        return;
      }
      res.end(JSON.stringify(result));
    },
    true,
    2
  );
  const outcome = await cli([
    'invite',
    'list-1',
    '--event',
    'event-1',
    '--request-id',
    requestId,
  ]);
  expect(outcome).toEqual({
    code: 0,
    stdout: JSON.stringify({ ...result, requestId }) + '\n',
    stderr: '',
  });
  expect(writes).toEqual([
    {
      path: '/api/v2/invite-lists/list-1/invite-to-event',
      body: { eventId: 'event-1', role: 'ATTENDEE' },
      requestId,
    },
    {
      path: '/api/v2/invite-lists/list-1/invite-to-event',
      body: { eventId: 'event-1', role: 'ATTENDEE' },
      requestId,
    },
  ]);
});

test('all skipped results report zero invitations honestly in text and JSON', async () => {
  const result = {
    eventId: 'event-1',
    totalCount: 2,
    sentCount: 0,
    skippedCount: 2,
    results: [
      { personId: 'person-1', status: 'skipped', reason: 'INVITATION_PENDING' },
      { personId: 'person-2', status: 'skipped', reason: 'UNAVAILABLE' },
    ],
  };
  await endpoint((_req, res) => res.end(JSON.stringify(result)), true, 2);
  const json = await cli(['invite', 'list-1', '--event', 'event-1']);
  expect(json.code).toBe(0);
  expect(JSON.parse(json.stdout)).toEqual({
    ...result,
    requestId: expect.stringMatching(/^\d{13}\.[0-9a-f-]{36}$/),
  });
  const text = await cli(['invite', 'list-1', '--event', 'event-1'], false);
  expect(text.code).toBe(0);
  expect(text.stdout).toContain('No invitations were sent');
  expect(text.stdout).toContain('sentCount: 0');
  expect(text.stdout).toContain('skippedCount: 2');
  expect(text.stdout).not.toMatch(/block|privacy|preference/i);
});

test.each([
  ['invite', 'list-1'],
  ['invite', '../list', '--event', 'event-1'],
  ['invite', 'list-1', '--event', '../event'],
  ['invite', 'list-1', '--event', 'event-1', '--role', 'ORGANIZER'],
  ['invite', 'list-1', '--event', 'event-1', '--message', 'x'.repeat(481)],
  ['invite', 'list-1', '--event', 'event-1', '--request-id', 'invalid'],
])(
  'invalid list invitation inputs submit no operation: %j',
  async (...args) => {
    const writes: string[] = [];
    await endpoint(
      (req, res) => {
        writes.push(req.url!);
        res.end('{}');
      },
      true,
      2
    );
    const result = await cli(args);
    expect(result.code).toBe(2);
    expect(JSON.parse(result.stderr).error.code).toBe('USAGE');
    expect(writes).toEqual([]);
  }
);

test.each([
  [1, 86400000],
  [2, 0],
])(
  'list invitations require v2 and 24-hour retention (version %s)',
  async (version, retentionMs) => {
    const writes: string[] = [];
    await endpoint(
      (req, res) => {
        writes.push(req.url!);
        res.end('{}');
      },
      true,
      version,
      retentionMs
    );
    const result = await cli(['invite', 'list-1', '--event', 'event-1']);
    expect(result.code).toBe(5);
    expect(JSON.parse(result.stderr).error.code).toBe('UNSUPPORTED_SERVER');
    expect(writes).toEqual([]);
  }
);

test('exhausted list-send retries preserve the original request ID and recovery instructions', async () => {
  const requestIds: unknown[] = [];
  const requestId = `${Date.now()}.b5222690-666a-4cfc-92b8-a4a9c4572184`;
  await endpoint(
    req => {
      requestIds.push(req.headers['idempotency-key']);
      req.socket.destroy();
    },
    true,
    2
  );
  const result = await cli([
    'invite',
    'list-1',
    '--event',
    'event-1',
    '--request-id',
    requestId,
  ]);
  expect(result.code).toBe(5);
  expect(result.stdout).toBe('');
  expect(JSON.parse(result.stderr).error.code).toBe('UNCERTAIN_OUTCOME');
  expect(result.stderr).toContain(`--request-id ${requestId}`);
  expect(result.stderr).toContain(
    'invites members list event-1 --profile test'
  );
  expect(result.stderr).toContain('do not use a new identifier');
  expect(requestIds).toEqual([requestId, requestId, requestId]);
});

test.each(['IDEMPOTENCY_CONFLICT', 'IDEMPOTENCY_EXPIRED'])(
  'protected list-send %s is recoverable without inventing a request ID',
  async code => {
    const requestId = `${Date.now()}.b5222690-666a-4cfc-92b8-a4a9c4572184`;
    await endpoint(
      (_req, res) => {
        res.statusCode = 409;
        res.end(
          JSON.stringify({
            error: { code, message: 'synthetic-invite-list-key' },
          })
        );
      },
      true,
      2
    );
    const result = await cli([
      'invite',
      'list-1',
      '--event',
      'event-1',
      '--request-id',
      requestId,
    ]);
    expect(result.code).toBe(2);
    expect(result.stdout).toBe('');
    expect(JSON.parse(result.stderr).error.code).toBe(code);
    expect(result.stderr).toContain(requestId);
    expect(result.stderr).not.toContain('synthetic-invite-list-key');
  }
);

test.each([
  {
    eventId: 'event-1',
    totalCount: 1,
    sentCount: 1,
    skippedCount: 0,
    results: [
      { personId: 'person-1', status: 'skipped', reason: 'UNAVAILABLE' },
    ],
  },
  {
    eventId: 'event-1',
    totalCount: 1,
    sentCount: 0,
    skippedCount: 1,
    results: [{ personId: 'person-1', status: 'skipped', reason: 'BLOCKED' }],
  },
  {
    eventId: 'event-1',
    totalCount: 2,
    sentCount: 0,
    skippedCount: 2,
    results: [
      { personId: 'person-1', status: 'skipped', reason: 'UNAVAILABLE' },
      { personId: 'person-1', status: 'skipped', reason: 'UNAVAILABLE' },
    ],
  },
  {
    eventId: 'event-1',
    totalCount: 101,
    sentCount: 101,
    skippedCount: 0,
    results: [],
  },
])(
  'inconsistent or private invitation output never claims a successful partial send',
  async body => {
    await endpoint((_req, res) => res.end(JSON.stringify(body)), true, 2);
    const result = await cli(['invite', 'list-1', '--event', 'event-1']);
    expect(result.code).toBe(5);
    expect(result.stdout).toBe('');
    expect(JSON.parse(result.stderr).error.code).toBe('UNCERTAIN_OUTCOME');
    expect(result.stderr).not.toContain('BLOCKED');
  }
);

test.each([400, 403, 404])(
  'list-send HTTP %s produces a request-wide failure with no sent payload',
  async status => {
    await endpoint(
      (_req, res) => {
        res.statusCode = status;
        res.end('{"error":{"message":"synthetic-invite-list-key"}}');
      },
      true,
      2
    );
    const result = await cli(['invite', 'list-1', '--event', 'event-1']);
    expect(result.code).toBe(status === 403 ? 3 : status === 404 ? 4 : 2);
    expect(result.stdout).toBe('');
    expect(result.stderr).not.toContain('synthetic-invite-list-key');
  }
);

test.each([
  {
    args: ['list'],
    body: {
      items: [{ ...summary, availablePersonCount: 0, needsAttention: false }],
    },
  },
  { args: ['get', 'list-1'], body: { ...detail, availablePersonCount: 1 } },
  { args: ['get', 'list-1'], body: { ...detail, people: [person, person] } },
])(
  'rejects inconsistent available counts and Needs attention state instead of displaying them',
  async ({ args, body }) => {
    await endpoint((_req, res) => res.end(JSON.stringify(body)), true, 2);
    const result = await cli(args);
    expect(result.code).toBe(5);
    expect(result.stdout).toBe('');
    expect(JSON.parse(result.stderr).error.code).toBe('INVALID_RESPONSE');
  }
);

test('displays anonymous unavailable entries and clear Needs attention repair guidance in JSON and text', async () => {
  const unavailableSummary = {
    ...summary,
    availablePersonCount: 0,
    needsAttention: true,
  };
  const stalePerson = {
    ...person,
    available: false,
    name: 'deleted name',
    username: 'deleted username',
    image: 'deleted image',
    email: 'deleted email',
  };
  const unavailableDetail = {
    ...unavailableSummary,
    people: [stalePerson, { ...stalePerson, personId: 'person-2' }],
  };
  await endpoint(
    (req, res) =>
      res.end(
        JSON.stringify(
          req.url === '/api/v2/invite-lists'
            ? { items: [unavailableSummary] }
            : unavailableDetail
        )
      ),
    true,
    2
  );
  const json = await cli(['get', 'list-1']);
  expect(json.code).toBe(0);
  expect(JSON.parse(json.stdout)).toEqual({
    ...unavailableSummary,
    people: [
      {
        personId: 'person-1',
        name: null,
        username: null,
        image: null,
        available: false,
      },
      {
        personId: 'person-2',
        name: null,
        username: null,
        image: null,
        available: false,
      },
    ],
  });
  expect(json.stdout).not.toContain('deleted');
  for (const args of [['get', 'list-1'], ['list']]) {
    const text = await cli(args, false);
    expect(text.code).toBe(0);
    expect(text.stdout).toContain('Needs attention');
    expect(text.stdout).toContain('Dinner');
    expect(text.stdout).toContain(
      'invite-lists edit list-1 --person-ids <json>'
    );
    expect(text.stdout).not.toContain('deleted');
  }
});

test('a fresh all-unavailable send explains repair and an explicit person replacement restores use', async () => {
  const requests: unknown[] = [];
  let repaired = false;
  const repairedDetail = {
    ...summary,
    availablePersonCount: 1,
    people: [
      {
        personId: 'person-1',
        name: null,
        username: null,
        image: null,
        available: false,
      },
      { ...person, personId: 'person-3', username: 'new-guest' },
    ],
  };
  const sendResult = {
    eventId: 'event-1',
    totalCount: 2,
    sentCount: 1,
    skippedCount: 1,
    results: [
      { personId: 'person-1', status: 'skipped', reason: 'UNAVAILABLE' },
      { personId: 'person-3', status: 'sent', inviteId: 'invite-3' },
    ],
  };
  await endpoint(
    async (req, res) => {
      let body = '';
      for await (const chunk of req) body += chunk;
      requests.push({
        path: req.url,
        method: req.method,
        body: JSON.parse(body),
      });
      if (req.method === 'PATCH') {
        repaired = true;
        res.end(JSON.stringify(repairedDetail));
      } else if (!repaired) {
        res.statusCode = 400;
        res.end(
          '{"error":{"code":"VALIDATION_ERROR","message":"Add an existing user before using this list"}}'
        );
      } else res.end(JSON.stringify(sendResult));
    },
    true,
    2
  );
  const denied = await cli(['invite', 'list-1', '--event', 'event-1']);
  expect(denied.code).toBe(2);
  expect(denied.stdout).toBe('');
  expect(JSON.parse(denied.stderr).error.code).toBe('USAGE');
  expect(denied.stderr).toContain(
    'invite-lists edit list-1 --person-ids <json>'
  );
  expect(denied.stderr).toContain('no invitations were sent');
  const repair = await cli([
    'edit',
    'list-1',
    '--person-ids',
    '["person-1","person-3"]',
  ]);
  expect(repair.code).toBe(0);
  expect(JSON.parse(repair.stdout)).toEqual(repairedDetail);
  const used = await cli(['invite', 'list-1', '--event', 'event-1']);
  expect(used.code).toBe(0);
  expect(JSON.parse(used.stdout)).toMatchObject(sendResult);
  expect(requests).toEqual([
    {
      path: '/api/v2/invite-lists/list-1/invite-to-event',
      method: 'POST',
      body: { eventId: 'event-1', role: 'ATTENDEE' },
    },
    {
      path: '/api/v2/invite-lists/list-1',
      method: 'PATCH',
      body: { personIds: ['person-1', 'person-3'] },
    },
    {
      path: '/api/v2/invite-lists/list-1/invite-to-event',
      method: 'POST',
      body: { eventId: 'event-1', role: 'ATTENDEE' },
    },
  ]);
});

test('protected replay uses the original result without reading a now-deleted list or person', async () => {
  const requestId = `${Date.now()}.b5222690-666a-4cfc-92b8-a4a9c4572184`;
  const requests: unknown[] = [];
  const cached = {
    eventId: 'event-1',
    totalCount: 1,
    sentCount: 1,
    skippedCount: 0,
    results: [
      {
        personId: 'person-1',
        status: 'sent',
        inviteId: 'invite-1',
        name: 'deleted name',
      },
    ],
  };
  await endpoint(
    async (req, res) => {
      let body = '';
      for await (const chunk of req) body += chunk;
      requests.push({
        path: req.url,
        method: req.method,
        key: req.headers['x-api-key'],
        requestId: req.headers['idempotency-key'],
        body: body ? JSON.parse(body) : null,
      });
      if (req.method === 'GET') {
        res.statusCode = 404;
        res.end('{"error":{"code":"NOT_FOUND"}}');
      } else res.end(JSON.stringify(cached));
    },
    true,
    2
  );
  const args = [
    'invite',
    'list-1',
    '--event',
    'event-1',
    '--request-id',
    requestId,
  ];
  const first = await cli(args);
  const replay = await cli(args);
  expect(first.code).toBe(0);
  expect(replay).toEqual(first);
  expect(JSON.parse(replay.stdout)).toEqual({
    eventId: 'event-1',
    totalCount: 1,
    sentCount: 1,
    skippedCount: 0,
    results: [{ personId: 'person-1', status: 'sent', inviteId: 'invite-1' }],
    requestId,
  });
  expect(replay.stdout).not.toContain('deleted');
  expect(requests).toEqual([
    {
      path: '/api/v2/invite-lists/list-1/invite-to-event',
      method: 'POST',
      key: 'synthetic-invite-list-key',
      requestId,
      body: { eventId: 'event-1', role: 'ATTENDEE' },
    },
    {
      path: '/api/v2/invite-lists/list-1/invite-to-event',
      method: 'POST',
      key: 'synthetic-invite-list-key',
      requestId,
      body: { eventId: 'event-1', role: 'ATTENDEE' },
    },
  ]);
});

test.each([
  ['list'],
  ['get', 'list-1'],
  ['edit', 'list-1', '--person-ids', '["person-3"]'],
  ['invite', 'list-1', '--event', 'event-1'],
])(
  'an old deleted-owner identity returns no list or successful use data: %j',
  async (...args) => {
    await endpoint(
      (_req, res) => {
        res.statusCode = 401;
        res.end(
          '{"error":{"code":"UNAUTHORIZED","message":"synthetic-invite-list-key"}}'
        );
      },
      true,
      2
    );
    const result = await cli(args);
    expect(result.code).toBe(3);
    expect(result.stdout).toBe('');
    expect(JSON.parse(result.stderr).error.code).toBe('AUTH_REQUIRED');
    expect(result.stderr).not.toContain('synthetic-invite-list-key');
  }
);

test('a partially unavailable list keeps truthful counts while projecting only anonymous missing entries', async () => {
  const body = {
    ...detail,
    availablePersonCount: 1,
    people: [
      person,
      {
        personId: 'person-2',
        name: 'deleted name',
        username: 'deleted username',
        image: 'deleted image',
        available: false,
        bio: 'deleted bio',
      },
    ],
  };
  await endpoint((_req, res) => res.end(JSON.stringify(body)), true, 2);
  const result = await cli(['get', 'list-1']);
  expect(result.code).toBe(0);
  expect(JSON.parse(result.stdout)).toMatchObject({
    personCount: 2,
    availablePersonCount: 1,
    needsAttention: false,
    people: [
      person,
      {
        personId: 'person-2',
        name: null,
        username: null,
        image: null,
        available: false,
      },
    ],
  });
  expect(result.stdout).not.toContain('deleted');
});
