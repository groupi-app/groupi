import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { components } from '../_generated/api';
import type { Id, TableNames } from '../_generated/dataModel';
import { createAuthAccount, registerBetterAuth } from './auth.helpers';
import { createTestInstance, TestScenarios } from './test_helpers';

export async function cliRestBridge() {
  const t = createTestInstance();
  registerBetterAuth(t);
  // convex-test IDs contain semicolons; real deployment IDs use the public
  // URL-safe alphabet. Translate only that fixture encoding at the wire edge.
  const wireIds = new Map<string, string>();
  const fixtureIds = new Map<string, string>();
  function wireId(value: string) {
    if (value.startsWith('custom:')) return `custom:${wireId(value.slice(7))}`;
    if (!/^\d+;[A-Za-z_][A-Za-z0-9_]*$/.test(value)) return value;
    let wire = wireIds.get(value);
    if (!wire) {
      wire = `fixture_${wireIds.size}`;
      wireIds.set(value, wire);
      fixtureIds.set(wire, value);
    }
    return wire;
  }
  function translate(value: unknown, direction: 'wire' | 'fixture'): unknown {
    if (typeof value === 'string')
      return direction === 'wire'
        ? wireId(value)
        : value.startsWith('custom:')
          ? `custom:${fixtureIds.get(value.slice(7)) ?? value.slice(7)}`
          : (fixtureIds.get(value) ?? value);
    if (Array.isArray(value))
      return value.map(item => translate(item, direction));
    if (value && typeof value === 'object')
      return Object.fromEntries(
        Object.entries(value).map(([name, item]) => [
          name,
          translate(item, direction),
        ])
      );
    return value;
  }
  const config = await mkdtemp(join(tmpdir(), 'groupi-cli-rest-'));
  const server = createServer(async (req, res) => {
    try {
      let body = '';
      for await (const chunk of req) body += chunk;
      const headers = new Headers();
      for (const [name, value] of Object.entries(req.headers)) {
        if (value !== undefined)
          headers.set(name, Array.isArray(value) ? value.join(',') : value);
      }
      const url = new URL(req.url ?? '/', 'http://localhost');
      url.pathname = url.pathname
        .split('/')
        .map(segment =>
          encodeURIComponent(
            String(translate(decodeURIComponent(segment), 'fixture'))
          )
        )
        .join('/');
      const cursor = url.searchParams.get('cursor');
      if (cursor && fixtureIds.has(cursor))
        url.searchParams.set('cursor', fixtureIds.get(cursor)!);
      const response = await t.fetch(url.pathname + url.search, {
        method: req.method,
        headers,
        ...(body
          ? { body: JSON.stringify(translate(JSON.parse(body), 'fixture')) }
          : {}),
      });
      res.writeHead(response.status, Object.fromEntries(response.headers));
      const text = await response.text();
      res.end(text ? JSON.stringify(translate(JSON.parse(text), 'wire')) : '');
    } catch (error) {
      res.writeHead(500, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: String(error) }));
    }
  });
  try {
    await new Promise<void>((done, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', done);
    });
    const address = server.address();
    if (!address || typeof address === 'string') throw Error('Missing port');
    await writeFile(
      join(config, 'test.json'),
      JSON.stringify({ apiUrl: `http://127.0.0.1:${address.port}/api/v2` })
    );
  } catch (error) {
    server.closeAllConnections();
    server.close();
    await rm(config, { recursive: true, force: true });
    throw error;
  }
  async function actor(name: string) {
    const scenario = await TestScenarios.simpleUser(t);
    const account = await createAuthAccount(t, name, scenario.personId);
    const rawKey = `grp_cli_workflows_${name}`;
    const hash = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(rawKey)
    );
    await t.mutation(components.betterAuth.adapter.create, {
      input: {
        model: 'apikey',
        data: {
          userId: account.user._id,
          key: Buffer.from(hash).toString('base64url'),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          enabled: true,
        },
      },
    });
    return {
      ...account,
      rawKey,
      request: (path: string, method = 'GET', body?: unknown) =>
        t.fetch(`/api/v2${path}`, {
          method,
          headers: { 'x-api-key': rawKey, 'content-type': 'application/json' },
          ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        }),
    };
  }
  function cli(rawKey: string, args: string[], format = 'json') {
    return new Promise<{ code: number | null; stdout: string; stderr: string }>(
      (done, reject) => {
        const bin =
          process.env.CLI_TEST_BIN ??
          resolve(
            dirname(fileURLToPath(import.meta.url)),
            '../../packages/cli/bin/groupi.js'
          );
        const child = spawn(
          process.execPath,
          [bin, '--profile', 'test', '--format', format, ...args],
          {
            env: {
              ...process.env,
              GROUPI_CONFIG_DIR: config,
              GROUPI_API_KEY: rawKey,
              GROUPI_API_KEY_PROFILE: 'test',
            },
            stdio: ['ignore', 'pipe', 'pipe'],
          }
        );
        let stdout = '',
          stderr = '';
        const timer = setTimeout(() => {
          child.kill();
          reject(Error(`CLI timed out: ${args.join(' ')}`));
        }, 15_000);
        child.stdout.on('data', data => {
          stdout += data;
        });
        child.stderr.on('data', data => {
          stderr += data;
        });
        child.once('error', error => {
          clearTimeout(timer);
          reject(error);
        });
        child.once('close', code => {
          clearTimeout(timer);
          done({ code, stdout, stderr });
        });
      }
    );
  }
  async function close() {
    server.closeAllConnections();
    await new Promise<void>((done, reject) =>
      server.close(error => (error ? reject(error) : done()))
    );
    await rm(config, { recursive: true, force: true });
  }
  const id = <Table extends TableNames>(value: string) =>
    (fixtureIds.get(value) ?? value) as Id<Table>;
  return { t, actor, cli, close, id, wireId };
}
