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
                groups: { version: 1, forms: 1 },
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

test('ordinary forms CLI preserves scope, versions, privacy and destructive confirmation', async () => {
  const requests: {
    method: string | undefined;
    url: string | undefined;
    body: unknown;
  }[] = [];
  await endpoint((req, res) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
    });
    req.on('end', () => {
      requests.push({
        method: req.method,
        url: req.url,
        body: data ? JSON.parse(data) : null,
      });
      if (req.method === 'DELETE' || req.method === 'PATCH') {
        res.statusCode = 204;
        res.end();
      } else if (req.method === 'POST') {
        res.statusCode = 201;
        res.end(JSON.stringify({ toolId: 'form1' }));
      } else if (req.method === 'PUT') res.end(JSON.stringify({ revision: 1 }));
      else
        res.end(JSON.stringify({ page: [], isDone: true, continueCursor: '' }));
    });
  });
  expect(
    (
      await cli([
        'groups',
        'forms',
        'create',
        'group1',
        '--title',
        'Survey',
        '--questions-json',
        '[]',
        '--results-visibility',
        'MEMBERS',
      ])
    ).code
  ).toBe(0);
  expect(requests.at(-1)).toEqual({
    method: 'POST',
    url: '/api/v2/groups/group1/forms',
    body: { title: 'Survey', questions: [], resultsVisibility: 'MEMBERS' },
  });
  expect(
    (
      await cli([
        'groups',
        'forms',
        'submit',
        'group1',
        'form1',
        '--form-version',
        '2',
        '--expected-revision',
        '0',
        '--answers-json',
        '{}',
      ])
    ).code
  ).toBe(0);
  expect(requests.at(-1)).toEqual({
    method: 'PUT',
    url: '/api/v2/groups/group1/forms/form1/response',
    body: { version: 2, expectedRevision: 0, answers: {} },
  });
  expect(
    (
      await cli([
        'groups',
        'forms',
        'history',
        'group1',
        'form1',
        '--limit',
        '3',
        '--cursor',
        'next',
      ])
    ).code
  ).toBe(0);
  expect(requests.at(-1)?.url).toBe(
    '/api/v2/groups/group1/forms/form1/history?limit=3&cursor=next'
  );
  const before = requests.length;
  expect(
    (await cli(['groups', 'forms', 'delete', 'group1', 'form1'])).code
  ).toBe(2);
  expect(requests).toHaveLength(before);
  expect(
    (
      await cli([
        'groups',
        'forms',
        'moderate',
        'group1',
        'form1',
        'response1',
        '--yes',
      ])
    ).code
  ).toBe(0);
  expect(requests.at(-1)?.url).toBe(
    '/api/v2/groups/group1/forms/form1/results/response1'
  );
  expect(
    (await cli(['groups', 'forms', 'remove-own', 'group1', 'form1', '--yes']))
      .code
  ).toBe(0);
  expect(requests.at(-1)?.url).toBe(
    '/api/v2/groups/group1/forms/form1/response'
  );
});

test('forms capability refusal sends no write and invalid revision is local usage', async () => {
  const requests: string[] = [];
  await endpoint((req, res) => {
    requests.push(req.method ?? '');
    res.end('{}');
  }, false);
  const refused = await cli([
    'groups',
    'forms',
    'create',
    'group1',
    '--title',
    'Survey',
    '--questions-json',
    '[]',
    '--results-visibility',
    'MANAGERS',
  ]);
  expect(refused.code).toBe(5);
  expect(refused.stderr).toContain('UNSUPPORTED_SERVER');
  expect(requests).toEqual([]);
  const invalid = await cli([
    'groups',
    'forms',
    'submit',
    'group1',
    'form1',
    '--form-version',
    '1',
    '--expected-revision',
    '-1',
    '--answers-json',
    '{}',
  ]);
  expect(invalid.code).toBe(2);
  expect(requests).toEqual([]);
});
