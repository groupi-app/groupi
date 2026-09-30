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
  config = await mkdtemp(join(tmpdir(), 'groupi-addons-'));
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
            ? { addonConfiguration: { version: 1 } }
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

const addonConfig = {
  id: 'addon1',
  addonType: 'reminders',
  enabled: true,
  config: { reminderOffset: '1_HOUR' },
  createdAt: 1,
  updatedAt: 2,
};
test('round-trips existing configuration with convenience options and human/JSON output', async () => {
  let current = addonConfig;
  let writes = 0;
  await endpoint(async (req, res) => {
    if (req.method === 'GET') {
      res.end(JSON.stringify({ items: [current], nextCursor: null }));
      return;
    }
    let text = '';
    for await (const chunk of req) text += chunk;
    current = { ...current, config: JSON.parse(text).config };
    writes++;
    res.end(
      JSON.stringify(req.method === 'PATCH' ? current : { message: 'Enabled' })
    );
  });
  const enabled = await cli([
    'addons',
    'enable',
    'event1',
    'reminders',
    '--reminder-offset',
    '1_HOUR',
    '--yes',
  ]);
  expect(enabled.code).toBe(0);
  expect(JSON.parse(enabled.stdout).message).toBe('Enabled');
  expect(enabled.stderr).toBe('');
  const changed = await cli([
    'addons',
    'configure',
    'event1',
    'reminders',
    '--config',
    '{"reminderOffset":"1_DAY"}',
    '--yes',
  ]);
  expect(changed.code).toBe(0);
  expect(JSON.parse(changed.stdout).config).toEqual({
    reminderOffset: '1_DAY',
  });
  const read = await cli(['addons', 'get', 'event1', 'reminders']);
  expect(JSON.parse(read.stdout).config).toEqual({ reminderOffset: '1_DAY' });
  const human = await cli(['addons', 'list', 'event1'], false);
  expect(human.stdout).toContain('addonType: reminders');
  expect(human.stdout).toContain('1_DAY');
  expect(writes).toBe(2);
});
test('requires destructive confirmation, validates fields, and refuses unsafe configuration sources', async () => {
  let writes = 0;
  await endpoint((req, res) => {
    writes++;
    res.end(JSON.stringify({ message: 'Disabled' }));
  });
  const disabled = await cli(['addons', 'disable', 'event1', 'reminders']);
  expect(disabled.code).toBe(2);
  expect(JSON.parse(disabled.stderr).error.code).toBe('CONFIRMATION_REQUIRED');
  expect(writes).toBe(0);
  const invalid = await cli([
    'addons',
    'enable',
    'event1',
    'questionnaire',
    '--questions',
    '[{"id":"q","label":"Meal?","type":"MULTIPLE_CHOICE","required":true}]',
    '--yes',
  ]);
  expect(invalid.code).toBe(2);
  expect(invalid.stderr).toContain('config.questions[0].options');
  expect(writes).toBe(0);
  const conflict = await cli([
    'addons',
    'enable',
    'event1',
    'reminders',
    '--config',
    '{}',
    '--reminder-offset',
    '1_HOUR',
    '--yes',
  ]);
  expect(conflict.code).toBe(2);
  expect(writes).toBe(0);
  const allowed = await cli([
    'addons',
    'disable',
    'event1',
    'reminders',
    '--yes',
  ]);
  expect(allowed.code).toBe(0);
  expect(writes).toBe(1);
});
test('supports existing custom template selection and JSON files without definition authoring', async () => {
  let body: unknown;
  await writeFile(
    join(config, 'addon.json'),
    JSON.stringify({ items: [{ id: 'i', name: 'Rice', quantity: 2 }] })
  );
  await endpoint(async (req, res) => {
    let text = '';
    for await (const chunk of req) text += chunk;
    body = JSON.parse(text);
    res.end(JSON.stringify({ message: 'Enabled' }));
  });
  expect(
    (
      await cli([
        'addons',
        'enable',
        'event1',
        'bring-list',
        '--config-file',
        join(config, 'addon.json'),
        '--yes',
      ])
    ).code
  ).toBe(0);
  expect(body).toEqual({
    config: { items: [{ id: 'i', name: 'Rice', quantity: 2 }] },
  });
  expect(
    (
      await cli([
        'addons',
        'enable',
        'event1',
        'custom:template1',
        '--template-id',
        'template1',
        '--yes',
      ])
    ).code
  ).toBe(0);
  expect(body).toEqual({ config: { templateId: 'template1' } });
});
test('never retries ambiguous config writes and keeps remote error secrets out of diagnostics', async () => {
  let writes = 0;
  await endpoint((req, _res) => {
    writes++;
    req.socket.destroy();
  });
  const uncertain = await cli([
    'addons',
    'enable',
    'event1',
    'reminders',
    '--reminder-offset',
    '1_HOUR',
    '--yes',
  ]);
  expect(uncertain.code).toBe(5);
  expect(uncertain.stderr).toContain('UNCERTAIN_OUTCOME');
  expect(uncertain.stderr).toContain('addons get event1 reminders');
  expect(writes).toBe(1);
  await endpoint((req, res) => {
    res.statusCode = 400;
    res.end(
      JSON.stringify({
        error: {
          code: 'BAD_REQUEST',
          message: 'private-test-key input-secret',
        },
      })
    );
  });
  const invalid = await cli([
    'addons',
    'enable',
    'event1',
    'custom:template1',
    '--template-id',
    'template1',
    '--yes',
  ]);
  expect(invalid.code).toBe(2);
  expect(invalid.stderr).toContain('config.template');
  expect(invalid.stderr).not.toContain('private-test-key');
  expect(invalid.stderr).not.toContain('input-secret');
  expect(invalid.stdout).toBe('');
});
test('refuses servers without corrected configuration lifecycle capability', async () => {
  let writes = 0;
  await endpoint((req, res) => {
    writes++;
    res.end('{}');
  }, false);
  const result = await cli([
    'addons',
    'enable',
    'event1',
    'reminders',
    '--reminder-offset',
    '1_HOUR',
    '--yes',
  ]);
  expect(result.code).toBe(5);
  expect(result.stderr).toContain('UNSUPPORTED_SERVER');
  expect(writes).toBe(0);
});
