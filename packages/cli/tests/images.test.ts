import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createServer, type Server } from 'node:http';
import { afterEach, beforeEach, expect, test } from 'vitest';
let config: string;
let server: Server | undefined;
beforeEach(async () => {
  config = await mkdtemp(join(tmpdir(), 'groupi-images-'));
  await writeFile(
    join(config, 'photo.png'),
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  );
});
afterEach(async () => {
  if (server) {
    server.closeAllConnections();
    await new Promise<void>(done => server!.close(() => done()));
    server = undefined;
  }
  await rm(config, { recursive: true, force: true });
});
function cli(args: string[]) {
  return new Promise<{ code: number | null; stdout: string; stderr: string }>(
    (done, reject) => {
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
            GROUPI_API_KEY: 'image-test-key',
            GROUPI_API_KEY_PROFILE: 'test',
          },
          stdio: ['ignore', 'pipe', 'pipe'],
        }
      );
      let stdout = '',
        stderr = '';
      child.stdout.on('data', value => (stdout += value));
      child.stderr.on('data', value => (stderr += value));
      child.on('error', reject);
      child.on('close', code => done({ code, stdout, stderr }));
    }
  );
}
async function endpoint(mode: 'lost' | 'invalid' | 'redirect') {
  let writes = 0,
    uploads = 0,
    cleanup = 0;
  server = createServer(async (req, res) => {
    if (req.url === '/api/v2/health') {
      res.end(
        JSON.stringify({ capabilities: { imageWrites: { version: 1 } } })
      );
      return;
    }
    if (req.url?.startsWith('/api/v2/uploads?')) {
      uploads++;
      for await (const _chunk of req) {
        void _chunk;
      }
      res.writeHead(201, { 'content-type': 'application/json' });
      res.end(
        JSON.stringify({
          storageId: 'storage-1',
          size: 8,
          mimeType: 'image/png',
        })
      );
      return;
    }
    if (req.url === '/api/v2/uploads/storage-1') {
      cleanup++;
      res.writeHead(403);
      res.end(JSON.stringify({ error: { code: 'FORBIDDEN' } }));
      return;
    }
    if (req.method === 'PUT') {
      writes++;
      for await (const _chunk of req) {
        void _chunk;
      }
      if (mode === 'lost') req.socket.destroy();
      else if (mode === 'redirect') {
        res.writeHead(307, { location: 'https://untrusted.example/upload' });
        res.end();
      } else res.end('{"unexpected":true}');
      return;
    }
    res.end(
      JSON.stringify({
        storageId: 'storage-1',
        imageUrl: 'https://image.example/current.png',
        focalPoint: null,
      })
    );
  });
  await new Promise<void>(done => server!.listen(0, '127.0.0.1', done));
  const address = server.address();
  if (!address || typeof address === 'string') throw Error('Missing address');
  await writeFile(
    join(config, 'test.json'),
    JSON.stringify({ apiUrl: `http://127.0.0.1:${address.port}/api/v2` })
  );
  return () => ({ writes, uploads, cleanup });
}
for (const mode of ['lost', 'invalid', 'redirect'] as const)
  test(`public executable reports uncertain ${mode} image response without retrying or claiming cleanup succeeded`, async () => {
    const counts = await endpoint(mode);
    const result = await cli([
      'account',
      'avatar',
      'set',
      '--file',
      join(config, 'photo.png'),
    ]);
    expect(result.code).toBe(5);
    expect(result.stdout).toBe('');
    expect(JSON.parse(result.stderr)).toMatchObject({
      error: { code: 'UNCERTAIN_OUTCOME' },
    });
    expect(result.stderr).toContain('account avatar get');
    expect(result.stderr).not.toContain('image-test-key');
    expect(counts()).toEqual({ writes: 1, uploads: 1, cleanup: 1 });
    const inspect = await cli(['account', 'avatar', 'get']);
    expect(inspect.code).toBe(0);
    expect(JSON.parse(inspect.stdout).storageId).toBe('storage-1');
  });
test('headless removal requires explicit confirmation before writing', async () => {
  const counts = await endpoint('lost');
  const result = await cli(['account', 'avatar', 'remove']);
  expect(result.code).toBe(2);
  expect(JSON.parse(result.stderr).error.code).toBe('CONFIRMATION_REQUIRED');
  expect(counts()).toEqual({ writes: 0, uploads: 0, cleanup: 0 });
});
