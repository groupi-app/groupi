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
                notificationControls: { version: 1 },
                groupEventAudiences: { version: 1 },
              }
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

test('fails unsupported audience writes before sending any mutation', async () => {
  let writes = 0;
  await endpoint((_req, res) => {
    writes++;
    res.end('{}');
  }, false);
  const response = await cli([
    'events',
    'share-group',
    'event-one',
    'group-one',
  ]);
  expect(response.code).not.toBe(0);
  expect(writes).toBe(0);
  expect(response.stderr).toContain('UNSUPPORTED_SERVER');
});
test('continues empty filtered pages and strips protected Event payloads from safe logistics previews', async () => {
  await endpoint((req, res) =>
    res.end(
      JSON.stringify(
        req.url?.includes('cursor=next')
          ? {
              items: [
                {
                  event: {
                    _id: 'event-one',
                    title: 'Library',
                    admissionPolicy: 'DIRECT',
                    potentialDateTimeOptions: [],
                    members: [{ email: 'private@example.com' }],
                    tools: { secret: 'protected' },
                    location: 'Public logistics',
                  },
                  canWithdraw: false,
                },
              ],
              nextCursor: null,
            }
          : { items: [], nextCursor: 'next' }
      )
    )
  );
  const response = await cli([
    'groups',
    'events',
    'group-one',
    '--all',
    '--limit',
    '1',
  ]);
  expect(response.code).toBe(0);
  expect(JSON.parse(response.stdout).items[0].event.title).toBe('Library');
  expect(response.stdout).not.toContain('private@example.com');
  expect(response.stdout).not.toContain('protected');
});
