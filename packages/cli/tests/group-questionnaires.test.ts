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
                groupQuestionnaire: { version: 1 },
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

test('optional questionnaire CLI sends bounded read and validated private writes', async () => {
  const requests: Array<{ method?: string; url?: string; body?: unknown }> = [];
  await endpoint((req, res) => {
    let input = '';
    req.on('data', chunk => (input += chunk));
    req.on('end', () => {
      requests.push({
        method: req.method,
        url: req.url,
        body: input ? JSON.parse(input) : undefined,
      });
      res.end(
        JSON.stringify({
          groupId: 'group1',
          enabled: true,
          version: 1,
          questions: [],
          answers: {},
          savedQuestions: [],
          completed: true,
          shouldPrompt: false,
          canEdit: true,
          canConfigure: true,
          canReview: true,
        })
      );
    });
  });
  const form = await cli(['groups', 'questionnaire', 'get', 'group1']);
  expect(form.code).toBe(0);
  const configured = await cli([
    'groups',
    'questionnaire',
    'configure',
    'group1',
    '--enabled',
    'true',
    '--questions',
    '[]',
  ]);
  expect(configured.code).toBe(0);
  const submitted = await cli([
    'groups',
    'questionnaire',
    'submit',
    'group1',
    '--form-version',
    '1',
    '--answers',
    '{}',
  ]);
  expect(submitted.code).toBe(0);
  expect(requests).toEqual([
    { method: 'GET', url: '/api/v2/groups/group1/joining-questionnaire' },
    {
      method: 'PUT',
      url: '/api/v2/groups/group1/joining-questionnaire',
      body: { enabled: true, questions: [] },
    },
    {
      method: 'PUT',
      url: '/api/v2/groups/group1/joining-questionnaire/answers',
      body: { version: 1, answers: {} },
    },
  ]);
});
test('optional questionnaire writes refuse legacy servers before mutation', async () => {
  let writes = 0;
  await endpoint((req, res) => {
    writes++;
    res.end('{}');
  }, false);
  const result = await cli([
    'groups',
    'questionnaire',
    'configure',
    'group1',
    '--enabled',
    'false',
    '--questions',
    '[]',
  ]);
  expect(result.code).not.toBe(0);
  expect(JSON.parse(result.stderr).error.code).toBe('UNSUPPORTED_SERVER');
  expect(writes).toBe(0);
});

test('requiring completion refuses version 1 servers before sending a policy write', async () => {
  let writes = 0;
  await endpoint((req, res) => {
    writes++;
    res.end('{}');
  });
  const result = await cli([
    'groups',
    'questionnaire',
    'configure',
    'group1',
    '--enabled',
    'true',
    '--required-completion',
    'true',
    '--questions',
    '[]',
  ]);
  expect(result.code).not.toBe(0);
  expect(JSON.parse(result.stderr).error.code).toBe('UNSUPPORTED_SERVER');
  expect(writes).toBe(0);
});

for (const flag of [
  'requiredCompletion',
  'requiresCompletion',
  'canAccessMemberContent',
]) {
  test(`rejects malformed ${flag} status without trusting a truthy access value`, async () => {
    await endpoint((_req, res) =>
      res.end(
        JSON.stringify({
          groupId: 'group1',
          enabled: true,
          version: 1,
          questions: [],
          savedQuestions: [],
          answers: {},
          completed: false,
          shouldPrompt: true,
          canEdit: true,
          canConfigure: false,
          canReview: false,
          [flag]: 'true',
        })
      )
    );
    const result = await cli(['groups', 'questionnaire', 'status', 'group1']);
    expect(result.code).not.toBe(0);
    expect(result.stderr).toContain('INVALID_RESPONSE');
  });
}
