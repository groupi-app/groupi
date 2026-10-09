import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, components } from '../_generated/api';
import { createAuthAccount, registerBetterAuth } from './auth.helpers';
import { createTestInstance, TestScenarios } from './test_helpers';

async function adminRequest(t: ReturnType<typeof createTestInstance>) {
  const admin = await createAuthAccount(t, 'combined-admin');
  await t.mutation(components.betterAuth.adapter.updateOne, {
    input: {
      model: 'user',
      where: [{ field: '_id', value: admin.user._id }],
      update: { role: 'admin' },
    },
  });
  const raw = 'grp_combined_admin';
  const hash = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(raw)
  );
  await t.mutation(components.betterAuth.adapter.create, {
    input: {
      model: 'apikey',
      data: {
        userId: admin.user._id,
        key: btoa(String.fromCharCode(...new Uint8Array(hash)))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, ''),
        enabled: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    },
  });
  return (userId: string) =>
    t.fetch(`/api/v2/admin/users/${userId}`, {
      method: 'DELETE',
      headers: { 'x-api-key': raw },
    });
}

describe('Combined Group, Event transfer and private Invite List contracts', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it.each(['self', 'admin'] as const)(
    'preserves identity and private lists when %s deletion has unresolved Group ownership, then cleans only owned lists after resolution',
    async mode => {
      const t = createTestInstance();
      registerBetterAuth(t);
      const owner = await createAuthAccount(t, 'combined-owner');
      const other = await createAuthAccount(t, 'combined-other');
      const groupId = await owner.auth.mutation(
        api.groups.mutations.createGroup,
        {
          name: 'Owned community',
        }
      );
      const ownList = await owner.auth.mutation(
        api.inviteLists.mutations.createInviteList,
        {
          name: 'Private selection',
          personIds: [other.personId],
        }
      );
      const otherList = await other.auth.mutation(
        api.inviteLists.mutations.createInviteList,
        {
          name: 'Retained selection',
          personIds: [owner.personId],
        }
      );
      const request = mode === 'admin' ? await adminRequest(t) : null;
      if (request) {
        const blocked = await request(owner.user._id);
        expect(blocked.status).toBe(409);
        expect(await blocked.json()).toMatchObject({
          error: { message: expect.stringContaining('Resolve owned Groups') },
        });
      } else {
        await expect(
          owner.auth.mutation(api.users.mutations.deleteUserAccount, {
            confirmation: 'combined-owner',
          })
        ).rejects.toThrow('Resolve owned Groups');
      }
      expect(
        await owner.auth.query(api.groups.queries.getGroup, { groupId })
      ).toMatchObject({ viewerRole: 'OWNER', memberCount: 1 });
      expect(
        await owner.auth.query(api.inviteLists.queries.getInviteList, {
          inviteListId: ownList.inviteListId,
        })
      ).toMatchObject({ name: 'Private selection' });
      await owner.auth.mutation(api.groups.mutations.deleteGroup, { groupId });
      if (request) expect((await request(owner.user._id)).status).toBe(204);
      else
        await owner.auth.mutation(api.users.mutations.deleteUserAccount, {
          confirmation: 'combined-owner',
        });
      await expect(
        owner.auth.query(api.inviteLists.queries.listInviteLists, {})
      ).rejects.toThrow('Authentication required');
      expect(await t.run(ctx => ctx.db.get(ownList.inviteListId))).toBeNull();
      expect(
        await other.auth.query(api.inviteLists.queries.getInviteList, {
          inviteListId: otherList.inviteListId,
        })
      ).toMatchObject({
        name: 'Retained selection',
        needsAttention: true,
        people: [
          {
            personId: owner.personId,
            name: null,
            username: null,
            image: null,
            available: false,
          },
        ],
      });
    }
  );

  it('checks current Event organizer authority before Moderator replay after accepted transfer and never substitutes Group ownership', async () => {
    const t = createTestInstance();
    registerBetterAuth(t);
    const event = await TestScenarios.singleEvent(t);
    const owner = await createAuthAccount(
      t,
      'combined-event-owner',
      event.personId
    );
    const successor = await createAuthAccount(t, 'combined-successor');
    const target = await createAuthAccount(t, 'combined-target');
    const groupOwner = await createAuthAccount(t, 'combined-group-owner');
    await groupOwner.auth.mutation(api.groups.mutations.createGroup, {
      name: 'Separate Group',
    });
    const successorInvite = await owner.auth.mutation(
      api.eventInvites.mutations.sendEventInvite,
      {
        eventId: event.eventId,
        inviteePersonId: successor.personId,
        role: 'ATTENDEE',
      }
    );
    await successor.auth.mutation(
      api.eventInvites.mutations.acceptEventInvite,
      {
        inviteId: successorInvite.inviteId,
      }
    );
    expect(
      (
        await successor.auth.query(api.events.queries.getEventHeader, {
          eventId: event.eventId,
        })
      ).userMembership.rsvpStatus
    ).toBe('PENDING');
    const args = {
      eventId: event.eventId,
      personIds: [target.personId],
      role: 'MODERATOR' as const,
      requestId: `${Date.now()}.${crypto.randomUUID()}`,
    };
    expect(
      (
        await owner.auth.mutation(
          api.inviteLists.mutations.sendInviteListRecipients,
          args
        )
      ).sentCount
    ).toBe(1);
    const offer = await owner.auth.mutation(
      api.eventTransfers.mutations.offer,
      {
        eventId: event.eventId,
        recipientId: successor.personId,
      }
    );
    await successor.auth.mutation(api.eventTransfers.mutations.accept, {
      eventId: event.eventId,
      transferId: offer!.transferId!,
    });
    await expect(
      owner.auth.mutation(
        api.inviteLists.mutations.sendInviteListRecipients,
        args
      )
    ).rejects.toThrow('Only organizers');
    await expect(
      owner.auth.mutation(api.eventInvites.mutations.sendEventInvite, {
        eventId: event.eventId,
        inviteePersonId: groupOwner.personId,
        role: 'MODERATOR',
      })
    ).rejects.toThrow('Only organizers');
    await expect(
      groupOwner.auth.mutation(
        api.inviteLists.mutations.sendInviteListRecipients,
        {
          ...args,
          requestId: `${Date.now()}.${crypto.randomUUID()}`,
        }
      )
    ).rejects.toThrow('Event membership required');
    const received = await target.auth.query(
      api.eventInvites.queries.getPendingEventInvites,
      {}
    );
    expect(received).toHaveLength(1);
    expect(received[0].role).toBe('MODERATOR');
    const header = await successor.auth.query(
      api.events.queries.getEventHeader,
      { eventId: event.eventId }
    );
    expect(header.userMembership.role).toBe('ORGANIZER');
    expect(header.userMembership.rsvpStatus).toBe('PENDING');
  });
});
