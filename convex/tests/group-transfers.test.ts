import { expect, it } from 'vitest';
import { api, components } from '../_generated/api';
import { createTestInstance } from './test_helpers';
import { createAuthAccount, registerBetterAuth } from './auth.helpers';
async function fixture() {
  const t = createTestInstance();
  registerBetterAuth(t);
  const owner = await createAuthAccount(t, 'transfer-owner'),
    recipient = await createAuthAccount(t, 'transfer-recipient'),
    outsider = await createAuthAccount(t, 'transfer-outsider');
  const groupId = await owner.auth.mutation(api.groups.mutations.createGroup, {
    name: 'Readers',
  });
  const invite = await owner.auth.mutation(
    api.groupInvites.mutations.sendGroupInvite,
    { groupId, inviteePersonId: recipient.personId }
  );
  await recipient.auth.mutation(api.groupInvites.mutations.acceptGroupInvite, {
    inviteId: invite.inviteId,
  });
  return { t, owner, recipient, outsider, groupId };
}
it('requires recipient consent and atomically changes one owner without changing membership identity or Event authority', async () => {
  const f = await fixture();
  const event = await f.owner.auth.mutation(api.events.mutations.createEvent, {
    title: 'Independent',
    chosenDateTime: '2027-01-01T12:00:00Z',
  });
  const before = await f.t.run(ctx =>
    ctx.db
      .query('groupMemberships')
      .withIndex('by_groupId', q => q.eq('groupId', f.groupId))
      .collect()
  );
  const offer = await f.owner.auth.mutation(
    api.groupTransfers.mutations.offer,
    { groupId: f.groupId, recipientId: f.recipient.personId }
  );
  expect(offer.status).toBe('PENDING');
  expect(
    await f.owner.auth.query(api.groups.queries.getGroup, {
      groupId: f.groupId,
    })
  ).toMatchObject({
    ownerId: f.owner.personId,
    viewerRole: 'OWNER',
    memberCount: 2,
  });
  await expect(
    f.owner.auth.mutation(api.users.mutations.deleteUserAccount, {
      confirmation: 'transfer-owner',
    })
  ).rejects.toThrow('Resolve owned Groups');
  await expect(
    f.outsider.auth.mutation(api.groupTransfers.mutations.accept, {
      groupId: f.groupId,
      transferId: offer.transferId!,
    })
  ).rejects.toThrow();
  const accepted = await f.recipient.auth.mutation(
    api.groupTransfers.mutations.accept,
    { groupId: f.groupId, transferId: offer.transferId! }
  );
  expect(accepted).toMatchObject({
    status: 'ACCEPTED',
    ownerId: f.recipient.personId,
  });
  await f.recipient.auth.mutation(api.groupTransfers.mutations.accept, {
    groupId: f.groupId,
    transferId: offer.transferId!,
  });
  expect(
    await f.owner.auth.query(api.groups.queries.getGroup, {
      groupId: f.groupId,
    })
  ).toMatchObject({ viewerRole: 'MODERATOR', memberCount: 2 });
  const after = await f.recipient.auth.query(
    api.groups.queries.listGroupMembers,
    { groupId: f.groupId, paginationOpts: { numItems: 20, cursor: null } }
  );
  const afterIds = await f.t.run(ctx =>
    ctx.db
      .query('groupMemberships')
      .withIndex('by_groupId', q => q.eq('groupId', f.groupId))
      .collect()
  );
  expect(afterIds.map(m => m._id)).toEqual(before.map(m => m._id));
  expect(after.page.filter(m => m.role === 'OWNER')).toHaveLength(1);
  expect(
    (
      await f.owner.auth.query(api.events.queries.getEventHeader, {
        eventId: event.eventId,
      })
    ).userMembership.role
  ).toBe('ORGANIZER');
});
it('decline/cancel outcomes and stale actions cannot seize responsibility, and bans are rechecked on accept', async () => {
  const f = await fixture();
  const first = await f.owner.auth.mutation(
    api.groupTransfers.mutations.offer,
    { groupId: f.groupId, recipientId: f.recipient.personId }
  );
  await f.recipient.auth.mutation(api.groupTransfers.mutations.decline, {
    groupId: f.groupId,
    transferId: first.transferId!,
  });
  expect(
    (
      await f.owner.auth.query(api.groupTransfers.queries.status, {
        groupId: f.groupId,
      })
    )?.status
  ).toBe('DECLINED');
  const second = await f.owner.auth.mutation(
    api.groupTransfers.mutations.offer,
    { groupId: f.groupId, recipientId: f.recipient.personId }
  );
  await expect(
    f.recipient.auth.mutation(api.groupTransfers.mutations.accept, {
      groupId: f.groupId,
      transferId: first.transferId!,
    })
  ).rejects.toThrow();
  await f.owner.auth.mutation(api.groupModeration.mutations.banGroupPerson, {
    groupId: f.groupId,
    personId: f.recipient.personId,
  });
  await expect(
    f.recipient.auth.mutation(api.groupTransfers.mutations.accept, {
      groupId: f.groupId,
      transferId: second.transferId!,
    })
  ).rejects.toThrow();
  await f.owner.auth.mutation(api.groupTransfers.mutations.cancel, {
    groupId: f.groupId,
    transferId: second.transferId!,
  });
  expect(
    (
      await f.owner.auth.query(api.groupTransfers.queries.status, {
        groupId: f.groupId,
      })
    )?.status
  ).toBe('CANCELLED');
});
it('explicit retirement purges private Group records but preserves independent Event membership/RSVP', async () => {
  const f = await fixture();
  await f.owner.auth.mutation(api.groupInvites.mutations.sendGroupInvite, {
    groupId: f.groupId,
    inviteePersonId: f.outsider.personId,
  });
  const banned = await createAuthAccount(f.t, 'transfer-retired-ban');
  await f.owner.auth.mutation(api.groupModeration.mutations.banGroupPerson, {
    groupId: f.groupId,
    personId: banned.personId,
  });
  const event = await f.recipient.auth.mutation(
    api.events.mutations.createEvent,
    { title: 'Independent', chosenDateTime: '2027-01-01T12:00:00Z' }
  );
  await f.owner.auth.mutation(api.groupTransfers.mutations.offer, {
    groupId: f.groupId,
    recipientId: f.recipient.personId,
  });
  await expect(
    f.recipient.auth.mutation(api.groups.mutations.deleteGroup, {
      groupId: f.groupId,
    })
  ).rejects.toThrow();
  await f.owner.auth.mutation(api.groups.mutations.deleteGroup, {
    groupId: f.groupId,
  });
  expect(
    await f.t.query(api.groups.queries.getGroupLanding, { groupId: f.groupId })
  ).toBeNull();
  expect(
    await f.t.run(ctx =>
      ctx.db
        .query('groupTransfers')
        .withIndex('by_group', q => q.eq('groupId', f.groupId))
        .collect()
    )
  ).toEqual([]);
  const retired = await f.t.run(async ctx => ({
    memberships: await ctx.db.query('groupMemberships').collect(),
    invites: await ctx.db.query('groupInvites').collect(),
    bans: await ctx.db.query('groupBans').collect(),
    notifications: await ctx.db.query('notifications').collect(),
    deliveries: await ctx.db.query('pushDeliveries').collect(),
  }));
  for (const rows of Object.values(retired))
    expect(rows.some(row => row.groupId === f.groupId)).toBe(false);
  expect(
    (
      await f.recipient.auth.query(api.events.queries.getEventHeader, {
        eventId: event.eventId,
      })
    ).userMembership
  ).toMatchObject({ role: 'ORGANIZER', rsvpStatus: 'YES' });
});
it('concurrent acceptance and cancellation cannot duplicate or silently replace the responsible owner', async () => {
  const f = await fixture();
  const offered = await f.owner.auth.mutation(
    api.groupTransfers.mutations.offer,
    { groupId: f.groupId, recipientId: f.recipient.personId }
  );
  const results = await Promise.allSettled([
    f.recipient.auth.mutation(api.groupTransfers.mutations.accept, {
      groupId: f.groupId,
      transferId: offered.transferId!,
    }),
    f.owner.auth.mutation(api.groupTransfers.mutations.cancel, {
      groupId: f.groupId,
      transferId: offered.transferId!,
    }),
  ]);
  expect(results.some(result => result.status === 'fulfilled')).toBe(true);
  const group = await f.recipient.auth.query(api.groups.queries.getGroup, {
    groupId: f.groupId,
  });
  const members = await f.recipient.auth.query(
    api.groups.queries.listGroupMembers,
    { groupId: f.groupId, paginationOpts: { numItems: 20, cursor: null } }
  );
  expect(
    members.page.filter(m => m.role === 'OWNER').map(m => m.personId)
  ).toEqual([group!.ownerId]);
  const status = await f.owner.auth.query(api.groupTransfers.queries.status, {
    groupId: f.groupId,
  });
  expect(status?.status).toBe(
    group!.ownerId === f.recipient.personId ? 'ACCEPTED' : 'CANCELLED'
  );
});
it('accepted prior-owner deletion anonymizes shared history while the new owner and Group remain', async () => {
  const f = await fixture();
  const offer = await f.owner.auth.mutation(
    api.groupTransfers.mutations.offer,
    { groupId: f.groupId, recipientId: f.recipient.personId }
  );
  await f.recipient.auth.mutation(api.groupTransfers.mutations.accept, {
    groupId: f.groupId,
    transferId: offer.transferId!,
  });
  await f.owner.auth.mutation(api.users.mutations.deleteUserAccount, {
    confirmation: 'transfer-owner',
  });
  expect(
    await f.recipient.auth.query(api.groupTransfers.queries.status, {
      groupId: f.groupId,
    })
  ).toMatchObject({
    status: 'ACCEPTED',
    offeredById: null,
    ownerId: f.recipient.personId,
  });
  expect(
    await f.recipient.auth.query(api.groups.queries.getGroup, {
      groupId: f.groupId,
    })
  ).toMatchObject({ viewerRole: 'OWNER', memberCount: 1 });
  expect(
    await f.t.run(ctx =>
      ctx.db
        .query('groupTransfers')
        .withIndex('by_offeredBy', q => q.eq('offeredById', f.owner.personId))
        .collect()
    )
  ).toEqual([]);
});
it('current bans/blocks and actual departed recipients are checked before offers and before acceptance', async () => {
  const f = await fixture();
  await expect(
    f.owner.auth.mutation(api.groupTransfers.mutations.offer, {
      groupId: f.groupId,
      recipientId: f.outsider.personId,
    })
  ).rejects.toThrow();
  await f.t.mutation(components.betterAuth.adapter.updateOne, {
    input: {
      model: 'user',
      where: [{ field: '_id', value: f.recipient.user._id }],
      update: { banned: true, banExpires: Date.now() + 60000 },
    },
  });
  await expect(
    f.owner.auth.mutation(api.groupTransfers.mutations.offer, {
      groupId: f.groupId,
      recipientId: f.recipient.personId,
    })
  ).rejects.toThrow();
  await f.t.mutation(components.betterAuth.adapter.updateOne, {
    input: {
      model: 'user',
      where: [{ field: '_id', value: f.recipient.user._id }],
      update: { banned: true, banExpires: Date.now() - 1000 },
    },
  });
  const offer = await f.owner.auth.mutation(
    api.groupTransfers.mutations.offer,
    { groupId: f.groupId, recipientId: f.recipient.personId }
  );
  await f.recipient.auth.mutation(api.groupModeration.mutations.leaveGroup, {
    groupId: f.groupId,
  });
  await expect(
    f.recipient.auth.mutation(api.groupTransfers.mutations.accept, {
      groupId: f.groupId,
      transferId: offer.transferId!,
    })
  ).rejects.toThrow();
  expect(
    (
      await f.owner.auth.query(api.groups.queries.getGroup, {
        groupId: f.groupId,
      })
    )?.ownerId
  ).toBe(f.owner.personId);
});

