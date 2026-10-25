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
  config = await mkdtemp(join(tmpdir(), 'groupi-attendance-'));
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
          capabilities: capability ? { attendanceWrites: { version: 1 } } : {},
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

test('RSVP set and get preserve own status and note with a single safe write', async () => {
  const calls: {
    method?: string;
    path?: string;
    body: unknown;
    id: unknown;
  }[] = [];
  await endpoint(async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;
    calls.push({
      method: req.method,
      path: req.url,
      body: body ? JSON.parse(body) : null,
      id: req.headers['idempotency-key'],
    });
    res.end(
      JSON.stringify({
        membershipId: 'member-1',
        rsvpStatus: 'YES',
        rsvpNote: 'Bringing snacks',
        privateKey: 'private-test-key',
      })
    );
  });
  for (const args of [
    ['set', '--status', 'YES', '--note', 'Bringing snacks'],
    ['get'],
  ]) {
    const outcome = await cli([
      'events',
      'rsvp',
      args[0],
      'event-1',
      ...args.slice(1),
    ]);
    expect(outcome.code).toBe(0);
    expect(outcome.stderr).toBe('');
    expect(JSON.parse(outcome.stdout)).toEqual({
      membershipId: 'member-1',
      rsvpStatus: 'YES',
      rsvpNote: 'Bringing snacks',
    });
  }
  expect(calls).toEqual([
    {
      method: 'PATCH',
      path: '/api/v2/events/event-1/rsvp',
      body: { rsvpStatus: 'YES', rsvpNote: 'Bringing snacks' },
      id: undefined,
    },
    {
      method: 'GET',
      path: '/api/v2/events/event-1/rsvp',
      body: null,
      id: undefined,
    },
  ]);
});

const user = {
  id: 'user-1',
  name: 'Guest',
  email: 'guest@example.com',
  image: null,
  username: 'guest',
};
const option = {
  id: 'option-1',
  dateTime: 1900000000000,
  endDateTime: null,
  note: 'Evening',
};
test('availability reads own option notes and submits explicit response notes', async () => {
  const writes: unknown[] = [];
  await endpoint(async (req, res) => {
    if (req.method === 'GET') {
      expect(req.url).toBe(
        '/api/v2/events/event-1/availability/mine?pagination=cursor&limit=20'
      );
      res.end(
        JSON.stringify({
          items: [
            {
              potentialDateTime: { ...option, secret: 'hidden' },
              status: 'PENDING',
              note: null,
              availabilityId: null,
            },
          ],
          nextCursor: null,
        })
      );
      return;
    }
    let body = '';
    for await (const chunk of req) body += chunk;
    writes.push(JSON.parse(body));
    res.end('{"created":1,"updated":0,"secret":"hidden"}');
  });
  const before = await cli(['events', 'availability', 'get', 'event-1']);
  expect(before.code).toBe(0);
  expect(JSON.parse(before.stdout)).toEqual({
    items: [
      {
        potentialDateTime: option,
        status: 'PENDING',
        note: null,
        availabilityId: null,
      },
    ],
    nextCursor: null,
  });
  const result = await cli([
    'events',
    'availability',
    'set',
    'event-1',
    '--responses',
    '[{"potentialDateTimeId":"option-1","status":"YES","note":"Can bring food"}]',
  ]);
  expect(result.code).toBe(0);
  expect(JSON.parse(result.stdout)).toEqual({ created: 1, updated: 0 });
  expect(writes).toEqual([
    {
      responses: [
        {
          potentialDateTimeId: 'option-1',
          status: 'YES',
          note: 'Can bring food',
        },
      ],
    },
  ]);
});

