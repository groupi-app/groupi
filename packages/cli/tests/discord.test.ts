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
  config = await mkdtemp(join(tmpdir(), 'groupi-discord-'));
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
          capabilities: capability ? { discordGuilds: { version: 1 } } : {},
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

test('refresh rejects missing link with safe browser guidance and does not retry', async () => {
  let writes = 0;
  await endpoint((_req, res) => {
    writes++;
    res.statusCode = 409;
    res.end(
      JSON.stringify({
        error: { code: 'DISCORD_NOT_LINKED', message: 'private-test-key' },
      })
    );
  });
  const result = await cli(['discord', 'guilds', 'refresh']);
  expect(result.code).toBe(2);
  expect(result.stderr).toContain(
    'Link Discord to the selected identity in the app'
  );
  expect(result.stdout + result.stderr).not.toContain('private-test-key');
  expect(writes).toBe(1);
});

test('malformed refresh success reports uncertainty with inspect guidance', async () => {
  let writes = 0;
  await endpoint((_req, res) => {
    writes++;
    res.end(JSON.stringify({ accessToken: 'secret-provider-token' }));
  });
  const result = await cli(['discord', 'guilds', 'refresh']);
  expect(result.code).toBe(5);
  expect(result.stderr).toContain('UNCERTAIN_OUTCOME');
  expect(result.stderr).toContain('discord guilds list');
  expect(result.stdout + result.stderr).not.toContain('secret-provider-token');
  expect(writes).toBe(1);
});

test('list bounds pagination and discards unexpected credential fields', async () => {
  const paths: string[] = [];
  await endpoint((req, res) => {
    paths.push(req.url ?? '');
    const next = !req.url?.includes('cursor=next');
    res.end(
      JSON.stringify({
        items: [
          {
            id: next ? '1' : '2',
            name: 'Friends',
            status: 'available',
            authorizedAt: 1,
            expiresAt: 900001,
            accessToken: 'secret-provider-token',
          },
        ],
        nextCursor: next ? 'next' : null,
      })
    );
  });
  const result = await cli([
    'discord',
    'guilds',
    'list',
    '--limit',
    '1',
    '--all',
  ]);
  expect(result.code, result.stderr).toBe(0);
  expect(JSON.parse(result.stdout).items).toHaveLength(2);
  expect(paths).toHaveLength(2);
  expect(result.stdout).not.toContain('secret-provider-token');
});
