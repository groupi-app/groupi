// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { api, internal } from '../_generated/api';
import type { Id } from '../_generated/dataModel';
import { createAuthAccount, registerBetterAuth } from './auth.helpers';
import { createTestInstance } from './test_helpers';
import { imageFixtures } from './image_fixtures';

const png = Buffer.from(imageFixtures[1].base64, 'base64');
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubEnv('CONVEX_SITE_URL', 'https://app-upload.test');
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

async function setup() {
  const t = createTestInstance();
  registerBetterAuth(t);
  const owner = await createAuthAccount(t, 'app-image-owner');
  const other = await createAuthAccount(t, 'app-image-other');
  async function ticket(purpose: 'avatar' | 'cover') {
    const url = new URL(
      await owner.auth.mutation(api.files.mutations.generateUploadUrl, {
        purpose,
      })
    );
    expect(url.origin).toBe('https://app-upload.test');
    expect(url.pathname).toBe('/api/uploads/app');
    return url.pathname + url.search;
  }
  async function post(path: string, bytes = png, mime = 'image/png') {
    return t.fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': mime, Origin: 'https://web.test' },
      body: bytes,
    });
  }
  async function upload(purpose: 'avatar' | 'cover') {
    const response = await post(await ticket(purpose));
    expect(response.status, await response.clone().text()).toBe(200);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    return (await response.json()).storageId as Id<'_storage'>;
  }
  const avatar = () =>
    t.query(internal.files.images.get, {
      personId: owner.personId,
      userId: owner.user._id,
    });
  return { t, owner, other, ticket, post, upload, avatar };
}

it('uploads avatar and cover through registered HTTP tickets and claims them through app mutations', async () => {
  const { t, owner, upload, avatar } = await setup();
  await expect(
    t.mutation(api.files.mutations.generateUploadUrl, { purpose: 'avatar' })
  ).rejects.toThrow();
  const avatarId = await upload('avatar');
  const coverId = await upload('cover');
  const rows = await t.run(ctx => ctx.db.query('uploads').collect());
  for (const [storageId, purpose] of [
    [avatarId, 'avatar'],
    [coverId, 'cover'],
  ] as const) {
    expect(rows.find(row => row.storageId === storageId)).toMatchObject({
      personId: owner.personId,
      purpose,
      mimeType: 'image/png',
      size: png.length,
      claimed: false,
    });
    expect(await t.run(ctx => ctx.db.system.get(storageId))).toMatchObject({
      size: png.length,
    });
    expect(
      await t.run(async ctx => (await ctx.storage.get(storageId))?.type)
    ).toBe('image/png');
  }
  await owner.auth.mutation(api.users.mutations.updateUserProfile, {
    imageStorageId: avatarId,
  });
  const { eventId } = await owner.auth.mutation(
    api.events.mutations.createEvent,
    {
      title: 'App uploaded cover',
      imageStorageId: coverId,
      imageFocalPoint: { x: 0.25, y: 0.75 },
    }
  );
  expect(await avatar()).toMatchObject({ storageId: avatarId });
  expect(await t.run(ctx => ctx.db.get(eventId))).toMatchObject({
    imageStorageId: coverId,
    imageFocalPoint: { x: 0.25, y: 0.75 },
  });
  expect(
    (await t.run(ctx => ctx.db.query('uploads').collect())).every(
      row => row.claimed
    )
  ).toBe(true);
});

it('rejects foreign, wrong-purpose and forged metadata claims without changing the active avatar', async () => {
  const { t, owner, other, upload, avatar } = await setup();
  const active = await upload('avatar');
  await owner.auth.mutation(api.users.mutations.updateUserProfile, {
    imageStorageId: active,
  });
  const pending = await upload('avatar');
  await expect(
    other.auth.mutation(api.users.mutations.updateUserProfile, {
      imageStorageId: pending,
    })
  ).rejects.toThrow();
  const cover = await upload('cover');
  await expect(
    owner.auth.mutation(api.users.mutations.updateUserProfile, {
      imageStorageId: cover,
    })
  ).rejects.toThrow();
  await expect(
    owner.auth.mutation(api.events.mutations.createEvent, {
      title: 'Wrong purpose',
      imageStorageId: pending,
    })
  ).rejects.toThrow();
  await t.run(async ctx => {
    const row = await ctx.db
      .query('uploads')
      .withIndex('by_storage', q => q.eq('storageId', pending))
      .unique();
    await ctx.db.patch(row!._id, { size: png.length + 1 });
  });
  await expect(
    owner.auth.mutation(api.users.mutations.updateUserProfile, {
      imageStorageId: pending,
    })
  ).rejects.toThrow();
  expect(await avatar()).toMatchObject({ storageId: active });
  for (const id of [active, pending, cover])
    expect(await t.run(ctx => ctx.db.system.get(id))).not.toBeNull();
  expect(
    (await t.run(ctx => ctx.db.query('uploads').collect()))
      .filter(row => row.storageId !== active)
      .every(row => !row.claimed)
  ).toBe(true);
});