const event = {
  id: 'event-1',
  title: 'Dinner',
  description: null,
  location: null,
  imageUrl: null,
  timezone: 'UTC',
  potentialDateTimeOptions: [
    { id: 'option-1', start: 1900000000000, end: null, note: 'Evening' },
  ],
  chosenDateTime: 1900000000000,
  chosenEndDateTime: null,
  reminderOffset: null,
  createdAt: 1,
  updatedAt: 2,
  creator: { id: 'person-1', user },
};
test('date selection and reset require confirmation and preserve POLL versus MANUAL contracts', async () => {
  const writes: { method?: string; body: unknown }[] = [];
  await endpoint(async (req, res) => {
    expect(req.url).toBe('/api/v2/events/event-1/date');
    let body = '';
    for await (const chunk of req) body += chunk;
    writes.push({ method: req.method, body: body ? JSON.parse(body) : null });
    res.end(
      JSON.stringify({
        ...event,
        secret: 'hidden',
        creator: {
          ...event.creator,
          secret: 'hidden',
          user: { ...user, apiKey: 'private-test-key' },
        },
      })
    );
  });
  const denied = await cli([
    'events',
    'dates',
    'choose',
    'event-1',
    '--option',
    'option-1',
  ]);
  expect(denied.code).toBe(2);
  expect(JSON.parse(denied.stderr).error.code).toBe('CONFIRMATION_REQUIRED');
  expect(writes).toHaveLength(0);
  for (const flags of [
    ['choose', '--option', 'option-1'],
    [
      'choose',
      '--start',
      '2029-01-01T18:00:00-05:00',
      '--end',
      '2029-01-01T20:00:00-05:00',
    ],
    ['reset'],
  ]) {
    const result = await cli([
      'events',
      'dates',
      flags[0],
      'event-1',
      ...flags.slice(1),
      '--yes',
    ]);
    expect(result.code).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual(event);
    expect(result.stdout).not.toContain('private-test-key');
  }
  expect(writes).toEqual([
    {
      method: 'POST',
      body: { selectionSource: 'POLL', potentialDateTimeId: 'option-1' },
    },
    {
      method: 'POST',
      body: {
        selectionSource: 'MANUAL',
        chosenDateTime: '2029-01-01T18:00:00-05:00',
        chosenEndDateTime: '2029-01-01T20:00:00-05:00',
      },
    },
    { method: 'DELETE', body: null },
  ]);
});

test('attendance and per-option responses page safely and discard nested unknown fields', async () => {
  const paths: (string | undefined)[] = [];
  await endpoint((req, res) => {
    paths.push(req.url);
    if (req.url?.includes('/members'))
      res.end(
        JSON.stringify({
          items: [
            {
              id: 'member-1',
              personId: 'person-1',
              role: 'ATTENDEE',
              rsvpStatus: 'YES',
              rsvpNote: 'Snacks',
              joinedAt: 1,
              user: { ...user, secret: 'hidden' },
            },
          ],
          nextCursor: null,
        })
      );
    else if (paths.length === 2) res.end('{"items":[],"nextCursor":"next"}');
    else
      res.end(
        JSON.stringify({
          items: [
            {
              membershipId: 'member-1',
              personId: 'person-1',
              user: null,
              status: 'PENDING',
              note: null,
            },
          ],
          nextCursor: null,
        })
      );
  });
  const members = await cli(['events', 'members', 'event-1']);
  expect(members.code).toBe(0);
  expect(JSON.parse(members.stdout).items[0].user).toEqual(user);
  expect(members.stdout).not.toContain('hidden');
  const responses = await cli([
    'events',
    'availability',
    'responses',
    'event-1',
    '--option',
    'option-1',
    '--limit',
    '1',
    '--all',
  ]);
  expect(responses.code).toBe(0);
  expect(JSON.parse(responses.stdout)).toEqual({
    items: [
      {
        membershipId: 'member-1',
        personId: 'person-1',
        user: null,
        status: 'PENDING',
        note: null,
      },
    ],
    nextCursor: null,
  });
  expect(paths).toEqual([
    '/api/v2/events/event-1/members?pagination=cursor&limit=20',
    '/api/v2/events/event-1/availability/responses?pagination=cursor&limit=1&potentialDateTimeId=option-1',
    '/api/v2/events/event-1/availability/responses?pagination=cursor&limit=1&cursor=next&potentialDateTimeId=option-1',
  ]);
});

