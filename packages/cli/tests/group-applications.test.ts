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
                groupApplications: { version: 1 },
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

test('old servers receive zero Group application writes', async () => {
  const requests: string[] = [];
  await endpoint((req, res) => {
    requests.push(req.method!);
    res.end('{}');
  }, false);
  const response = await cli(['groups', 'apply', 'g1', '--answers', '{}']);
  expect(response.code).toBe(5);
  expect(JSON.parse(response.stderr)).toMatchObject({
    error: { code: 'UNSUPPORTED_SERVER' },
  });
  expect(requests).toEqual([]);
});
test('private Group application summaries strip unrelated contacts from manager projections', async () => {
  await endpoint((_req, res) =>
    res.end(
      JSON.stringify({
        items: [
          {
            _id: 'a1',
            groupId: 'g1',
            personId: 'p1',
            questions: [],
            answers: {},
            status: 'DECLINED',
            submittedAt: 123,
            updatedAt: 124,
            decisions: [
              {
                status: 'DECLINED',
                actorId: 'p2',
                at: 124,
                email: 'private@example.com',
              },
            ],
            applicant: {
              personId: 'p1',
              name: 'Alex',
              username: 'alex',
              image: null,
              email: 'private@example.com',
            },
            email: 'private@example.com',
          },
        ],
        nextCursor: null,
      })
    )
  );
  const response = await cli(['groups', 'applications', 'g1', '--all']);
  expect(response.code).toBe(0);
  expect(JSON.parse(response.stdout).items[0]).toMatchObject({
    _id: 'a1',
    applicant: { personId: 'p1', username: 'alex' },
  });
  expect(response.stdout).not.toContain('private@example.com');
});

test('preserves a validated optional joining status and rejects malformed status after an application review', async () => {
  let malformed = false;
  await endpoint((_req, res) =>
    res.end(
      JSON.stringify({
        applicationId: 'a1',
        status: 'APPROVED',
        joiningQuestionnaire: {
          enabled: true,
          completed: false,
          shouldPrompt: malformed ? 'yes' : true,
          version: 3,
          answers: { secret: 'private' },
        },
      })
    )
  );
  const args = [
    'groups',
    'application-review',
    'g1',
    'a1',
    '--decision',
    'APPROVED',
    '--yes',
  ];
  const good = await cli(args);
  expect(good.code).toBe(0);
  expect(JSON.parse(good.stdout)).toEqual({
    applicationId: 'a1',
    status: 'APPROVED',
    joiningQuestionnaire: {
      enabled: true,
      completed: false,
      shouldPrompt: true,
      version: 3,
    },
  });
  malformed = true;
  const bad = await cli(args);
  expect(bad.code).not.toBe(0);
  expect(bad.stdout).not.toContain('private');
});

for (const flags of [
  {
    requiredCompletion: true,
    requiresCompletion: true,
    canAccessMemberContent: false,
  },
  { requiredCompletion: true },
  {
    requiredCompletion: 'true',
    requiresCompletion: true,
    canAccessMemberContent: false,
  },
]) {
  test(`validates complete required onboarding status ${JSON.stringify(flags)} after approval`, async () => {
    await endpoint((_req, res) =>
      res.end(
        JSON.stringify({
          applicationId: 'a1',
          status: 'APPROVED',
          joiningQuestionnaire: {
            enabled: true,
            completed: false,
            shouldPrompt: true,
            version: 1,
            ...flags,
            answers: { secret: 'private' },
          },
        })
      )
    );
    const result = await cli([
      'groups',
      'application-review',
      'g1',
      'a1',
      '--decision',
      'APPROVED',
      '--yes',
    ]);
    if (
      Object.keys(flags).length === 3 &&
      typeof flags.requiredCompletion === 'boolean'
    ) {
      expect(result.code).toBe(0);
      expect(JSON.parse(result.stdout).joiningQuestionnaire).toMatchObject(
        flags
      );
    } else {
      expect(result.code).toBe(5);
      expect(result.stderr).toContain('UNCERTAIN_OUTCOME');
    }
    expect(result.stdout).not.toContain('private');
  });
}
