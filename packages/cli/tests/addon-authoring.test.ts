import { createServer, type Server, type RequestListener } from 'node:http';
import { spawn } from 'node:child_process';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { beforeEach, afterEach, expect, test } from 'vitest';
let config: string;
let server: Server | undefined;
beforeEach(async () => {
  config = await mkdtemp(join(tmpdir(), 'cli-authoring-'));
});
afterEach(async () => {
  server?.closeAllConnections();
  if (server) await new Promise<void>(done => server!.close(() => done()));
  server = undefined;
  await rm(config, { recursive: true, force: true });
});
async function cli(args: string[], stdin = '') {
  return new Promise<{ code: number | null; stdout: string; stderr: string }>(
    (resolveResult, reject) => {
      const child = spawn(
        process.execPath,
        [
          process.env.CLI_TEST_BIN ?? resolve('bin/groupi.js'),
          '--profile',
          'test',
          '--format',
          'json',
          ...args,
        ],
        {
          env: {
            ...process.env,
            GROUPI_CONFIG_DIR: config,
            GROUPI_API_KEY: 'synthetic-test-key',
            GROUPI_API_KEY_PROFILE: 'test',
          },
          stdio: 'pipe',
        }
      );
      let stdout = '',
        stderr = '';
      child.stdout.on('data', value => {
        stdout += value;
      });
      child.stderr.on('data', value => {
        stderr += value;
      });
      child.on('error', reject);
      child.on('close', code => resolveResult({ code, stdout, stderr }));
      child.stdin.end(stdin);
    }
  );
}
test('rejects malformed portable definitions before authentication and never echoes their contents', async () => {
  const file = join(config, 'definition.json');
  await writeFile(file, '{PRIVATE-INVALID-CONTENT');
  const result = await cli(['addons', 'definitions', 'import', '--file', file]);
  expect(result.code).toBe(2);
  expect(JSON.parse(result.stderr).error.message).toContain('valid JSON');
  expect(result.stderr).not.toContain('PRIVATE-INVALID-CONTENT');
  expect(result.stdout).toBe('');
});

