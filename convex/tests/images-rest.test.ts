// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { imageFixtures } from './image-fixtures';
import { components, api } from '../_generated/api';
import { createAuthAccount, registerBetterAuth } from './auth.helpers';
import { createTestInstance } from './test_helpers';
import type { Id } from '../_generated/dataModel';
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==',
  'base64'
);
beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());
async function setup() {
  const t = createTestInstance();
  registerBetterAuth(t);
  async function actor(name: string) {
    const account = await createAuthAccount(t, name);
    const rawKey = `grp_images_test_${name}`;
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
          enabled: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
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
      upload: (
        purpose = 'cover',
        mime = 'image/png',
        bytes: Uint8Array = png
      ) =>
        t.fetch(`/api/v2/uploads?purpose=${purpose}`, {
          method: 'POST',
          headers: {
            'x-api-key': rawKey,
            'content-type': mime,
            'X-Filename': 'test.png',
          },
          body: bytes as BodyInit,
        }),
    };
  }
  const owner = await actor('owner');
  const other = await actor('other');
  const eventId = await t.run(async ctx => {
    const id = await ctx.db.insert('events', {
      title: 'Images',
      timezone: 'UTC',
      potentialDateTimes: [],
      creatorId: owner.personId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    await ctx.db.insert('memberships', {
      eventId: id,
      personId: owner.personId,
      role: 'ORGANIZER',
      rsvpStatus: 'YES',
    });
    return id;
  });
  return { t, owner, other, eventId };
}
async function data(response: Response, status = 200) {
  expect(response.status, await response.clone().text()).toBe(status);
  return response.json();
}
it('replaces covers atomically, preserves focal points on unrelated edits, deletes old files, and removes the image', async () => {
  const { t, owner, eventId } = await setup();
  const first = await data(await owner.upload(), 201);
  const image = await data(
    await owner.request(`/events/${eventId}/cover`, 'PUT', {
      storageId: first.storageId,
      focalPoint: { x: 0.25, y: 0.75 },
    })
  );
  expect(image.imageUrl).toBeTruthy();
  expect(await data(await owner.request(`/events/${eventId}/cover`))).toEqual(
    image
  );
  expect(await data(await owner.request(`/events/${eventId}`))).toMatchObject({
    imageUrl: image.imageUrl,
  });
  await owner.auth.mutation(api.events.mutations.updateEvent, {
    eventId,
    title: 'Retitled',
  });
  expect(
    (await data(await owner.request(`/events/${eventId}/cover`))).focalPoint
  ).toEqual({ x: 0.25, y: 0.75 });
  const second = await data(await owner.upload(), 201);
  await data(
    await owner.request(`/events/${eventId}/cover`, 'PUT', {
      storageId: second.storageId,
    })
  );
  expect(await t.run(ctx => ctx.db.system.get(first.storageId))).toBeNull();
  // Repeating a cover request cannot delete the active object.
  await data(
    await owner.request(`/events/${eventId}/cover`, 'PUT', {
      storageId: second.storageId,
    })
  );
  expect(
    await t.run(ctx => ctx.db.system.get(second.storageId))
  ).not.toBeNull();
  await data(await owner.request(`/events/${eventId}/cover`, 'DELETE'));
  expect(await t.run(ctx => ctx.db.system.get(second.storageId))).toBeNull();
  expect(
    await data(await owner.request(`/events/${eventId}/cover`))
  ).toMatchObject({ storageId: null, imageUrl: null, focalPoint: null });
});
it('rejects foreign uploads and cross-event cover management without deleting someone else’s upload', async () => {
  const { t, owner, other, eventId } = await setup();
  const foreign = await data(await other.upload(), 201);
  await data(
    await owner.request(`/events/${eventId}/cover`, 'PUT', {
      storageId: foreign.storageId,
    }),
    403
  );
  expect(
    await t.run(ctx => ctx.db.system.get(foreign.storageId))
  ).not.toBeNull();
  await data(
    await other.request(`/events/${eventId}/cover`, 'PUT', {
      storageId: foreign.storageId,
    }),
    403
  );
  expect(await t.run(ctx => ctx.db.system.get(foreign.storageId))).toBeNull();
  expect(
    (await data(await owner.request(`/events/${eventId}/cover`))).imageUrl
  ).toBeNull();
  const owned = await data(await owner.upload(), 201);
  await expect(
    other.auth.mutation(api.events.mutations.createEvent, {
      title: 'Claim чужой upload',
      imageStorageId: owned.storageId,
    })
  ).rejects.toThrow();
  expect(await t.run(ctx => ctx.db.system.get(owned.storageId))).not.toBeNull();
});
it('enforces image formats, rejects forged metadata and wrong-purpose claims, and preserves the current avatar', async () => {
  const { t, owner, other } = await setup();
  for (const [mime, bytes] of [
    ['text/plain', png],
    ['image/png', Buffer.from('not an image')],
    ['image/svg+xml', Buffer.from('<svg><script>alert(1)</script></svg>')],
  ] as const)
    await data(await owner.upload('avatar', mime, bytes), 400);
  await data(
    await owner.upload(
      'avatar',
      'image/png',
      new Uint8Array(10 * 1024 * 1024 + 1)
    ),
    400
  );
  const first = await data(await owner.upload('avatar'), 201);
  const image = await data(
    await owner.request('/profile/avatar', 'PUT', {
      storageId: first.storageId,
    })
  );
  expect((await data(await owner.request('/profile'))).image).toBe(
    image.imageUrl
  );
  expect(
    (await data(await other.request('/profile/avatar'))).imageUrl
  ).not.toBe(image.imageUrl);
  const wrong = await data(await owner.upload('cover'), 201);
  await data(
    await owner.request('/profile/avatar', 'PUT', {
      storageId: wrong.storageId,
    }),
    403
  );
  expect(await t.run(ctx => ctx.db.system.get(wrong.storageId))).toBeNull();
  expect((await data(await owner.request('/profile/avatar'))).storageId).toBe(
    first.storageId
  );
  const foreign = await data(await other.upload('avatar'), 201);
  await data(
    await owner.request('/profile/avatar', 'PUT', {
      storageId: foreign.storageId,
    }),
    403
  );
  expect(
    await t.run(ctx => ctx.db.system.get(foreign.storageId))
  ).not.toBeNull();
  const second = await data(await owner.upload('avatar'), 201);
  await data(
    await owner.request('/profile/avatar', 'PUT', {
      storageId: second.storageId,
    })
  );
  expect(await t.run(ctx => ctx.db.system.get(first.storageId))).toBeNull();
  await data(
    await owner.request('/profile/avatar', 'PUT', {
      storageId: second.storageId,
    }),
    403
  );
  expect(
    await t.run(ctx => ctx.db.system.get(second.storageId))
  ).not.toBeNull();
  await data(await owner.request('/profile/avatar', 'DELETE'));
  expect(await t.run(ctx => ctx.db.system.get(second.storageId))).toBeNull();
  expect((await data(await owner.request('/profile'))).image).toBeNull();
});
it('allows moderators to update covers but denies attendees and cannot link legacy or unregistered storage', async () => {
  const { t, owner, other, eventId } = await setup();
  const membership = await t.run(ctx =>
    ctx.db.insert('memberships', {
      eventId,
      personId: other.personId,
      role: 'ATTENDEE',
      rsvpStatus: 'YES',
    })
  );
  const denied = await data(await other.upload(), 201);
  await data(
    await other.request(`/events/${eventId}/cover`, 'PUT', {
      storageId: denied.storageId,
    }),
    403
  );
  const orphan = (await t.run(ctx =>
    ctx.storage.store(new Blob([png], { type: 'image/png' }))
  )) as Id<'_storage'>;
  await data(
    await owner.request(`/events/${eventId}/cover`, 'PUT', {
      storageId: orphan,
    }),
    403
  );
  await t.run(ctx => ctx.db.patch(membership, { role: 'MODERATOR' }));
  const allowed = await data(await other.upload(), 201);
  await data(
    await other.request(`/events/${eventId}/cover`, 'PUT', {
      storageId: allowed.storageId,
    })
  );
  expect(
    (await data(await owner.request(`/events/${eventId}/cover`))).storageId
  ).toBe(allowed.storageId);
});

it('uses the same avatar ownership checks in app mutations and rejects malformed IDs without changing images', async () => {
  const { owner, other, t } = await setup();
  const upload = await data(await owner.upload('avatar'), 201);
  await owner.auth.mutation(api.users.mutations.updateUserProfile, {
    imageStorageId: upload.storageId,
  });
  expect((await data(await owner.request('/profile/avatar'))).storageId).toBe(
    upload.storageId
  );
  const foreign = await data(await other.upload('avatar'), 201);
  await expect(
    owner.auth.mutation(api.users.mutations.updateUserProfile, {
      imageStorageId: foreign.storageId,
    })
  ).rejects.toThrow();
  await data(
    await owner.request('/profile/avatar', 'PUT', { storageId: 'invalid-id' }),
    400
  );
  expect((await data(await owner.request('/profile/avatar'))).storageId).toBe(
    upload.storageId
  );
  expect(
    await t.run(ctx => ctx.db.system.get(foreign.storageId))
  ).not.toBeNull();
  await owner.auth.mutation(api.users.mutations.updateUserProfile, {
    clearImage: true,
  });
  expect((await data(await owner.request('/profile'))).image).toBeNull();
  expect(await t.run(ctx => ctx.db.system.get(upload.storageId))).toBeNull();
});

it('accepts real supported image formats and rejects a RIFF container without an image frame while preserving the current avatar', async () => {
  const { owner, t } = await setup();
  let current;
  for (const fixture of imageFixtures) {
    const upload = await data(
      await owner.upload(
        'avatar',
        fixture.mime,
        Buffer.from(fixture.base64, 'base64')
      ),
      201
    );
    current = await data(
      await owner.request('/profile/avatar', 'PUT', {
        storageId: upload.storageId,
      })
    );
  }
  const malformed = Buffer.alloc(20);
  malformed.write('RIFF', 0);
  malformed.writeUInt32LE(12, 4);
  malformed.write('WEBPFAKE', 8);
  await data(await owner.upload('avatar', 'image/webp', malformed), 400);
  expect(await data(await owner.request('/profile/avatar'))).toEqual(current);
  const orphaned = await t.run(ctx => ctx.db.query('uploads').collect());
  expect(orphaned.filter(row => !row.claimed)).toHaveLength(0);
  const svg = await data(
    await owner.upload(
      'cover',
      'image/svg+xml',
      Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><path d="M0 0h1v1z"/></svg>'
      )
    ),
    201
  );
  expect(svg.mimeType).toBe('image/svg+xml');
});
