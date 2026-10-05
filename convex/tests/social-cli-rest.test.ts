// @vitest-environment node
import { expect, it } from 'vitest';
import { api, components } from '../_generated/api';
import { createAuthAccount, registerBetterAuth } from './auth.helpers';
import { createTestInstance } from './test_helpers';

async function setup() {
  const t = createTestInstance();
  registerBetterAuth(t);
  return actor(t, 'event-organizer');
}
async function actor(t: ReturnType<typeof createTestInstance>, name: string) {
  const account = await createAuthAccount(t, name);
  const rawKey = `grp_event_writes_test_key_${name}`;
  const hash = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(rawKey)
  );
  const key = await t.mutation(components.betterAuth.adapter.create, {
    input: {
      model: 'apikey',
      data: {
        userId: account.user._id,
        key: btoa(String.fromCharCode(...new Uint8Array(hash)))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, ''),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        enabled: true,
      },
    },
  });
  const request = (
    path: string,
    method: string,
    body?: unknown,
    requestId?: string
  ) =>
    t.fetch(`/api/v2${path}`, {
      method,
      headers: {
        'x-api-key': rawKey,
        'content-type': 'application/json',
        ...(requestId ? { 'Idempotency-Key': requestId } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  return { t, ...account, request, rawKey, keyId: key._id };
}

import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
// Allow serial CLI process startup and real authenticated HTTP work.
it('public executable stores friendships, sends notifications, and blocks the other identity', async () => {
  const a = await setup();
  const b = await actor(a.t, 'cli-social-recipient');
  const server = createServer(async (req, res) => {
    try {
      let content = '';
      for await (const chunk of req) content += chunk;
      const response = await a.t.fetch(req.url ?? '/', {
        method: req.method,
        headers: {
          'x-api-key': String(req.headers['x-api-key']),
          'content-type': 'application/json',
        },
        ...(content ? { body: content } : {}),
      });
      res.statusCode = response.status;
      res.setHeader('content-type', 'application/json');
      res.end(await response.text());
    } catch (error) {
      res.statusCode = 500;
      res.end(String(error));
    }
  });
  const config = await mkdtemp(join(tmpdir(), 'social-real-cli-'));
  await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
  const address = server.address();
  if (!address || typeof address === 'string') throw Error('No port');
  await writeFile(
    join(config, 'test.json'),
    JSON.stringify({ apiUrl: `http://127.0.0.1:${address.port}/api/v2` })
  );
  function cli(key: string, args: string[]) {
    return new Promise<{ code: number | null; stdout: string; stderr: string }>(
      (done, reject) => {
        const child = spawn(
          process.execPath,
          [
            resolve('../packages/cli/bin/groupi.js'),
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
              GROUPI_API_KEY: key,
              GROUPI_API_KEY_PROFILE: 'test',
            },
            stdio: 'pipe',
          }
        );
        let stdout = '',
          stderr = '';
        child.stdout.on('data', data => (stdout += data));
        child.stderr.on('data', data => (stderr += data));
        child.once('error', reject);
        child.once('close', code => done({ code, stdout, stderr }));
        child.stdin.end();
      }
    );
  }
  try {
    const sent = await cli(a.rawKey, ['friends', 'request', b.personId]);
    expect(sent.code, sent.stderr).toBe(0);
    const friendshipId = JSON.parse(sent.stdout).friendshipId;
    const received = await cli(b.rawKey, ['friends', 'incoming', '--all']);
    expect(received.code, received.stderr).toBe(0);
    expect(JSON.parse(received.stdout).items[0].friendshipId).toBe(
      friendshipId
    );
    const accepted = await cli(b.rawKey, ['friends', 'accept', friendshipId]);
    expect(accepted.code, accepted.stderr).toBe(0);
    const friends = await a.auth.query(api.friends.queries.getFriends, {});
    expect(friends[0]?.personId).toBe(b.personId);
    const notifications = await a.auth.query(
      api.notifications.queries.fetchNotificationsForPerson,
      {}
    );
    expect(
      notifications.notifications.some(
        n => n.type === 'FRIEND_REQUEST_ACCEPTED'
      )
    ).toBe(true);
    const blocked = await cli(a.rawKey, [
      'blocks',
      'block',
      b.personId,
      '--yes',
    ]);
    expect(blocked.code, blocked.stderr).toBe(0);
    expect(await a.auth.query(api.friends.queries.getFriends, {})).toEqual([]);
    expect(
      await b.auth.query(api.friends.queries.getBlockStatus, {
        targetPersonId: a.personId,
      })
    ).toEqual({ blockedByMe: false, blockedByThem: true });
  } finally {
    await new Promise<void>(done => server.close(() => done()));
    await rm(config, { recursive: true, force: true });
  }
}, 30_000);