const definition = {
  schemaVersion: 1,
  name: 'Meal choice',
  description: 'Choose a meal',
  iconName: 'listChecks',
  template: {
    name: 'Meal choice',
    description: 'Choose a meal',
    iconName: 'listChecks',
    sections: [
      {
        id: 'meal',
        title: 'Meal',
        layout: 'form',
        fields: [
          {
            id: 'choice',
            type: 'select',
            label: 'Meal',
            required: true,
            options: ['Rice', 'Pasta'],
          },
        ],
      },
    ],
  },
};
async function serve(handler: RequestListener) {
  server = createServer(handler);
  await new Promise<void>((done, reject) => {
    server!.once('error', reject);
    server!.listen(0, '127.0.0.1', done);
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw Error('Missing test port');
  await writeFile(
    join(config, 'test.json'),
    JSON.stringify({ apiUrl: `http://127.0.0.1:${address.port}/api/v2` })
  );
}
test('imports a draft and exports a portable document without IDs, owners or lifecycle metadata', async () => {
  const bodies: unknown[] = [];
  const record = {
    ...definition,
    id: 'template1',
    version: 1,
    isPublished: false,
    createdAt: 1000,
    updatedAt: 1000,
    ownerId: 'private-owner',
  };
  await serve(async (req, res) => {
    res.setHeader('content-type', 'application/json');
    if (req.url?.endsWith('/health')) {
      res.end(
        JSON.stringify({ capabilities: { addonAuthoring: { version: 1 } } })
      );
      return;
    }
    if (req.method === 'POST') {
      let raw = '';
      for await (const chunk of req) raw += chunk;
      bodies.push(JSON.parse(raw));
    }
    res.end(JSON.stringify(record));
  });
  const imported = await cli(
    ['addons', 'definitions', 'import', '--stdin'],
    JSON.stringify(definition)
  );
  expect(imported.code).toBe(0);
  expect(JSON.parse(imported.stdout)).toMatchObject({
    id: 'template1',
    isPublished: false,
  });
  expect(bodies).toEqual([definition]);
  const exported = await cli(['addons', 'definitions', 'export', 'template1']);
  expect(exported.code).toBe(0);
  expect(JSON.parse(exported.stdout)).toEqual(definition);
  expect(exported.stdout).not.toContain('private-owner');
});
test('requires an inspected version and explicit confirmation before replacing or deleting a definition', async () => {
  const writes: {
    method: string | undefined;
    url: string | undefined;
    body: unknown;
  }[] = [];
  await serve(async (req, res) => {
    res.setHeader('content-type', 'application/json');
    if (req.url?.endsWith('/health')) {
      res.end(
        JSON.stringify({ capabilities: { addonAuthoring: { version: 1 } } })
      );
      return;
    }
    let body = '';
    for await (const chunk of req) body += chunk;
    writes.push({
      method: req.method,
      url: req.url,
      body: body ? JSON.parse(body) : null,
    });
    res.end(
      JSON.stringify(
        req.method === 'DELETE'
          ? { id: 'template1', deleted: true }
          : {
              ...definition,
              id: 'template1',
              version: 2,
              isPublished: false,
              createdAt: 1000,
              updatedAt: 2000,
            }
      )
    );
  });
  const file = join(config, 'definition.json');
  await writeFile(file, JSON.stringify(definition));
  let response = await cli([
    'addons',
    'definitions',
    'edit',
    'template1',
    '--file',
    file,
    '--expected-version',
    '1',
  ]);
  expect(response.code).toBe(2);
  expect(JSON.parse(response.stderr).error.code).toBe('CONFIRMATION_REQUIRED');
  expect(writes).toEqual([]);
  response = await cli([
    'addons',
    'definitions',
    'edit',
    'template1',
    '--file',
    file,
    '--expected-version',
    '1',
    '--yes',
  ]);
  expect(response.code).toBe(0);
  expect(writes[0]).toEqual({
    method: 'PATCH',
    url: '/api/v2/addon-template-definitions/template1',
    body: { ...definition, expectedVersion: 1 },
  });
  response = await cli([
    'addons',
    'definitions',
    'delete',
    'template1',
    '--expected-version',
    '2',
    '--yes',
  ]);
  expect(response.code).toBe(0);
  expect(writes[1]).toEqual({
    method: 'DELETE',
    url: '/api/v2/addon-template-definitions/template1?expectedVersion=2',
    body: null,
  });
});
test('does not retry uncertain creation and rejects incomplete lifecycle success', async () => {
  let writes = 0;
  await serve(async (req, res) => {
    res.setHeader('content-type', 'application/json');
    if (req.url?.endsWith('/health')) {
      res.end(
        JSON.stringify({ capabilities: { addonAuthoring: { version: 1 } } })
      );
      return;
    }
    writes++;
    if (writes === 1) {
      req.socket.destroy();
      return;
    }
    res.end(
      JSON.stringify({
        ...definition,
        id: 'template1',
        version: 2,
        isPublished: false,
        createdAt: 1000,
        updatedAt: 2000,
      })
    );
  });
  let response = await cli(
    ['addons', 'definitions', 'create', '--stdin'],
    JSON.stringify(definition)
  );
  expect(response.code).toBe(5);
  expect(JSON.parse(response.stderr).error).toMatchObject({
    code: 'UNCERTAIN_OUTCOME',
    message: expect.stringContaining('definitions list'),
  });
  expect(writes).toBe(1);
  response = await cli([
    'addons',
    'definitions',
    'publish',
    'template1',
    '--expected-version',
    '1',
    '--yes',
  ]);
  expect(response.code).toBe(5);
  expect(JSON.parse(response.stderr).error.code).toBe('UNCERTAIN_OUTCOME');
  expect(writes).toBe(2);
});
test('checks compatibility before writing and stops repeated pagination cursors', async () => {
  let writes = 0,
    reads = 0;
  await serve((req, res) => {
    res.setHeader('content-type', 'application/json');
    if (req.method !== 'GET') writes++;
    if (req.url?.endsWith('/health')) {
      res.end('{}');
      return;
    }
    reads++;
    res.end('{"items":[],"nextCursor":"repeated"}');
  });
  let response = await cli(
    ['addons', 'definitions', 'create', '--stdin'],
    JSON.stringify(definition)
  );
  expect(response.code).toBe(5);
  expect(JSON.parse(response.stderr).error.code).toBe('UNSUPPORTED_SERVER');
  expect(writes).toBe(0);
  response = await cli(['addons', 'definitions', 'list', '--all']);
  expect(response.code).toBe(5);
  expect(JSON.parse(response.stderr).error.code).toBe('INVALID_RESPONSE');
  expect(reads).toBe(2);
});
test('refuses conflicting stdin consumers, oversized input, unknown envelope fields and missing version', async () => {
  let response = await cli(
    ['--api-key-stdin', 'addons', 'definitions', 'import', '--stdin'],
    'private'
  );
  expect(response.code).toBe(2);
  expect(response.stderr).toContain('cannot both consume stdin');
  expect(response.stderr).not.toContain('private');
  response = await cli(
    ['addons', 'definitions', 'import', '--stdin'],
    'x'.repeat(65537)
  );
  expect(response.code).toBe(2);
  expect(response.stderr).toContain('64 KiB');
  await serve((_req, res) => {
    res.end('{"capabilities":{"addonAuthoring":{"version":1}}}');
  });
  response = await cli(
    ['addons', 'definitions', 'import', '--stdin'],
    JSON.stringify({ ...definition, ownerId: 'other-user' })
  );
  expect(response.code).toBe(2);
  expect(response.stderr).toContain('unknown fields');
  response = await cli([
    'addons',
    'definitions',
    'delete',
    'template1',
    '--yes',
  ]);
  expect(response.code).toBe(2);
});
test('reports bounded field-specific schema diagnostics without exposing credentials or terminal controls', async () => {
  await serve((req, res) => {
    res.setHeader('content-type', 'application/json');
    if (req.url?.endsWith('/health')) {
      res.end('{"capabilities":{"addonAuthoring":{"version":1}}}');
      return;
    }
    res.statusCode = 400;
    res.end(
      JSON.stringify({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'invalid',
          issues: [
            {
              path: 'template.sections.0.fields.0.options',
              message:
                'Provide at least one option. synthetic-test-key\u001b[31m',
            },
            { path: 'INVALID\u001bPATH', message: 'untrusted' },
          ],
        },
      })
    );
  });
  const response = await cli(
    ['addons', 'definitions', 'create', '--stdin'],
    JSON.stringify(definition)
  );
  expect(response.code).toBe(2);
  expect(JSON.parse(response.stderr).error.message).toContain(
    'template.sections.0.fields.0.options: Provide at least one option.'
  );
  expect(response.stderr).not.toContain('synthetic-test-key');
  expect(response.stderr).not.toContain('INVALID');
  expect(JSON.parse(response.stderr).error.message).not.toContain('\u001b');
});