it('rechecks pair blocks on offer and acceptance without changing the responsible owner', async () => {
  const f = await fixture();
  await f.recipient.auth.mutation(api.friends.mutations.blockUser, {
    personId: f.owner.personId,
  });
  await expect(
    f.owner.auth.mutation(api.groupTransfers.mutations.offer, {
      groupId: f.groupId,
      recipientId: f.recipient.personId,
    })
  ).rejects.toThrow('eligible');
  await f.recipient.auth.mutation(api.friends.mutations.unblockUser, {
    personId: f.owner.personId,
  });
  const offer = await f.owner.auth.mutation(
    api.groupTransfers.mutations.offer,
    { groupId: f.groupId, recipientId: f.recipient.personId }
  );
  await f.owner.auth.mutation(api.friends.mutations.blockUser, {
    personId: f.recipient.personId,
  });
  await expect(
    f.recipient.auth.mutation(api.groupTransfers.mutations.accept, {
      groupId: f.groupId,
      transferId: offer.transferId!,
    })
  ).rejects.toThrow('eligible');
  expect(
    await f.owner.auth.query(api.groups.queries.getGroup, {
      groupId: f.groupId,
    })
  ).toMatchObject({ ownerId: f.owner.personId, memberCount: 2 });
});
it.each(['self', 'admin'] as const)(
  'removes private deleted participant references through %s account deletion',
  async mode => {
    const f = await fixture();
    const offer = await f.owner.auth.mutation(
      api.groupTransfers.mutations.offer,
      { groupId: f.groupId, recipientId: f.recipient.personId }
    );
    if (mode === 'self')
      await f.recipient.auth.mutation(api.users.mutations.deleteUserAccount, {
        confirmation: 'transfer-recipient',
      });
    else {
      const admin = await createAuthAccount(f.t, 'transfer-admin');
      await f.t.mutation(components.betterAuth.adapter.updateOne, {
        input: {
          model: 'user',
          where: [{ field: '_id', value: admin.user._id }],
          update: { role: 'admin' },
        },
      });
      await admin.auth.mutation(api.admin.mutations.deletePerson, {
        personId: f.recipient.personId,
      });
    }
    const rows = await f.t.run(ctx => ctx.db.query('groupTransfers').collect());
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      _id: offer.transferId,
      status: 'CANCELLED',
    });
    expect(
      rows.some(
        r =>
          r.recipientId === f.recipient.personId ||
          r.offeredById === f.recipient.personId
      )
    ).toBe(false);
    expect(
      await f.owner.auth.query(api.groups.queries.getGroup, {
        groupId: f.groupId,
      })
    ).toMatchObject({ ownerId: f.owner.personId, memberCount: 1 });
  }
);

