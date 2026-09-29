import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { connect } from 'node:net';
import { createHash } from 'node:crypto';
import { createServer, get, type Server } from 'node:http';
import { mkdtemp, writeFile, rm, readdir, readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { afterEach, expect, test } from 'vitest';

const children: ChildProcessWithoutNullStreams[] = [];
const servers: Server[] = [];
const directories: string[] = [];
afterEach(async () => {
  for (const child of children.splice(0))
    if (child.exitCode === null) child.kill();
  for (const server of servers.splice(0)) {
    server.closeAllConnections();
    await new Promise<void>(done => server.close(() => done()));
  }
  for (const directory of directories.splice(0))
    await rm(directory, { recursive: true, force: true });
});

async function login(
  options: {
    storeFailure?: boolean;
    exchangeStatus?: number;
    exchangeDelay?: number;
    timeout?: number;
  } = {}
) {
  let exchangeBegan: () => void;
  const exchangeStarted = new Promise<void>(resolve => {
    exchangeBegan = resolve;
  });
  const requests: {
    path: string;
    body: Record<string, unknown>;
    key?: string | string[];
  }[] = [];
  const server = createServer(async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;
    requests.push({
      path: req.url!,
      body: body ? JSON.parse(body) : {},
      key: req.headers['x-api-key'],
    });
    res.setHeader('content-type', 'application/json');
    if (req.url?.endsWith('/exchange')) {
      exchangeBegan();
      if (options.exchangeDelay)
        await new Promise(done => setTimeout(done, options.exchangeDelay));
      res.statusCode = options.exchangeStatus ?? 200;
      res.end(
        JSON.stringify({
          apiKey: 'fresh-secret',
          expiresAt: Date.now() + 86400000,
          account: {
            id: 'person-1',
            name: 'Test Account',
            email: 'person@example.com',
          },
        })
      );
    } else res.end('{}');
  });
  servers.push(server);
  await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
  const address = server.address();
  if (!address || typeof address === 'string') throw Error('No port');
  const config = await mkdtemp(join(tmpdir(), 'groupi-login-test-'));
  directories.push(config);
  const origin = `http://127.0.0.1:${address.port}`;
  await writeFile(
    join(config, 'test.json'),
    JSON.stringify({ apiUrl: origin + '/api/v2', webUrl: origin })
  );
  const child = spawn(
    process.execPath,
    [
      '--import',
      pathToFileURL(resolve('tests/fixtures/login-environment.mjs')).href,
      process.env.CLI_TEST_BIN ?? resolve('bin/groupi.js'),
      '--profile',
      'test',
      'auth',
      'login',
      '--no-browser',
      '--timeout',
      String(options.timeout ?? 300),
    ],
    {
      env: {
        ...process.env,
        GROUPI_CONFIG_DIR: config,
        GROUPI_API_KEY: '',
        GROUPI_API_KEY_PROFILE: '',
        TEST_STORE_FAILURE: options.storeFailure ? '1' : '',
      },
      stdio: 'pipe',
    }
  );
  children.push(child);
  let stdout = '',
    stderr = '';
  const completion = new Promise<{
    code: number | null;
    stdout: string;
    stderr: string;
  }>(done => {
    child.on('close', code => done({ code, stdout, stderr }));
  });
  child.stdout.on('data', data => {
    stdout += data;
  });
  const ready = new Promise<URL>((done, reject) => {
    child.stderr.on('data', data => {
      stderr += data;
      const match = stderr.match(/http:\/\/127\.0\.0\.1:\d+\/cli-auth\?[^\s]+/);
      if (match) done(new URL(match[0]));
    });
    child.on('close', () =>
      reject(Error('Login ended before authorization: ' + stderr))
    );
    child.on('error', reject);
  });
  const authorization = await ready;
  const callback = new URL(
    `http://127.0.0.1:${authorization.searchParams.get('callbackPort')}/callback`
  );
  callback.searchParams.set('state', authorization.searchParams.get('state')!);
  callback.searchParams.set('code', 'C'.repeat(43));
  return {
    authorization,
    callback,
    completion,
    requests,
    config,
    exchangeStarted,
  };
}

test('session-bound login acknowledges only after exchange and secure persistence', async () => {
  const flow = await login();
  const wrong = new URL(flow.callback);
  wrong.searchParams.set('state', 'x'.repeat(43));
  expect((await fetch(wrong)).status).toBe(400);
  expect(flow.requests).toHaveLength(0);
  const result = await fetch(flow.callback);
  expect(result.status).toBe(200);
  expect(await result.text()).toContain('Connected');
  const outcome = await flow.completion;
  expect(outcome.code).toBe(0);
  expect(outcome.stdout).toContain('Test Account');
  expect(outcome.stdout + outcome.stderr).not.toContain('fresh-secret');
  const exchange = flow.requests[0];
  expect(exchange.path).toBe('/api/v2/auth/cli/exchange');
  expect(
    createHash('sha256')
      .update(exchange.body.verifier as string)
      .digest('base64url')
  ).toBe(flow.authorization.searchParams.get('challenge'));
  expect(exchange.body.callbackPort).toBe(Number(flow.callback.port));
  const files = await readdir(flow.config);
  expect(files).toEqual(['test.json']);
  expect(await readFile(join(flow.config, 'test.json'), 'utf8')).not.toContain(
    'fresh-secret'
  );
}, 10000);

