import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile, chmod, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  createServer,
  type Server,
  type IncomingMessage,
  type ServerResponse,
} from 'node:http';
import { beforeEach, afterEach, expect, test } from 'vitest';
let config: string;
const servers: Server[] = [];
beforeEach(async () => {
  config = await mkdtemp(join(tmpdir(), 'groupi-account-'));
});
afterEach(async () => {
  for (const server of servers.splice(0)) {
    server.closeAllConnections();
    await new Promise<void>(done => server.close(() => done()));
  }
  await rm(config, { recursive: true, force: true });
});
async function endpoint(
  handler: (req: IncomingMessage, res: ServerResponse) => void
) {
  const server = createServer((req, res) => {
    res.setHeader('content-type', 'application/json');
    handler(req, res);
  });
  servers.push(server);
  await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
  const address = server.address();
  if (!address || typeof address === 'string') throw Error('No port');
  await writeFile(
    join(config, 'test.json'),
    JSON.stringify({
      apiUrl: `http://127.0.0.1:${address.port}/api/v2`,
      webUrl: 'https://selected.example',
    })
  );
}
async function cli(
  args: string[],
  options: {
    json?: boolean;
    interactive?: boolean;
    keyProfile?: string;
    profile?: string;
  } = {}
) {
  return new Promise<{ code: number | null; stdout: string; stderr: string }>(
    (done, reject) => {
      const child = spawn(
        process.execPath,
        [
          ...(options.interactive
            ? [
                '--import',
                pathToFileURL(
                  resolve('tests/fixtures/interactive-environment.mjs')
                ).href,
              ]
            : []),
          process.env.CLI_TEST_BIN ?? resolve('bin/groupi.js'),
          '--profile',
          options.profile ?? 'test',
          ...(options.json === false ? [] : ['--format', 'json']),
          ...args,
        ],
        {
          env: {
            ...process.env,
            GROUPI_CONFIG_DIR: config,
            GROUPI_API_KEY: 'secret-account-key',
            GROUPI_API_KEY_PROFILE: options.keyProfile ?? 'test',
            PATH: `${config}:${process.env.PATH}`,
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
const profile = {
  personId: 'person-1',
  userId: 'user-1',
  name: 'Sample',
  email: 'test@example.com',
  image: null,
  username: 'sample',
  bio: null,
  pronouns: null,
};
test('public executable reads and edits profile with JSON and safe human output', async () => {
  let writes = 0;
  await endpoint(async (req, res) => {
    expect(req.headers['x-api-key']).toBe('secret-account-key');
    if (req.method === 'PUT') {
      writes++;
      let data = '';
      for await (const chunk of req) data += chunk;
      expect(JSON.parse(data)).toEqual({ name: 'Updated', bio: 'Hi' });
    }
    res.end(
      JSON.stringify({
        ...profile,
        name: req.method === 'PUT' ? 'Updated' : 'Sample\x1b[31m',
        privateKey: 'secret-account-key',
      })
    );
  });
  const edited = await cli([
    'account',
    'edit',
    '--name',
    'Updated',
    '--bio',
    'Hi',
  ]);
  expect(edited.code).toBe(0);
  expect(JSON.parse(edited.stdout)).toMatchObject({ name: 'Updated' });
  expect(edited.stdout + edited.stderr).not.toContain('secret-account-key');
  expect(writes).toBe(1);
  const read = await cli(['account', 'get'], { json: false });
  expect(read.code).toBe(0);
  expect(read.stdout).toContain('name: Sample');
  expect(read.stdout).not.toContain('\x1b');
  const empty = await cli(['account', 'edit']);
  expect(empty.code).toBe(2);
  expect(JSON.parse(empty.stderr).error.code).toBe('USAGE');
  expect(writes).toBe(1);
});
test('ordinary preferences persist via selected endpoints and replacement requires confirmation', async () => {
  const writes: string[] = [];
  await endpoint(async (req, res) => {
    for await (const _chunk of req) {
      /* Consume request. */
    }
    if (req.method === 'PUT') writes.push(req.url!);
    const result = req.url?.includes('privacy')
      ? { allowFriendRequestsFrom: 'NO_ONE', allowEventInvitesFrom: 'EVERYONE' }
      : req.url?.includes('themes')
        ? {
            selectedThemeType: 'base',
            selectedThemeId: 'groupi-dark',
            selectedCustomThemeId: null,
            useSystemPreference: false,
            systemLightThemeId: 'groupi-light',
            systemDarkThemeId: 'groupi-dark',
          }
        : { methods: [], typeSettings: [] };
    res.end(JSON.stringify(result));
  });
  expect(
    (await cli(['settings', 'privacy', 'set', '--friend-requests', 'NO_ONE']))
      .code
  ).toBe(0);
  expect(
    (
      await cli([
        'settings',
        'theme',
        'set',
        '--data',
        JSON.stringify({
          selectedThemeType: 'base',
          selectedThemeId: 'groupi-dark',
          useSystemPreference: false,
          systemLightThemeId: 'groupi-light',
          systemDarkThemeId: 'groupi-dark',
        }),
      ])
    ).code
  ).toBe(0);
  const denied = await cli([
    'settings',
    'notifications',
    'set',
    '--data',
    '{"notificationMethods":[]}',
  ]);
  expect(denied.code).toBe(2);
  expect(JSON.parse(denied.stderr).error.code).toBe('CONFIRMATION_REQUIRED');
  expect(
    (
      await cli([
        'settings',
        'notifications',
        'set',
        '--data',
        '{"notificationMethods":[]}',
        '--yes',
      ])
    ).code
  ).toBe(0);
  expect(writes).toEqual([
    '/api/v2/settings/privacy',
    '/api/v2/themes/preferences',
    '/api/v2/settings/notifications',
  ]);
});
test('wrong and unknown profiles fail before contacting another identity', async () => {
  let reads = 0;
  await endpoint((_req, res) => {
    reads++;
    res.end(JSON.stringify(profile));
  });
  const wrong = await cli(['account', 'get'], { keyProfile: 'another' });
  expect(wrong.code).toBe(3);
  expect(JSON.parse(wrong.stderr).error.code).toBe('KEY_PROFILE_MISMATCH');
  const unknown = await cli(['account', 'get'], { profile: 'unknown' });
  expect(unknown.code).toBe(2);
  expect(JSON.parse(unknown.stderr).error.code).toBe('UNKNOWN_PROFILE');
  expect(reads).toBe(0);
});
test('JSON and headless browser exceptions are actionable, secret-free and never launch a browser', async () => {
  await endpoint((_req, res) => res.end('{}'));
  for (const operation of ['passkeys', 'linked-accounts']) {
    const result = await cli(['account', operation]);
    expect(result.code).toBe(3);
    expect(result.stdout).toBe('');
    expect(JSON.parse(result.stderr).error.code).toBe(
      'BROWSER_INTERACTION_REQUIRED'
    );
    expect(result.stderr).toContain('--profile test');
    expect(result.stderr).not.toContain('secret-account-key');
    expect((await cli(['account', operation], { json: false })).code).toBe(3);
  }
});
test.skipIf(process.platform === 'win32')(
  'interactive handoff opens the selected website without credentials and explains remaining action',
  async () => {
    await endpoint((_req, res) => res.end('{}'));
    const log = join(config, 'opened.txt');
    for (const launcher of ['open', 'xdg-open']) {
      const file = join(config, launcher);
      await writeFile(file, `#!/bin/sh\nprintf '%s' "$1" > '${log}'\n`);
      await chmod(file, 0o700);
    }
    for (const operation of ['passkeys', 'linked-accounts']) {
      const result = await cli(['account', operation], {
        json: false,
        interactive: true,
      });
      expect(result.code).toBe(0);
      expect(await readFile(log, 'utf8')).toBe(
        'https://selected.example/settings/account'
      );
      expect(result.stderr).toContain('Sign into the intended account');
      expect(result.stdout).toContain('has not completed');
      expect(result.stdout + result.stderr).not.toContain('secret-account-key');
    }
    await writeFile(
      join(config, 'test.json'),
      JSON.stringify({ apiUrl: 'https://other.example/api/v2' })
    );
    const missing = await cli(['account', 'passkeys'], {
      json: false,
      interactive: true,
    });
    expect(missing.code).toBe(2);
    expect(missing.stderr).toContain('WEB_URL_REQUIRED');
  }
);
test('ambiguous preference updates are not retried and give an inspection command', async () => {
  let writes = 0;
  await endpoint((req, res) => {
    writes++;
    res.destroy();
  });
  const result = await cli(['account', 'edit', '--bio', 'Changed']);
  expect(result.code).toBe(5);
  expect(JSON.parse(result.stderr).error.code).toBe('UNCERTAIN_OUTCOME');
  expect(result.stderr).toContain('account get');
  expect(writes).toBe(1);
});

test('incomplete successful preference writes report uncertain outcome with recovery', async () => {
  let writes = 0;
  await endpoint((_req, res) => {
    writes++;
    res.end('{}');
  });
  const response = await cli(['account', 'edit', '--bio', 'Saved']);
  expect(response.code).toBe(5);
  expect(JSON.parse(response.stderr).error.code).toBe('UNCERTAIN_OUTCOME');
  expect(response.stderr).toContain('account get');
  expect(writes).toBe(1);
});
