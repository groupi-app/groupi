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
  config = await mkdtemp(join(tmpdir(), 'groupi-notifications-'));
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
            ? { notificationControls: { version: 1 } }
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

test('lists bounded unread pages, projects safe JSON and supports all results', async () => {
  const paths: string[] = [];
  await endpoint((req, res) => {
    paths.push(req.url!);
    const cursor = new URL(req.url!, 'http://localhost').searchParams.get(
      'cursor'
    );
    res.end(
      JSON.stringify({
        items: cursor
          ? []
          : [
              {
                id: 'n1',
                type: 'NEW_POST',
                read: false,
                createdAt: 10,
                event: { id: 'e1', title: 'Dinner' },
                post: null,
                author: null,
                apiKey: 'never-print',
              },
            ],
        nextCursor: cursor ? null : 'next',
      })
    );
  });
  const first = await cli(['notifications', 'list', '--unread']);
  expect(first.code).toBe(0);
  expect(first.stderr).toBe('');
  expect(JSON.parse(first.stdout)).toEqual({
    items: [
      {
        id: 'n1',
        type: 'NEW_POST',
        read: false,
        createdAt: 10,
        event: { id: 'e1', title: 'Dinner' },
        post: null,
        author: null,
      },
    ],
    nextCursor: 'next',
  });
  expect(paths).toEqual([
    '/api/v2/notifications?pagination=cursor&limit=20&unread=true',
  ]);
  paths.length = 0;
  const all = await cli(['notifications', 'list', '--unread', '--all']);
  expect(all.code).toBe(0);
  expect(JSON.parse(all.stdout).nextCursor).toBeNull();
  expect(paths).toHaveLength(2);
});

test('notification actions target the chosen IDs and clear requires --yes', async () => {
  const requests: { method: string; path: string }[] = [];
  await endpoint((req, res) => {
    requests.push({ method: req.method!, path: req.url! });
    if (req.method === 'DELETE') {
      res.statusCode = 204;
      res.end();
    } else res.end(JSON.stringify({ message: 'Done' }));
  });
  for (const [args, path] of [
    [['notifications', 'read', 'n1'], '/notifications/n1/read'],
    [['notifications', 'unread', 'n1'], '/notifications/n1/unread'],
    [['notifications', 'read-all'], '/notifications/read-all'],
    [['notifications', 'read-event', 'e1'], '/notifications/events/e1/read'],
    [['notifications', 'read-post', 'p1'], '/notifications/posts/p1/read'],
  ] as const) {
    const result = await cli([...args]);
    expect(result.code, result.stderr).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({ success: true });
    expect(requests.at(-1)).toEqual({ method: 'POST', path: '/api/v2' + path });
  }
  const count = requests.length;
  for (const args of [
    ['notifications', 'clear', 'n1'],
    ['notifications', 'clear-all'],
  ]) {
    const result = await cli(args);
    expect(result.code).toBe(2);
    expect(JSON.parse(result.stderr).error.code).toBe('CONFIRMATION_REQUIRED');
    expect(result.stdout).toBe('');
  }
  expect(requests).toHaveLength(count);
  expect((await cli(['notifications', 'clear', 'n1', '--yes'])).code).toBe(0);
  expect((await cli(['notifications', 'clear-all', '--yes'])).code).toBe(0);
  expect(requests.slice(-2)).toEqual([
    { method: 'DELETE', path: '/api/v2/notifications/n1' },
    { method: 'DELETE', path: '/api/v2/notifications' },
  ]);
});