test('proposed-date paging keeps notes, while repeated cursors fail without partial success', async () => {
  let reads = 0;
  await endpoint((_req, res) => {
    reads++;
    res.end(JSON.stringify({ items: [option], nextCursor: 'same' }));
  });
  const first = await cli(['events', 'dates', 'list', 'event-1']);
  expect(first.code).toBe(0);
  expect(JSON.parse(first.stdout)).toEqual({
    items: [option],
    nextCursor: 'same',
  });
  const all = await cli([
    'events',
    'dates',
    'list',
    'event-1',
    '--cursor',
    'same',
    '--all',
  ]);
  expect(all.code).toBe(5);
  expect(JSON.parse(all.stderr).error.code).toBe('INVALID_RESPONSE');
  expect(all.stdout).toBe('');
  expect(reads).toBe(2);
});

test('clear availability needs confirmation and reports only this membership deletion count', async () => {
  let writes = 0;
  await endpoint((req, res) => {
    writes++;
    expect(req.method).toBe('DELETE');
    expect(req.url).toBe('/api/v2/events/event-1/availability');
    res.end('{"deletedCount":2,"membershipId":"member-1","secret":"hidden"}');
  });
  const denied = await cli(['events', 'availability', 'clear', 'event-1']);
  expect(denied.code).toBe(2);
  expect(JSON.parse(denied.stderr).error.code).toBe('CONFIRMATION_REQUIRED');
  expect(writes).toBe(0);
  const cleared = await cli([
    'events',
    'availability',
    'clear',
    'event-1',
    '--yes',
  ]);
  expect(cleared.code).toBe(0);
  expect(JSON.parse(cleared.stdout)).toEqual({
    deletedCount: 2,
    membershipId: 'member-1',
  });
  expect(writes).toBe(1);
});

test('RSVP supports explicit PENDING and omits the note to use app clearing semantics', async () => {
  let body = '';
  await endpoint(async (req, res) => {
    for await (const chunk of req) body += chunk;
    res.end(
      '{"membershipId":"member-1","rsvpStatus":"PENDING","rsvpNote":null}'
    );
  });
  const result = await cli([
    'events',
    'rsvp',
    'set',
    'event-1',
    '--status',
    'PENDING',
  ]);
  expect(result.code).toBe(0);
  expect(JSON.parse(body)).toEqual({ rsvpStatus: 'PENDING' });
  expect(JSON.parse(result.stdout).rsvpNote).toBeNull();
});

test('an empty availability submission remains the app-supported no-op', async () => {
  let body = '';
  await endpoint(async (req, res) => {
    for await (const chunk of req) body += chunk;
    res.end('{"created":0,"updated":0}');
  });
  const result = await cli([
    'events',
    'availability',
    'set',
    'event-1',
    '--responses',
    '[]',
  ]);
  expect(result.code).toBe(0);
  expect(JSON.parse(body)).toEqual({ responses: [] });
});

test.each([
  ['rsvp', 'set', 'event-1'],
  ['rsvp', 'set', 'event-1', '--status', 'WRONG'],
  ['rsvp', 'set', 'event-1', '--status', 'YES', '--note', 'a'.repeat(201)],
  ['rsvp', 'get', '../other'],
  ['members', 'event-1', '--limit', '101'],
  ['dates', 'choose', 'event-1'],
  [
    'dates',
    'choose',
    'event-1',
    '--option',
    'option-1',
    '--start',
    '2029-01-01T00:00:00Z',
  ],
  ['dates', 'choose', 'event-1', '--start', '2029-01-01T00:00:00'],
  ['dates', 'choose', 'event-1', '--start', '2029-02-30T00:00:00Z'],
  ['dates', 'choose', 'event-1', '--start', '2001-01-01T00:00:00Z'],
  [
    'dates',
    'choose',
    'event-1',
    '--start',
    '2029-01-01T00:00:00Z',
    '--end',
    '2028-01-01T00:00:00Z',
  ],
  ['availability', 'responses', 'event-1'],
  ['availability', 'set', 'event-1', '--responses', 'invalid'],
  ['availability', 'set', 'event-1', '--responses', '{}'],
  [
    'availability',
    'set',
    'event-1',
    '--responses',
    '[{"potentialDateTimeId":"option-1","status":"PENDING"}]',
  ],
  [
    'availability',
    'set',
    'event-1',
    '--responses',
    '[{"potentialDateTimeId":"option-1","status":"YES"},{"potentialDateTimeId":"option-1","status":"NO"}]',
  ],
  [
    'availability',
    'set',
    'event-1',
    '--responses',
    JSON.stringify([
      { potentialDateTimeId: 'option-1', status: 'YES', note: 'a'.repeat(201) },
    ]),
  ],
  [
    'availability',
    'set',
    'event-1',
    '--responses',
    '[{"potentialDateTimeId":"option-1","status":"YES","secret":"private-test-key"}]',
  ],
])('invalid attendance input sends no HTTP request: %j', async (...args) => {
  let calls = 0;
  await endpoint((_req, res) => {
    calls++;
    res.end('{}');
  }, false);
  const result = await cli(['events', ...args]);
  expect(result.code).toBe(2);
  expect(JSON.parse(result.stderr).error.code).toBe('USAGE');
  expect(result.stdout).toBe('');
  expect(calls).toBe(0);
  expect(result.stderr).not.toContain('private-test-key');
});