it('rejects fabricated WebP on the HTTP route and consumes the failed ticket while preserving the avatar', async () => {
  const { t, owner, upload, ticket, post, avatar } = await setup();
  const active = await upload('avatar');
  await owner.auth.mutation(api.users.mutations.updateUserProfile, {
    imageStorageId: active,
  });
  const before = await avatar();
  const malformed = Buffer.alloc(20);
  malformed.write('RIFF', 0);
  malformed.writeUInt32LE(12, 4);
  malformed.write('WEBPFAKE', 8);
  const path = await ticket('avatar');
  const response = await post(path, malformed, 'image/webp');
  expect(response.status).toBe(400);
  expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
  expect((await post(path)).status).toBe(400);
  expect(await avatar()).toEqual(before);
  expect(await t.run(ctx => ctx.db.query('uploads').collect())).toHaveLength(1);
  expect(
    await t.run(ctx => ctx.db.system.query('_storage').collect())
  ).toHaveLength(1);
});

it('enforces single-use and expiry and exposes the browser preflight contract', async () => {
  const { t, ticket, post } = await setup();
  const path = await ticket('cover');
  expect((await post(path)).status).toBe(200);
  expect((await post(path)).status).toBe(400);
  expect((await post('/api/uploads/app?token=unknown')).status).toBe(400);
  const expired = await ticket('avatar');
  vi.setSystemTime(Date.now() + 600001);
  expect((await post(expired)).status).toBe(400);
  expect(await t.run(ctx => ctx.db.query('uploads').collect())).toHaveLength(1);
  const preflight = await t.fetch('/api/uploads/app', {
    method: 'OPTIONS',
    headers: {
      Origin: 'https://web.test',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'Content-Type',
    },
  });
  expect(preflight.status).toBe(204);
  expect(preflight.headers.get('Access-Control-Allow-Origin')).toBe('*');
  expect(preflight.headers.get('Access-Control-Allow-Methods')).toBe(
    'POST, OPTIONS'
  );
  expect(preflight.headers.get('Access-Control-Allow-Headers')).toBe(
    'Content-Type'
  );
});

it('scheduled expiry deletes unclaimed app uploads and leaves claimed avatar and cover storage intact', async () => {
  const { t, owner, upload, ticket, avatar } = await setup();
  const active = await upload('avatar');
  await owner.auth.mutation(api.users.mutations.updateUserProfile, {
    imageStorageId: active,
  });
  const cover = await upload('cover');
  const { eventId } = await owner.auth.mutation(
    api.events.mutations.createEvent,
    {
      title: 'Surviving cover',
      imageStorageId: cover,
    }
  );
  const orphan = await upload('avatar');
  await ticket('cover');
  await t.finishAllScheduledFunctions(() => vi.runAllTimers());
  expect(await t.run(ctx => ctx.db.system.get(orphan))).toBeNull();
  for (const id of [active, cover])
    expect(await t.run(ctx => ctx.db.system.get(id))).not.toBeNull();
  expect(await avatar()).toMatchObject({ storageId: active });
  expect(await t.run(ctx => ctx.db.get(eventId))).toMatchObject({
    imageStorageId: cover,
  });
  expect(
    await t.run(ctx => ctx.db.query('uploadTickets').collect())
  ).toHaveLength(0);
  const rows = await t.run(ctx => ctx.db.query('uploads').collect());
  expect(rows).toHaveLength(2);
  expect(rows.every(row => row.claimed)).toBe(true);
  const jobs = await t.run(ctx =>
    ctx.db.system.query('_scheduled_functions').collect()
  );
  const expiryJobs = jobs.filter(job =>
    job.name.startsWith('files/uploads:expire')
  );
  expect(expiryJobs).toHaveLength(7);
  expect(expiryJobs.every(job => job.state.kind === 'success')).toBe(true);
});
