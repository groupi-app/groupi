// @vitest-environment node
import { afterEach, beforeEach, expect, it } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { cliRestBridge } from './cli-rest-bridge.helpers';
let bridge: Awaited<ReturnType<typeof cliRestBridge>>;
let directory: string;
beforeEach(async () => {
  bridge = await cliRestBridge();
  directory = await mkdtemp(join(tmpdir(), 'groupi-images-'));
  await writeFile(
    join(directory, 'cover.png'),
    Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==',
      'base64'
    )
  );
});
afterEach(async () => {
  await bridge.close();
  await rm(directory, { recursive: true, force: true });
});
async function success(key: string, args: string[]) {
  const result = await bridge.cli(key, args);
  expect(result.code, result.stderr).toBe(0);
  expect(result.stderr).toBe('');
  return JSON.parse(result.stdout);
}
// This workflow launches 16 CLI processes. Windows runner startup overhead can
// exceed Vitest's five-second default; retain the bridge's 15s per-command bound.
it('public executable uploads, replaces and removes account/event images with actual storage and authenticated reads', async () => {
  const owner = await bridge.actor('images-owner');
  const other = await bridge.actor('images-other');
  const event = await success(owner.rawKey, [
    'events',
    'create',
    '--title',
    'Cover event',
  ]);
  const first = await success(owner.rawKey, [
    'events',
    'cover',
    'set',
    event.eventId,
    '--file',
    join(directory, 'cover.png'),
    '--focal-x',
    '0.2',
    '--focal-y',
    '0.8',
  ]);
  expect(first.focalPoint).toEqual({ x: 0.2, y: 0.8 });
  expect(
    await success(owner.rawKey, ['events', 'cover', 'get', event.eventId])
  ).toEqual(first);
  const second = await success(owner.rawKey, [
    'events',
    'cover',
    'set',
    event.eventId,
    '--file',
    join(directory, 'cover.png'),
  ]);
  expect(second.storageId).not.toBe(first.storageId);
  expect(
    await bridge.t.run(ctx =>
      ctx.db.system.get(bridge.id<'_storage'>(first.storageId))
    )
  ).toBeNull();
  const denied = await bridge.cli(other.rawKey, [
    'events',
    'cover',
    'set',
    event.eventId,
    '--file',
    join(directory, 'cover.png'),
  ]);
  expect(denied.code).toBe(3);
  expect(denied.stdout).toBe('');
  const abandoned = await bridge.t.run(ctx =>
    ctx.db.query('uploads').collect()
  );
  expect(abandoned.filter(row => !row.claimed)).toHaveLength(0);
  const confirm = await bridge.cli(owner.rawKey, [
    'events',
    'cover',
    'remove',
    event.eventId,
  ]);
  expect(confirm.code).toBe(2);
  expect(JSON.parse(confirm.stderr).error.code).toBe('CONFIRMATION_REQUIRED');
  expect(
    (await success(owner.rawKey, ['events', 'cover', 'get', event.eventId]))
      .storageId
  ).toBe(second.storageId);
  await success(owner.rawKey, [
    'events',
    'cover',
    'remove',
    event.eventId,
    '--yes',
  ]);
  expect(
    (await success(owner.rawKey, ['events', 'cover', 'get', event.eventId]))
      .imageUrl
  ).toBeNull();
  const avatar = await success(owner.rawKey, [
    'account',
    'avatar',
    'set',
    '--file',
    join(directory, 'cover.png'),
  ]);
  expect((await success(owner.rawKey, ['account', 'get'])).image).toBe(
    avatar.imageUrl
  );
  expect(
    (await success(other.rawKey, ['account', 'avatar', 'get'])).storageId
  ).toBeNull();
  const human = await bridge.cli(
    owner.rawKey,
    ['account', 'avatar', 'get'],
    'human'
  );
  expect(human.code, human.stderr).toBe(0);
  expect(human.stdout).toContain('avatar:');
  const missingConfirm = await bridge.cli(owner.rawKey, [
    'account',
    'avatar',
    'remove',
  ]);
  expect(missingConfirm.code).toBe(2);
  await success(owner.rawKey, ['account', 'avatar', 'remove', '--yes']);
  expect((await success(owner.rawKey, ['account', 'get'])).image).toBeNull();
}, 30000);
it('rejects invalid local image files and focal points without changing the existing cover', async () => {
  const owner = await bridge.actor('bad-images');
  const event = await success(owner.rawKey, [
    'events',
    'create',
    '--title',
    'Keep image',
  ]);
  const first = await success(owner.rawKey, [
    'events',
    'cover',
    'set',
    event.eventId,
    '--file',
    join(directory, 'cover.png'),
  ]);
  await writeFile(join(directory, 'fake.png'), 'not a PNG');
  const bad = await bridge.cli(owner.rawKey, [
    'events',
    'cover',
    'set',
    event.eventId,
    '--file',
    join(directory, 'fake.png'),
  ]);
  expect(bad.code).not.toBe(0);
  expect(bad.stdout).toBe('');
  const focal = await bridge.cli(owner.rawKey, [
    'events',
    'cover',
    'set',
    event.eventId,
    '--file',
    join(directory, 'cover.png'),
    '--focal-x',
    '2',
  ]);
  expect(focal.code).toBe(2);
  expect(
    await success(owner.rawKey, ['events', 'cover', 'get', event.eventId])
  ).toEqual(first);
}, 30_000);
