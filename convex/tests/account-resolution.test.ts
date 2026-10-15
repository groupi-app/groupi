import { describe, expect, it } from 'vitest';
import { api } from '../_generated/api';
import { createTestInstance } from './test_helpers';
import { createAuthAccount, registerBetterAuth } from './auth.helpers';

describe('Authenticated account responsibility resolution', () => {
  it('rejects unresolved current Event ownership even without an Organizer membership', async () => {
    const t = createTestInstance();
    registerBetterAuth(t);
    const owner = await createAuthAccount(t, 'responsible-owner');
    await t.run(ctx =>
      ctx.db.insert('events', {
        title: 'Still responsible',
        creatorId: owner.personId,
        potentialDateTimes: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        timezone: 'UTC',
      })
    );
    await expect(
      owner.auth.mutation(api.users.mutations.deleteUserAccount, {
        confirmation: 'responsible-owner',
      })
    ).rejects.toThrow('Resolve owned Events');
    expect(
      await owner.auth.query(api.users.queries.getCurrentUserProfile, {})
    ).not.toBeNull();
  });
});

it('enumerates every responsibility by paginated owner principal and rechecks ownership acquired after listing', async () => {
  const t = createTestInstance();
  registerBetterAuth(t);
  const owner = await createAuthAccount(t, 'paged-owner');
  const other = await createAuthAccount(t, 'paged-other');
  for (const name of ['First', 'Second', 'Third'])
    await owner.auth.mutation(api.groups.mutations.createGroup, { name });
  const event = await owner.auth.mutation(api.events.mutations.createEvent, {
    title: 'Owned Event',
    chosenDateTime: '2027-01-01T12:00:00Z',
  });
  const first = await owner.auth.query(
    api.accountResolution.queries.listOwned,
    { kind: 'GROUP', paginationOpts: { cursor: null, numItems: 2 } }
  );
  expect(first.page.map(item => item.title)).toEqual(['First', 'Second']);
  expect(first.isDone).toBe(false);
  const last = await owner.auth.query(api.accountResolution.queries.listOwned, {
    kind: 'GROUP',
    paginationOpts: { cursor: first.continueCursor, numItems: 2 },
  });
  expect(last.page.map(item => item.title)).toEqual(['Third']);
  expect(last.isDone).toBe(true);
  expect(
    (
      await other.auth.query(api.accountResolution.queries.listOwned, {
        kind: 'EVENT',
        paginationOpts: { cursor: null, numItems: 2 },
      })
    ).page
  ).toEqual([]);
  for (const item of [...first.page, ...last.page])
    await owner.auth.mutation(api.groups.mutations.deleteGroup, {
      groupId: item.id as (typeof first.page)[0]['id'],
    });
  await owner.auth.mutation(api.accountResolution.mutations.deleteOwnedEvent, {
    eventId: event.eventId,
  });
  expect(
    await owner.auth.query(api.accountResolution.queries.readiness, {})
  ).toEqual({ hasOwnedGroups: false, hasOwnedEvents: false, canDelete: true });
  await owner.auth.mutation(api.events.mutations.createEvent, {
    title: 'New responsibility',
    chosenDateTime: '2027-01-01T12:00:00Z',
  });
  await expect(
    owner.auth.mutation(api.users.mutations.deleteUserAccount, {
      confirmation: 'paged-owner',
    })
  ).rejects.toThrow('Resolve owned Events');
});

