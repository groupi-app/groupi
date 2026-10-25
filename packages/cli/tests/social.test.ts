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
  config = await mkdtemp(join(tmpdir(), 'groupi-social-'));
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
          capabilities: capability ? { socialWrites: { version: 1 } } : {},
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

test('social mutations and paginated reads use the public executable', async () => {
  const calls: string[] = [];
  await endpoint(async (req, res) => {
    calls.push(`${req.method} ${req.url}`);
    if (req.url?.startsWith('/api/v2/friends?'))
      return res.end(
        JSON.stringify({
          items: [
            {
              friendshipId: 'friend-1',
              personId: 'person-2',
              userId: 'user-2',
              name: 'Bee',
              username: 'bee',
              image: null,
              lastSeen: null,
            },
          ],
          nextCursor: null,
        })
      );
    if (req.method === 'DELETE') {
      res.statusCode = 204;
      return res.end();
    }
    res.end(
      JSON.stringify({
        friendshipId: 'friend-1',
        status: 'PENDING',
        message: 'Friend request sent',
      })
    );
  });
  const sent = await cli(['friends', 'request', 'person-2']);
  expect(sent.code, sent.stderr).toBe(0);
  expect(JSON.parse(sent.stdout).friendshipId).toBe('friend-1');
  const list = await cli(['friends', 'list']);
  expect(list.code, list.stderr).toBe(0);
  expect(JSON.parse(list.stdout).nextCursor).toBeNull();
  const denied = await cli(['friends', 'remove', 'friend-1']);
  expect(denied.code).toBe(2);
  expect(JSON.parse(denied.stderr).error.code).toBe('CONFIRMATION_REQUIRED');
  const removed = await cli(['friends', 'remove', 'friend-1', '--yes']);
  expect(removed.code, removed.stderr).toBe(0);
  expect(calls).toEqual([
    'POST /api/v2/friends/requests',
    'GET /api/v2/friends?pagination=cursor&limit=20',
    'DELETE /api/v2/friends/friend-1',
  ]);
});

test('friend and block lists deliberately follow continuation and stop on repeated cursors', async () => {
  let repeat = false;
  await endpoint((req, res) => {
    const continuation = req.url?.includes('cursor=next');
    res.end(
      JSON.stringify({
        items: continuation
          ? []
          : [
              {
                personId: 'person-2',
                userId: 'user-2',
                name: 'Bee',
                username: 'bee',
                image: null,
                blockedAt: 123,
              },
            ],
        nextCursor: continuation && !repeat ? null : 'next',
      })
    );
  });
  const listed = await cli(['blocks', 'list', '--all', '--limit', '1']);
  expect(listed.code, listed.stderr).toBe(0);
  expect(JSON.parse(listed.stdout)).toMatchObject({
    items: [{ personId: 'person-2' }],
    nextCursor: null,
  });
  repeat = true;
  const loop = await cli(['blocks', 'list', '--all']);
  expect(loop.code).toBe(5);
  expect(JSON.parse(loop.stderr).error.code).toBe('INVALID_RESPONSE');
});

test('uncertain social writes are never replayed and offer inspection recovery', async () => {
  let writes = 0;
  await endpoint((req, res) => {
    writes++;
    res.destroy();
  });
  const result = await cli(['blocks', 'block', 'person-2', '--yes']);
  expect(result.code).toBe(5);
  expect(JSON.parse(result.stderr).error).toMatchObject({
    code: 'UNCERTAIN_OUTCOME',
  });
  expect(result.stderr).toContain('blocks status person-2');
  expect(writes).toBe(1);
  expect(result.stdout).toBe('');
});

test('social commands reject missing/invalid input and protect all destructive headless changes', async () => {
  let writes = 0;
  await endpoint((req, res) => {
    writes++;
    res.end('{}');
  });
  for (const args of [
    ['friends', 'request'],
    ['friends', 'list', '--limit', '1.5'],
    ['blocks', 'status', 'bad/id'],
  ]) {
    const result = await cli(args);
    expect(result.code).toBe(2);
    expect(result.stdout).toBe('');
  }
  for (const args of [
    ['friends', 'decline', 'request-1'],
    ['friends', 'cancel', 'request-1'],
    ['blocks', 'block', 'person-2'],
    ['blocks', 'unblock', 'person-2'],
  ]) {
    const result = await cli(args);
    expect(result.code).toBe(2);
    expect(JSON.parse(result.stderr).error.code).toBe('CONFIRMATION_REQUIRED');
  }
  expect(writes).toBe(0);
});

test('unsupported servers reject writes and human status reads remain readable', async () => {
  let writes = 0;
  await endpoint((req, res) => {
    writes++;
    res.end(
      JSON.stringify({
        status: 'friends',
        friendshipId: 'friend-1',
        key: 'private-test-key',
      })
    );
  }, false);
  const denied = await cli(['friends', 'request', 'person-2']);
  expect(denied.code).toBe(5);
  expect(JSON.parse(denied.stderr).error.code).toBe('UNSUPPORTED_SERVER');
  expect(writes).toBe(0);
  const human = await cli(['friends', 'status', 'person-2'], false);
  expect(human.code, human.stderr).toBe(0);
  expect(human.stdout).toContain('friends');
  expect(human.stdout).not.toContain('private-test-key');
  expect(human.stderr).toBe('');
});
