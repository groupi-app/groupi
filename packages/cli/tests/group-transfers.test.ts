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
            ? {
                groups: { version: 1 },
                groupTransfers: { version: 1, retirement: true },
              }
            : { groups: { version: 1 } },
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

test('legacy servers receive zero ownership or retirement writes', async () => {
  const writes: string[] = [];
  await endpoint((req, res) => {
    writes.push(req.method!);
    res.end('{}');
  }, false);
  for (const args of [
    ['transfer', 'offer', 'g1', 'p1', '--yes'],
    ['transfer', 'accept', 'g1', 't1', '--yes'],
    ['transfer', 'decline', 'g1', 't1'],
    ['transfer', 'cancel', 'g1', 't1'],
    ['delete', 'g1', '--yes'],
  ]) {
    const result = await cli(['groups', ...args]);
    expect(result.code).toBe(5);
    expect(JSON.parse(result.stderr).error.code).toBe('UNSUPPORTED_SERVER');
  }
  expect(writes).toEqual([]);
});
test('CLI sends explicit recipient and observed transfer IDs and reports pending responsibility', async () => {
  const requests: { url: string | undefined; body: unknown }[] = [];
  await endpoint((req, res) => {
    let raw = '';
    req.on('data', part => (raw += part));
    req.on('end', () => {
      requests.push({ url: req.url, body: raw ? JSON.parse(raw) : null });
      res.end(
        JSON.stringify({
          groupId: 'g1',
          ownerId: 'p1',
          status: req.url?.endsWith('/accept') ? 'ACCEPTED' : 'PENDING',
          transferId: 't1',
          explanation:
            'Current owner remains responsible until acceptance; former owner becomes Moderator.',
          canOffer: false,
          canAccept: true,
          canDecline: true,
          canCancel: true,
        })
      );
    });
  });
  const offer = await cli(['groups', 'transfer', 'offer', 'g1', 'p2', '--yes']);
  expect(offer.code).toBe(0);
  expect(JSON.parse(offer.stdout).status).toBe('PENDING');
  const accept = await cli([
    'groups',
    'transfer',
    'accept',
    'g1',
    't1',
    '--yes',
  ]);
  expect(accept.code).toBe(0);
  expect(JSON.parse(accept.stdout).status).toBe('ACCEPTED');
  expect(requests).toEqual([
    {
      url: '/api/v2/groups/g1/ownership-transfer',
      body: { recipientId: 'p2' },
    },
    {
      url: '/api/v2/groups/g1/ownership-transfer/accept',
      body: { transferId: 't1' },
    },
  ]);
});

test('explicit retirement sends only the selected Group DELETE', async () => {
  const writes: string[] = [];
  await endpoint((req, res) => {
    writes.push(`${req.method} ${req.url}`);
    res.statusCode = 204;
    res.end();
  });
  const result = await cli(['groups', 'delete', 'g1', '--yes']);
  expect(result.code).toBe(0);
  expect(JSON.parse(result.stdout)).toEqual({ success: true, groupId: 'g1' });
  expect(writes).toEqual(['DELETE /api/v2/groups/g1']);
});