it('admin deletion applies the current creator guard and retains orphan-profile cleanup', async () => {
  const t = createTestInstance();
  registerBetterAuth(t);
  const admin = await createAuthAccount(t, 'resolution-admin');
  const owner = await createAuthAccount(t, 'resolution-target');
  const orphan = await t.run(ctx =>
    ctx.db.insert('persons', { userId: 'already-missing-auth' })
  );
  const { components } = await import('../_generated/api');
  await t.mutation(components.betterAuth.adapter.updateOne, {
    input: {
      model: 'user',
      where: [{ field: '_id', value: admin.user._id }],
      update: { role: 'admin' },
    },
  });
  const event = await owner.auth.mutation(api.events.mutations.createEvent, {
    title: 'No admin succession',
    chosenDateTime: '2027-01-01T12:00:00Z',
  });
  await expect(
    admin.auth.mutation(api.admin.mutations.deletePerson, {
      personId: owner.personId,
    })
  ).rejects.toThrow('Resolve owned Events');
  expect(
    await owner.auth.query(api.users.queries.getCurrentUserProfile, {})
  ).not.toBeNull();
  await expect(
    owner.auth.mutation(api.admin.mutations.deletePerson, { personId: orphan })
  ).rejects.toThrow('Admin privileges required');
  const orphanKey = await t.mutation(components.betterAuth.adapter.create, {
    input: {
      model: 'apikey',
      data: {
        userId: 'already-missing-auth',
        key: 'orphaned-key',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    },
  });
  await expect(
    admin.auth.mutation(api.admin.mutations.deletePerson, { personId: orphan })
  ).resolves.toEqual({ success: true, deletedUserId: 'already-missing-auth' });
  expect(
    await t.query(components.betterAuth.adapter.findOne, {
      model: 'apikey',
      where: [{ field: '_id', value: orphanKey._id }],
    })
  ).toBeNull();
  await owner.auth.mutation(api.accountResolution.mutations.deleteOwnedEvent, {
    eventId: event.eventId,
  });
  await expect(
    admin.auth.mutation(api.admin.mutations.deletePerson, {
      personId: owner.personId,
    })
  ).resolves.toEqual({ success: true, deletedUserId: owner.user._id });
  await expect(
    owner.auth.mutation(api.users.mutations.completeOnboarding, {
      username: 'stale-target',
    })
  ).rejects.toThrow('Authentication required');
});

it('removes deleted-account private preferences without touching another account', async () => {
  const t = createTestInstance();
  registerBetterAuth(t);
  const owner = await createAuthAccount(t, 'private-resolution-owner');
  const other = await createAuthAccount(t, 'private-resolution-other');
  const ids = await t.run(async ctx => {
    const insert = (personId: typeof owner.personId) =>
      ctx.db.insert('themePreferences', {
        personId,
        selectedThemeType: 'base',
        selectedThemeId: 'groupi-light',
        useSystemPreference: true,
        systemLightThemeId: 'groupi-light',
        systemDarkThemeId: 'groupi-dark',
        updatedAt: Date.now(),
      });
    return [await insert(owner.personId), await insert(other.personId)];
  });
  await owner.auth.mutation(api.users.mutations.deleteUserAccount, {
    confirmation: 'private-resolution-owner',
  });
  // Approved persistence cleanup seam: private preferences cannot outlive their identity.
  expect(await t.run(ctx => ctx.db.get(ids[0]))).toBeNull();
  expect(await t.run(ctx => ctx.db.get(ids[1]))).not.toBeNull();
});

it('pages current Events and live eligible transfer members without exposing foreign ownership', async () => {
  const t = createTestInstance();
  registerBetterAuth(t);
  const owner = await createAuthAccount(t, 'candidate-owner');
  const member = await createAuthAccount(t, 'candidate-member');
  const blocked = await createAuthAccount(t, 'candidate-blocked');
  const ids = [];
  for (const title of ['One', 'Two', 'Three'])
    ids.push(
      (
        await owner.auth.mutation(api.events.mutations.createEvent, {
          title,
          chosenDateTime: '2027-01-01T12:00:00Z',
        })
      ).eventId
    );
  const first = await owner.auth.query(
    api.accountResolution.queries.listOwned,
    { kind: 'EVENT', paginationOpts: { cursor: null, numItems: 2 } }
  );
  expect(first.page.map(item => item.title)).toEqual(['One', 'Two']);
  expect(first.isDone).toBe(false);
  const last = await owner.auth.query(api.accountResolution.queries.listOwned, {
    kind: 'EVENT',
    paginationOpts: { cursor: first.continueCursor, numItems: 2 },
  });
  expect(last.page.map(item => item.title)).toEqual(['Three']);
  expect(last.isDone).toBe(true);
  await t.run(async ctx => {
    for (const person of [member, blocked])
      await ctx.db.insert('memberships', {
        eventId: ids[0],
        personId: person.personId,
        role: 'ATTENDEE',
        rsvpStatus: 'YES',
      });
    await ctx.db.insert('userBlocks', {
      blockerId: owner.personId,
      blockedId: blocked.personId,
      createdAt: Date.now(),
    });
  });
  const candidates = await owner.auth.query(
    api.accountResolution.queries.recipients,
    {
      kind: 'EVENT',
      id: ids[0],
      paginationOpts: { cursor: null, numItems: 20 },
    }
  );
  expect(candidates.page).toEqual([
    { personId: member.personId, label: 'candidate-member' },
  ]);
  expect(
    (
      await member.auth.query(api.accountResolution.queries.recipients, {
        kind: 'EVENT',
        id: ids[0],
        paginationOpts: { cursor: null, numItems: 20 },
      })
    ).page
  ).toEqual([]);
  await expect(
    t.query(api.accountResolution.queries.listOwned, {
      kind: 'EVENT',
      paginationOpts: { cursor: null, numItems: 20 },
    })
  ).rejects.toThrow('Authentication required');
});

it('rejects unbounded responsibility and recipient pages at the authenticated Convex boundary', async () => {
  const t = createTestInstance();
  registerBetterAuth(t);
  const owner = await createAuthAccount(t, 'bounded-owner');
  await expect(
    owner.auth.query(api.accountResolution.queries.listOwned, {
      kind: 'EVENT',
      paginationOpts: { cursor: null, numItems: 101 },
    })
  ).rejects.toThrow('Page size');
});

it('explicit Event responsibility deletion removes its image as well as resource records', async () => {
  const t = createTestInstance();
  registerBetterAuth(t);
  const owner = await createAuthAccount(t, 'image-owner');
  const event = await owner.auth.mutation(api.events.mutations.createEvent, {
    title: 'Image cleanup',
    chosenDateTime: '2027-01-01T12:00:00Z',
  });
  const imageId = await t.run(async ctx => {
    const image = await ctx.storage.store(
      new Blob(['test image'], { type: 'image/png' })
    );
    await ctx.db.patch(event.eventId, { imageStorageId: image });
    return image;
  });
  await owner.auth.mutation(api.accountResolution.mutations.deleteOwnedEvent, {
    eventId: event.eventId,
  });
  expect(await t.run(ctx => ctx.storage.getUrl(imageId))).toBeNull();
});