test('ambiguous cancellation parameters do not cancel the initiating session', async () => {
  const flow = await login();
  const malformed = new URL(flow.callback);
  malformed.searchParams.delete('code');
  malformed.searchParams.append('error', 'access_denied');
  malformed.searchParams.append('error', 'other');
  expect((await fetch(malformed)).status).toBe(400);
  const conflicting = new URL(flow.callback);
  conflicting.searchParams.set('error', 'access_denied');
  expect((await fetch(conflicting)).status).toBe(400);
  expect((await fetch(flow.callback)).status).toBe(200);
  expect((await flow.completion).code).toBe(0);
}, 10000);

test('failed secure storage revokes the newly issued key and never acknowledges success', async () => {
  const flow = await login({ storeFailure: true });
  const response = await fetch(flow.callback);
  expect(response.status).toBe(500);
  expect(await response.text()).not.toContain('Connected');
  const outcome = await flow.completion;
  expect(outcome.code).toBe(3);
  expect(outcome.stderr).toContain('CREDENTIAL_STORE_UNAVAILABLE');
  expect(outcome.stderr + outcome.stdout).not.toContain('fresh-secret');
  expect(flow.requests.map(request => request.path)).toEqual([
    '/api/v2/auth/cli/exchange',
    '/api/v2/auth/cli/revoke',
  ]);
  expect(flow.requests[1].key).toBe('fresh-secret');
}, 10000);

test('browser cancellation closes the listener without exchanging a credential', async () => {
  const flow = await login();
  flow.callback.searchParams.delete('code');
  flow.callback.searchParams.set('error', 'access_denied');
  expect((await fetch(flow.callback)).status).toBe(200);
  const outcome = await flow.completion;
  expect(outcome.code).toBe(3);
  expect(outcome.stderr).toContain('AUTH_CANCELLED');
  expect(flow.requests).toHaveLength(0);
  await expect(fetch(flow.callback)).rejects.toThrow();
}, 10000);

test('a rejected authorization code is not retried or reported as connected', async () => {
  const flow = await login({ exchangeStatus: 401 });
  expect((await fetch(flow.callback)).status).toBe(500);
  const outcome = await flow.completion;
  expect(outcome.code).toBe(3);
  expect(outcome.stderr).toContain('AUTH_REJECTED');
  expect(flow.requests).toHaveLength(1);
  expect(outcome.stdout).toBe('');
}, 10000);

test('cancellation closes incomplete callback connections and lets the executable exit', async () => {
  const flow = await login();
  const socket = connect(Number(flow.callback.port), '127.0.0.1');
  try {
    await new Promise<void>(done => socket.once('connect', done));
    socket.write('GET /callback HTTP/1.1\r\n');
    flow.callback.searchParams.delete('code');
    flow.callback.searchParams.set('error', 'access_denied');
    expect((await fetch(flow.callback)).status).toBe(200);
    const outcome = await Promise.race([
      flow.completion,
      new Promise<string>(done =>
        setTimeout(() => done('still-running'), 1000)
      ),
    ]);
    expect(outcome).not.toBe('still-running');
    expect(typeof outcome === 'object' && outcome.code).toBe(3);
  } finally {
    socket.destroy();
  }
}, 10000);

test('a disconnected browser triggers cleanup instead of leaving login pending', async () => {
  const flow = await login({ exchangeDelay: 200 });
  const request = get(flow.callback);
  request.on('error', () => {});
  await flow.exchangeStarted;
  request.destroy();
  const outcome = await Promise.race([
    flow.completion,
    new Promise<string>(done => setTimeout(() => done('still-running'), 1500)),
  ]);
  expect(outcome).not.toBe('still-running');
  expect(typeof outcome === 'object' && outcome.code).toBe(3);
  expect(flow.requests.map(request => request.path)).toEqual([
    '/api/v2/auth/cli/exchange',
    '/api/v2/auth/cli/revoke',
  ]);
}, 10000);

test('login timeout closes the callback listener and incomplete requests', async () => {
  const flow = await login({ timeout: 10 });
  const socket = connect(Number(flow.callback.port), '127.0.0.1');
  try {
    await new Promise<void>(done => socket.once('connect', done));
    socket.write('GET /callback HTTP/1.1\r\n');
    const outcome = await flow.completion;
    expect(outcome.code).toBe(3);
    expect(outcome.stderr).toContain('AUTH_TIMEOUT');
    expect(flow.requests).toHaveLength(0);
    await expect(fetch(flow.callback)).rejects.toThrow();
  } finally {
    socket.destroy();
  }
}, 15000);
