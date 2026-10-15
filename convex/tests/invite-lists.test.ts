import { describe, expect, it } from 'vitest';
import { api, components } from '../_generated/api';
import { createAuthAccount, registerBetterAuth } from './auth.helpers';
import { createTestInstance } from './test_helpers';

async function setup() {
  const t = createTestInstance();
  registerBetterAuth(t);
  const owner = await createAuthAccount(t, 'list-owner');
  const recipient = await createAuthAccount(t, 'list-recipient');
  return { t, owner, recipient };
}

describe('Private invite lists', () => {
  it('allows only one concurrent rename to a creator-local normalized name', async () => {
    const { owner, recipient } = await setup();
    const lists = [];
    for (const name of ['First', 'Second'])
      lists.push(
        await owner.auth.mutation(api.inviteLists.mutations.createInviteList, {
          name,
          personIds: [recipient.personId],
        })
      );
    const results = await Promise.allSettled(
      lists.map((list, index) =>
        owner.auth.mutation(api.inviteLists.mutations.updateInviteList, {
          inviteListId: list.inviteListId,
          name: index === 0 ? ' Weekend ' : 'WEEKEND',
        })
      )
    );
    expect(
      results.filter(result => result.status === 'fulfilled')
    ).toHaveLength(1);
    const saved = await owner.auth.query(
      api.inviteLists.queries.listInviteLists,
      {}
    );
    expect(saved.items).toHaveLength(2);
    expect(
      saved.items.filter(list => list.name.toLowerCase() === 'weekend')
    ).toHaveLength(1);
  });
  it('keeps edit/delete creator-only and silently removes the future picker choice', async () => {
    const { t, owner, recipient } = await setup();
    const list = await owner.auth.mutation(
      api.inviteLists.mutations.createInviteList,
      { name: 'Private', personIds: [recipient.personId] }
    );
    await expect(
      recipient.auth.mutation(api.inviteLists.mutations.updateInviteList, {
        inviteListId: list.inviteListId,
        name: 'Forged',
      })
    ).rejects.toThrow('Invite list not found');
    await expect(
      recipient.auth.mutation(api.inviteLists.mutations.deleteInviteList, {
        inviteListId: list.inviteListId,
      })
    ).rejects.toThrow('Invite list not found');
    await expect(
      t.mutation(api.inviteLists.mutations.updateInviteList, {
        inviteListId: list.inviteListId,
        name: 'Anonymous',
      })
    ).rejects.toThrow('Authentication required');
    await expect(
      t.mutation(api.inviteLists.mutations.deleteInviteList, {
        inviteListId: list.inviteListId,
      })
    ).rejects.toThrow('Authentication required');
    await owner.auth.mutation(api.inviteLists.mutations.updateInviteList, {
      inviteListId: list.inviteListId,
      name: 'Saved',
    });
    expect(
      await owner.auth.mutation(api.inviteLists.mutations.deleteInviteList, {
        inviteListId: list.inviteListId,
      })
    ).toEqual({ deleted: true, inviteListId: list.inviteListId });
    expect(
      await owner.auth.query(api.inviteLists.queries.listInviteLists, {})
    ).toEqual({ items: [] });
    await expect(
      owner.auth.query(api.inviteLists.queries.getInviteList, {
        inviteListId: list.inviteListId,
      })
    ).rejects.toThrow('Invite list not found');
    expect(
      await recipient.auth.query(
        api.eventInvites.queries.getPendingEventInvites,
        {}
      )
    ).toEqual([]);
    expect(
      await recipient.auth.query(api.events.queries.getUserEventsAndInvites, {})
    ).toMatchObject({ events: [], pendingInvites: [] });
    expect(
      await recipient.auth.query(
        api.notifications.queries.fetchNotificationsForPerson,
        {}
      )
    ).toMatchObject({ notifications: [] });
  });
  it('rejects invalid partial edits without changing the saved selection', async () => {
    const { t, owner, recipient } = await setup();
    const list = await owner.auth.mutation(
      api.inviteLists.mutations.createInviteList,
      { name: 'Unchanged', personIds: [recipient.personId] }
    );
    await owner.auth.mutation(api.inviteLists.mutations.createInviteList, {
      name: 'Taken',
      personIds: [recipient.personId],
    });
    for (const change of [
      {},
      { name: '  ' },
      { name: 'x'.repeat(101) },
      { name: ' TAKEN ' },
      { personIds: [] },
    ]) {
      await expect(
        owner.auth.mutation(api.inviteLists.mutations.updateInviteList, {
          inviteListId: list.inviteListId,
          ...change,
        })
      ).rejects.toThrow();
      expect(
        await owner.auth.query(api.inviteLists.queries.getInviteList, {
          inviteListId: list.inviteListId,
        })
      ).toEqual(list);
    }
    const missing = await createAuthAccount(t, 'disappeared-person');
    await t.run(ctx => ctx.db.delete(missing.personId));
    await expect(
      owner.auth.mutation(api.inviteLists.mutations.updateInviteList, {
        inviteListId: list.inviteListId,
        personIds: [missing.personId],
      })
    ).rejects.toThrow('existing users');
    const many = [];
    for (let i = 0; i < 101; i++)
      many.push((await createAuthAccount(t, `update-person-${i}`)).personId);
    await expect(
      owner.auth.mutation(api.inviteLists.mutations.updateInviteList, {
        inviteListId: list.inviteListId,
        personIds: many,
      })
    ).rejects.toThrow('100 people');
    expect(
      await owner.auth.query(api.inviteLists.queries.getInviteList, {
        inviteListId: list.inviteListId,
      })
    ).toEqual(list);
  });
  it('partially renames and replaces people while preserving the other saved fields', async () => {
    const { t, owner, recipient } = await setup();
    const third = await createAuthAccount(t, 'new-list-person');
    const list = await owner.auth.mutation(
      api.inviteLists.mutations.createInviteList,
      { name: 'Original', personIds: [recipient.personId] }
    );
    const renamed = await owner.auth.mutation(
      api.inviteLists.mutations.updateInviteList,
      { inviteListId: list.inviteListId, name: '  Renamed  ' }
    );
    expect(renamed).toMatchObject({
      name: 'Renamed',
      createdAt: list.createdAt,
      people: list.people,
    });
    const updated = await owner.auth.mutation(
      api.inviteLists.mutations.updateInviteList,
      {
        inviteListId: list.inviteListId,
        personIds: [third.personId, third.personId],
      }
    );
    expect(updated).toMatchObject({
      name: 'Renamed',
      personCount: 1,
      people: [{ personId: third.personId, available: true }],
    });
    expect(
      await owner.auth.query(api.inviteLists.queries.getInviteList, {
        inviteListId: list.inviteListId,
      })
    ).toEqual(updated);
  });
  it('browses the maximum collection with overlapping people and current availability counts', async () => {
    const { t, owner } = await setup();
    const people = [];
    for (let i = 0; i < 100; i++)
      people.push(await createAuthAccount(t, `regular-${i}`));
    for (let i = 0; i < 100; i++)
      await owner.auth.mutation(api.inviteLists.mutations.createInviteList, {
        name: `Regulars ${i}`,
        personIds: people.map(person => person.personId),
      });
    await t.mutation(components.betterAuth.adapter.deleteOne, {
      input: {
        model: 'user',
        where: [{ field: '_id', value: people[0].user._id }],
      },
    });
    const collection = await owner.auth.query(
      api.inviteLists.queries.listInviteLists,
      {}
    );
    expect(collection.items).toHaveLength(100);
    for (const list of collection.items)
      expect(list).toMatchObject({
        personCount: 100,
        availablePersonCount: 99,
        needsAttention: false,
      });
  });
  it('resolves current profiles by stable identity without preserving obsolete display data', async () => {
    const { t, owner, recipient } = await setup();
    const list = await owner.auth.mutation(
      api.inviteLists.mutations.createInviteList,
      { name: 'Current people', personIds: [recipient.personId] }
    );
    await t.mutation(components.betterAuth.adapter.updateOne, {
      input: {
        model: 'user',
        where: [{ field: '_id', value: recipient.user._id }],
        update: {
          name: 'Renamed person',
          username: 'new-username',
          updatedAt: Date.now(),
        },
      },
    });
    expect(
      (
        await owner.auth.query(api.inviteLists.queries.getInviteList, {
          inviteListId: list.inviteListId,
        })
      ).people
    ).toEqual([
      {
        personId: recipient.personId,
        name: 'Renamed person',
        username: 'new-username',
        image: null,
        available: true,
      },
    ]);
    await t.mutation(components.betterAuth.adapter.deleteOne, {
      input: {
        model: 'user',
        where: [{ field: '_id', value: recipient.user._id }],
      },
    });
    expect(
      await owner.auth.query(api.inviteLists.queries.getInviteList, {
        inviteListId: list.inviteListId,
      })
    ).toMatchObject({
      name: 'Current people',
      availablePersonCount: 0,
      needsAttention: true,
      people: [
        {
          personId: recipient.personId,
          name: null,
          username: null,
          image: null,
          available: false,
        },
      ],
    });
    await expect(
      owner.auth.mutation(api.inviteLists.mutations.createInviteList, {
        name: 'Missing account',
        personIds: [recipient.personId],
      })
    ).rejects.toThrow('existing users');
  });
  it('silently saves people without notifications, invitations or event participation', async () => {
    const { owner, recipient } = await setup();
    const before = await recipient.auth.query(
      api.events.queries.getUserEventsAndInvites,
      {}
    );
    await owner.auth.mutation(api.inviteLists.mutations.createInviteList, {
      name: 'No event',
      personIds: [recipient.personId],
    });
    expect(
      await recipient.auth.query(api.events.queries.getUserEventsAndInvites, {})
    ).toEqual(before);
    expect(
      await recipient.auth.query(
        api.eventInvites.queries.getPendingEventInvites,
        {}
      )
    ).toEqual([]);
    expect(
      await recipient.auth.query(
        api.notifications.queries.fetchNotificationsForPerson,
        {}
      )
    ).toMatchObject({ notifications: [] });
    expect(
      await owner.auth.query(
        api.notifications.queries.fetchNotificationsForPerson,
        {}
      )
    ).toMatchObject({ notifications: [] });
  });
  it('includes only accepted friend choices and keeps blocked users out of discovery in either direction', async () => {
    const { t, owner, recipient } = await setup();
    const pending = await createAuthAccount(t, 'pending-person');
    const accepted = await recipient.auth.mutation(
      api.friends.mutations.sendFriendRequest,
      { addresseePersonId: owner.personId }
    );
    await owner.auth.mutation(api.friends.mutations.acceptFriendRequest, {
      friendshipId: accepted.friendshipId,
    });
    await owner.auth.mutation(api.friends.mutations.sendFriendRequest, {
      addresseePersonId: pending.personId,
    });
    expect(
      (
        await owner.auth.query(api.inviteLists.queries.getFriendChoices, {})
      ).items.map(person => person.personId)
    ).toEqual([recipient.personId]);
    await recipient.auth.mutation(api.friends.mutations.blockUser, {
      personId: owner.personId,
    });
    expect(
      await owner.auth.query(api.inviteLists.queries.searchPeople, {
        searchTerm: 'list',
      })
    ).toEqual({ items: [] });
    expect(
      await recipient.auth.query(api.inviteLists.queries.searchPeople, {
        searchTerm: 'list',
      })
    ).toEqual({ items: [] });
    expect(
      await owner.auth.query(api.inviteLists.queries.getFriendChoices, {})
    ).toEqual({ items: [] });
    // A saved selection is independent of event invitation eligibility.
    expect(
      (
        await owner.auth.mutation(api.inviteLists.mutations.createInviteList, {
          name: 'Saved identity',
          personIds: [recipient.personId],
        })
      ).personCount
    ).toBe(1);
  });
  it('permits only one winner for concurrent normalized-name creates', async () => {
    const { owner, recipient } = await setup();
    const results = await Promise.allSettled(
      [' Weekend ', 'WEEKEND'].map(name =>
        owner.auth.mutation(api.inviteLists.mutations.createInviteList, {
          name,
          personIds: [recipient.personId],
        })
      )
    );
    expect(
      results.filter(result => result.status === 'fulfilled')
    ).toHaveLength(1);
    expect(
      (await owner.auth.query(api.inviteLists.queries.listInviteLists, {}))
        .items
    ).toHaveLength(1);
  });
  it('allows 100 lists per creator and protects the final slot from concurrent creates', async () => {
    const { owner, recipient } = await setup();
    for (let i = 0; i < 99; i++)
      await owner.auth.mutation(api.inviteLists.mutations.createInviteList, {
        name: `List ${i}`,
        personIds: [recipient.personId],
      });
    const results = await Promise.allSettled(
      ['Final A', 'Final B'].map(name =>
        owner.auth.mutation(api.inviteLists.mutations.createInviteList, {
          name,
          personIds: [recipient.personId],
        })
      )
    );
    expect(
      results.filter(result => result.status === 'fulfilled')
    ).toHaveLength(1);
    expect(
      (await owner.auth.query(api.inviteLists.queries.listInviteLists, {}))
        .items
    ).toHaveLength(100);
    await expect(
      owner.auth.mutation(api.inviteLists.mutations.createInviteList, {
        name: 'Overflow',
        personIds: [recipient.personId],
      })
    ).rejects.toThrow('100 invite lists');
    expect(
      (
        await recipient.auth.mutation(
          api.inviteLists.mutations.createInviteList,
          {
            name: 'Other owner',
            personIds: [owner.personId],
          }
        )
      ).name
    ).toBe('Other owner');
  });
  it('requires existing people and enforces 100 unique people after deduplication', async () => {
    const { t, owner, recipient } = await setup();
    const create = (name: string, personIds: (typeof recipient.personId)[]) =>
      owner.auth.mutation(api.inviteLists.mutations.createInviteList, {
        name,
        personIds,
      });
    await expect(create('Empty', [])).rejects.toThrow(
      'at least one existing user'
    );
    await t.run(ctx => ctx.db.delete(recipient.personId));
    await expect(create('Unavailable', [recipient.personId])).rejects.toThrow(
      'existing users'
    );
    const people = [];
    for (let i = 0; i < 101; i++)
      people.push((await createAuthAccount(t, `person-${i}`)).personId);
    const hundred = await create('Hundred', people.slice(0, 100));
    expect(hundred.personCount).toBe(100);
    expect(
      (await create('Repeated', Array(101).fill(people[0]))).personCount
    ).toBe(1);
    await expect(create('Too many', people)).rejects.toThrow('100 people');
    expect(
      (await owner.auth.query(api.inviteLists.queries.listInviteLists, {}))
        .items
    ).toHaveLength(2);
  });
  it('validates trimmed name boundaries and owner-local case-insensitive uniqueness', async () => {
    const { owner, recipient } = await setup();
    const create = (name: string) =>
      owner.auth.mutation(api.inviteLists.mutations.createInviteList, {
        name,
        personIds: [recipient.personId],
      });
    await expect(create('   ')).rejects.toThrow('1–100 characters');
    await expect(create('x'.repeat(101))).rejects.toThrow('1–100 characters');
    await create('x');
    await create('x'.repeat(100));
    await create('Weekend');
    await expect(create('  WEEKEND  ')).rejects.toThrow('already exists');
    const other = await recipient.auth.mutation(
      api.inviteLists.mutations.createInviteList,
      { name: 'weekend', personIds: [owner.personId] }
    );
    expect(other.name).toBe('weekend');
    expect(
      (await owner.auth.query(api.inviteLists.queries.listInviteLists, {}))
        .items
    ).toHaveLength(3);
  });
  it('finds an existing nonfriend by username without requiring an event', async () => {
    const { t, owner, recipient } = await setup();
    expect(
      await owner.auth.query(api.inviteLists.queries.searchPeople, {
        searchTerm: ' RE ',
      })
    ).toEqual({
      items: [
        {
          personId: recipient.personId,
          name: 'list-recipient',
          username: 'list-recipient',
          image: null,
          available: true,
        },
      ],
    });
    expect(
      await owner.auth.query(api.inviteLists.queries.searchPeople, {
        searchTerm: 'r',
      })
    ).toEqual({ items: [] });
    expect(
      await owner.auth.query(api.inviteLists.queries.getFriendChoices, {})
    ).toEqual({ items: [] });
    await expect(
      t.query(api.inviteLists.queries.searchPeople, { searchTerm: 're' })
    ).rejects.toThrow('Authentication required');
    await expect(
      t.query(api.inviteLists.queries.getFriendChoices, {})
    ).rejects.toThrow('Authentication required');
  });
  it('keeps collections private and hides another creator’s list existence', async () => {
    const { t, owner, recipient } = await setup();
    const list = await owner.auth.mutation(
      api.inviteLists.mutations.createInviteList,
      {
        name: 'Private',
        personIds: [recipient.personId],
      }
    );
    expect(
      await recipient.auth.query(api.inviteLists.queries.listInviteLists, {})
    ).toEqual({ items: [] });
    await expect(
      recipient.auth.query(api.inviteLists.queries.getInviteList, {
        inviteListId: list.inviteListId,
      })
    ).rejects.toThrow('Invite list not found');
    await expect(
      t.query(api.inviteLists.queries.listInviteLists, {})
    ).rejects.toThrow('Authentication required');
    await expect(
      t.query(api.inviteLists.queries.getInviteList, {
        inviteListId: list.inviteListId,
      })
    ).rejects.toThrow('Authentication required');
    await expect(
      t.mutation(api.inviteLists.mutations.createInviteList, {
        name: 'Anonymous',
        personIds: [recipient.personId],
      })
    ).rejects.toThrow('Authentication required');
  });
  it('creates and browses a named list of unique existing people without an event', async () => {
    const { owner, recipient } = await setup();
    const list = await owner.auth.mutation(
      api.inviteLists.mutations.createInviteList,
      {
        name: '  Weekend friends  ',
        personIds: [recipient.personId, recipient.personId],
      }
    );
    expect(list).toMatchObject({
      name: 'Weekend friends',
      personCount: 1,
      availablePersonCount: 1,
      needsAttention: false,
      people: [
        {
          personId: recipient.personId,
          name: 'list-recipient',
          username: 'list-recipient',
          image: null,
          available: true,
        },
      ],
    });
    expect(
      await owner.auth.query(api.inviteLists.queries.getInviteList, {
        inviteListId: list.inviteListId,
      })
    ).toEqual(list);
    expect(
      await owner.auth.query(api.inviteLists.queries.listInviteLists, {})
    ).toMatchObject({
      items: [
        {
          inviteListId: list.inviteListId,
          name: 'Weekend friends',
          personCount: 1,
        },
      ],
    });
  });
});