test.each([
  ['rsvp', 'set', 'event-1', '--status', 'YES'],
  ['availability', 'set', 'event-1', '--responses', '[]'],
  ['availability', 'clear', 'event-1', '--yes'],
  ['dates', 'choose', 'event-1', '--option', 'option-1', '--yes'],
  ['dates', 'reset', 'event-1', '--yes'],
])(
  'attendance mutations require the advertised server capability: %j',
  async (...args) => {
    let writes = 0;
    await endpoint((_req, res) => {
      writes++;
      res.end('{}');
    }, false);
    const result = await cli(['events', ...args]);
    expect(result.code).toBe(5);
    expect(JSON.parse(result.stderr).error.code).toBe('UNSUPPORTED_SERVER');
    expect(writes).toBe(0);
  }
);

test.each([
  ['rsvp', 'set', 'event-1', '--status', 'YES'],
  ['availability', 'set', 'event-1', '--responses', '[]'],
  ['availability', 'clear', 'event-1', '--yes'],
  ['dates', 'choose', 'event-1', '--option', 'option-1', '--yes'],
  ['dates', 'reset', 'event-1', '--yes'],
])('uncertain attendance writes are never retried: %j', async (...args) => {
  let writes = 0;
  await endpoint(req => {
    writes++;
    req.socket.destroy();
  });
  const result = await cli(['events', ...args]);
  expect(result.code).toBe(5);
  expect(JSON.parse(result.stderr).error.code).toBe('UNCERTAIN_OUTCOME');
  expect(result.stderr).toContain('Inspect events');
  expect(writes).toBe(1);
  expect(result.stdout).toBe('');
});

test.each([401, 403, 404, 422])(
  'attendance HTTP %s preserves permission errors without leaking reflected fields',
  async status => {
    await endpoint((_req, res) => {
      res.statusCode = status;
      res.end('{"error":{"code":"UNTRUSTED","message":"private-test-key"}}');
    });
    const result = await cli([
      'events',
      'rsvp',
      'set',
      'event-1',
      '--status',
      'YES',
    ]);
    expect(result.code).toBe(
      status === 401 || status === 403 ? 3 : status === 404 ? 4 : 2
    );
    expect(result.stderr).not.toContain('private-test-key');
    expect(result.stdout).toBe('');
  }
);

test('human attendance output cannot execute terminal controls from remote notes', async () => {
  await endpoint((_req, res) =>
    res.end(
      JSON.stringify({
        membershipId: 'member-1',
        rsvpStatus: 'YES',
        rsvpNote: 'Hello\u001b[31m\nprivate note',
      })
    )
  );
  const result = await cli(['events', 'rsvp', 'get', 'event-1'], false);
  expect(result.code).toBe(0);
  expect(result.stdout).toContain('Hello');
  expect(result.stdout).not.toContain('\u001b');
});