test('event and discussion mute commands expose effective parent-event suppression', async () => {
  const requests: string[] = [];
  await endpoint((req, res) => {
    requests.push(`${req.method} ${req.url}`);
    if (req.method === 'DELETE') {
      res.statusCode = 204;
      res.end();
    } else
      res.end(
        JSON.stringify(
          req.method === 'GET'
            ? { isMuted: false, eventMuted: true, effectiveMuted: true }
            : { message: 'Muted' }
        )
      );
  });
  for (const scope of ['events', 'posts']) {
    expect((await cli([scope, 'mute', 'target'])).code).toBe(0);
    expect((await cli([scope, 'unmute', 'target'])).code).toBe(0);
    const status = await cli([scope, 'mute-status', 'target']);
    expect(status.code).toBe(0);
    expect(JSON.parse(status.stdout)).toEqual(
      scope === 'posts'
        ? { isMuted: false, eventMuted: true, effectiveMuted: true }
        : { isMuted: false, effectiveMuted: true }
    );
  }
  expect(requests).toHaveLength(6);
});

test.each([
  ['notifications', 'clear-all', '--yes'],
  ['notifications', 'list'],
  ['events', 'mute', 'e1'],
])('refuses old servers before the operation: %j', async (...args) => {
  let requests = 0;
  await endpoint((_req, res) => {
    requests++;
    res.end('{}');
  }, false);
  const result = await cli(args);
  expect(result.code).toBe(5);
  expect(JSON.parse(result.stderr).error.code).toBe('UNSUPPORTED_SERVER');
  expect(requests).toBe(0);
});

test.each([
  ['notifications', 'list', '--limit', '0'],
  ['notifications', 'list', '--limit', '20x'],
  ['notifications', 'list', '--limit', '101'],
  ['notifications', 'read', 'https://example.test'],
  ['posts', 'mute', '../target'],
])('rejects invalid inputs: %j', async (...args) => {
  const result = await cli(args);
  expect(result.code).toBe(2);
  expect(JSON.parse(result.stderr).error.code).toBe('USAGE');
  expect(result.stdout).toBe('');
});

test('stops a repeated cursor and never emits a partial success document', async () => {
  await endpoint((_req, res) =>
    res.end(JSON.stringify({ items: [], nextCursor: 'same' }))
  );
  const result = await cli(['notifications', 'list', '--all']);
  expect(result.code).toBe(5);
  expect(result.stdout).toBe('');
  expect(JSON.parse(result.stderr).error.code).toBe('INVALID_RESPONSE');
});

test('lost write responses never retry and explain how to inspect the outcome', async () => {
  let attempts = 0;
  await endpoint(req => {
    attempts++;
    req.socket.destroy();
  });
  const result = await cli(['events', 'mute', 'e1']);
  expect(result.code).toBe(5);
  expect(attempts).toBe(1);
  expect(JSON.parse(result.stderr).error.code).toBe('UNCERTAIN_OUTCOME');
  expect(result.stderr).toContain('events mute-status e1');
  expect(result.stdout).toBe('');
});

test('malformed write acknowledgments are uncertain, not success', async () => {
  let attempts = 0;
  await endpoint((_req, res) => {
    attempts++;
    res.end('[]');
  });
  const result = await cli(['posts', 'mute', 'p1']);
  expect(result.code).toBe(5);
  expect(JSON.parse(result.stderr).error.code).toBe('UNCERTAIN_OUTCOME');
  expect(attempts).toBe(1);
  expect(result.stdout).toBe('');
});

test('human summaries strip remote terminal controls and JSON counts remain one document', async () => {
  await endpoint((req, res) =>
    res.end(
      JSON.stringify(
        req.url?.endsWith('/count')
          ? { count: 7, apiKey: 'not-output' }
          : {
              items: [
                {
                  id: 'n1',
                  type: 'NEW_POST',
                  read: false,
                  createdAt: 1,
                  event: { id: 'e1', title: 'Hi\u001b[31m' },
                  post: null,
                  author: null,
                },
              ],
              nextCursor: null,
            }
      )
    )
  );
  const human = await cli(['notifications', 'list'], false);
  expect(human.code).toBe(0);
  expect(human.stdout).toContain('n1');
  expect(human.stdout).not.toContain('\u001b');
  const count = await cli(['notifications', 'count']);
  expect(count.code).toBe(0);
  expect(JSON.parse(count.stdout)).toEqual({ count: 7 });
  expect(count.stderr).toBe('');
});