it('current owner Auth ban invalidates acceptance and rolls back both roles', async () => {
  const f = await fixture();
  const offer = await f.owner.auth.mutation(
    api.groupTransfers.mutations.offer,
    { groupId: f.groupId, recipientId: f.recipient.personId }
  );
  await f.t.mutation(components.betterAuth.adapter.updateOne, {
    input: {
      model: 'user',
      where: [{ field: '_id', value: f.owner.user._id }],
      update: { banned: true, banExpires: Date.now() + 60000 },
    },
  });
  expect(
    await f.recipient.auth.query(api.groupTransfers.queries.status, {
      groupId: f.groupId,
    })
  ).toMatchObject({ status: 'PENDING', canAccept: false });
  await expect(
    f.recipient.auth.mutation(api.groupTransfers.mutations.accept, {
      groupId: f.groupId,
      transferId: offer.transferId!,
    })
  ).rejects.toThrow();
  const rows = await f.t.run(ctx =>
    ctx.db
      .query('groupMemberships')
      .withIndex('by_groupId', q => q.eq('groupId', f.groupId))
      .collect()
  );
  expect(rows.find(r => r.personId === f.owner.personId)?.role).toBe('OWNER');
  expect(rows.find(r => r.personId === f.recipient.personId)?.role).toBe(
    'MEMBER'
  );
});
