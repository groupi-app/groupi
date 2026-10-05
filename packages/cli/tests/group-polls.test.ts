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
  capability = true,
  pendingRsvpJoin = true,
  eventAdmission = true
) {
  const server = createServer((req, res) => {
    res.setHeader('content-type', 'application/json');
    if (req.url === '/api/v2/health') {
      res.end(
        JSON.stringify({
          capabilities: capability
            ? {
                ...(eventAdmission ? { eventAdmission: { version: 1 } } : {}),
                groups: { version: 1, polls: 1 },
                eventManagement: {
                  version: 1,
                  ...(pendingRsvpJoin ? { pendingRsvpJoin: true } : {}),
                },
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

test('old server poll capability refusal attempts no write', async () => {
  const writes: string[] = [];
  await endpoint((req, res) => {
    writes.push(req.method ?? '');
    res.end('{}');
  }, false);
  const result = await cli([
    'groups',
    'polls',
    'create',
    'group1',
    '--title',
    'Vote',
    '--mode',
    'SINGLE',
    '--options-json',
    '[{"id":"yes","label":"Yes"},{"id":"no","label":"No"}]',
    '--results-visibility',
    'MEMBERS',
  ]);
  expect(result.code).toBe(5);
  expect(result.stderr).toContain('UNSUPPORTED_SERVER');
  expect(writes).toEqual([]);
});
test('polls preserve revision recovery, strict uncertain outcome and strip private unexpected fields', async () => {
  let malformed = false;
  const requests: { method: string | undefined; body: unknown }[] = [];
  await endpoint((req, res) => {
    let input = '';
    req.on('data', chunk => (input += chunk));
    req.on('end', () => {
      requests.push({
        method: req.method,
        body: input ? JSON.parse(input) : null,
      });
      res.end(
        JSON.stringify(
          malformed
            ? { revision: '1' }
            : { revision: 1, privateAnswers: { secret: 'never print' } }
        )
      );
    });
  });
  const args = [
    'groups',
    'polls',
    'submit',
    'group1',
    'poll1',
    '--poll-version',
    '2',
    '--expected-revision',
    '0',
    '--selections-json',
    '["yes"]',
  ];
  const good = await cli(args);
  expect(good.code, good.stderr).toBe(0);
  expect(JSON.parse(good.stdout)).toEqual({ revision: 1 });
  expect(good.stdout).not.toContain('secret');
  expect(requests[0]).toEqual({
    method: 'PUT',
    body: { version: 2, expectedRevision: 0, selections: ['yes'] },
  });
  malformed = true;
  const bad = await cli(args);
  expect(bad.code).toBe(5);
  expect(bad.stderr).toContain('UNCERTAIN_OUTCOME');
  expect(requests).toHaveLength(2);
});
