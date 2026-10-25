import { uploadFile } from '../src/uploads.js';
import { spawn } from 'node:child_process';
import { createServer, type Server } from 'node:http';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { beforeEach, afterEach, test, expect, vi } from 'vitest';
let config: string;
let server: Server | undefined;
beforeEach(async () => {
  config = await mkdtemp(join(tmpdir(), 'cli-content-'));
});
afterEach(async () => {
  vi.unstubAllGlobals();
  server?.closeAllConnections();
  if (server) await new Promise<void>(done => server!.close(() => done()));
  server = undefined;
  await rm(config, { recursive: true, force: true });
});
async function cli(args: string[], stdin = '') {
  return new Promise<{ code: number | null; stdout: string; stderr: string }>(
    done => {
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
            GROUPI_API_KEY: 'test-secret',
            GROUPI_API_KEY_PROFILE: 'test',
          },
          stdio: 'pipe',
        }
      );
      let stdout = '',
        stderr = '';
      child.stdout.on('data', v => (stdout += v));
      child.stderr.on('data', v => (stderr += v));
      child.on('close', code => done({ code, stdout, stderr }));
      child.stdin.end(stdin);
    }
  );
}
test('content stdin conflicts fail before authentication/network, missing input never prompts', async () => {
  let r = await cli(
    ['--api-key-stdin', 'posts', 'create', 'event', '--title', 'A', '--stdin'],
    'do not echo'
  );
  expect(r.code).toBe(2);
  expect(r.stderr).toContain('cannot both consume stdin');
  expect(r.stderr).not.toContain('do not echo');
  r = await cli(['posts', 'create', 'event', '--title', 'A']);
  expect(r.code).toBe(2);
});
test('reads Markdown/file/stdin inputs and treats a lost parent response as uncertain without replay', async () => {
  let writes = 0;
  const bodies: unknown[] = [];
  server = createServer(async (req, res) => {
    if (req.url?.endsWith('/health')) {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ capabilities: { discussion: { version: 1 } } }));
      return;
    }
    let data = '';
    for await (const chunk of req) data += chunk;
    writes++;
    bodies.push(JSON.parse(data));
    if (writes === 1) {
      req.socket.destroy();
      return;
    }
    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ postId: 'post1' }));
  });
  await new Promise<void>(done => server!.listen(0, '127.0.0.1', done));
  const address = server.address();
  if (!address || typeof address === 'string') throw Error();
  await writeFile(
    join(config, 'test.json'),
    JSON.stringify({ apiUrl: `http://127.0.0.1:${address.port}/api/v2` })
  );
  let r = await cli(
    [
      'posts',
      'create',
      'event',
      '--title',
      'A',
      '--stdin',
      '--content-format',
      'markdown',
    ],
    '**Hello**'
  );
  expect(r.code).toBe(5);
  expect(r.stdout).toBe('');
  expect(r.stderr).toContain('UNCERTAIN_OUTCOME');
  expect(r.stderr).toContain('posts list event');
  expect(writes).toBe(1);
  expect(bodies[0]).toMatchObject({
    content: '<p><strong>Hello</strong></p>\n',
  });
  const file = join(config, 'content.html');
  await writeFile(file, '<p><strong>Keep</strong></p>');
  r = await cli([
    'posts',
    'create',
    'event',
    '--title',
    'B',
    '--file',
    file,
    '--content-format',
    'html',
  ]);
  expect(r.code, r.stderr).toBe(0);
  expect(bodies[1]).toMatchObject({ content: '<p><strong>Keep</strong></p>' });
});

test('split UTF-8 stdin chunks preserve Unicode content', async () => {
  const result = await new Promise<string>(done => {
    const child = spawn(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        "import {readContent} from './src/content-input.js'; console.log(await readContent({stdin:true},false));",
      ],
      { stdio: 'pipe' }
    );
    let out = '';
    child.stdout.on('data', chunk => (out += chunk));
    child.on('close', () => done(out));
    const bytes = Buffer.from('😀');
    child.stdin.write(bytes.subarray(0, 2));
    setTimeout(() => child.stdin.end(bytes.subarray(2)), 80);
  });
  expect(result.trim()).toBe('<p>😀</p>');
});

test.each([
  [401, 'AUTH_REQUIRED', 3],
  [403, 'FORBIDDEN', 3],
  [404, 'NOT_FOUND', 4],
  [429, 'RATE_LIMITED', 5],
  [500, 'UNCERTAIN_OUTCOME', 5],
  [302, 'UNCERTAIN_OUTCOME', 5],
])(
  'upload HTTP %s preserves error contract',
  async (status, code, exitCode) => {
    const file = join(config, 'file.txt');
    await writeFile(file, 'x');
    vi.stubGlobal(
      'fetch',
      async () => new Response(null, { status: Number(status) })
    );
    await expect(
      uploadFile(
        { name: 'test', apiUrl: 'https://selected.invalid/api/v2' },
        'secret',
        file
      )
    ).rejects.toMatchObject({ code, exitCode });
  }
);
