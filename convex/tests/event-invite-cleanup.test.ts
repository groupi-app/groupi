import { expect, it } from 'vitest';
import { api } from '../_generated/api';
import { createAuthAccount, registerBetterAuth } from './auth.helpers';
import { createTestInstance, createTestUser } from './test_helpers';

it.each(['event', 'account responsibility'] as const)(
  '%s deletion removes all invitation states only for the deleted Event',
  async path => {
    const t = createTestInstance();
    registerBetterAuth(t);
    const owner = await createAuthAccount(t, 'cleanup-owner');
    const outsider = await createAuthAccount(t, 'cleanup-outsider');
    const deleted = await owner.auth.mutation(
      api.events.mutations.createEvent,
      {
        title: 'Delete this Event',
        chosenDateTime: '2027-01-01T12:00:00Z',
      }
    );
    const retained = await owner.auth.mutation(
      api.events.mutations.createEvent,
      {
        title: 'Keep this Event',
        chosenDateTime: '2027-01-01T12:00:00Z',
      }
    );
    const invitationIds = [];
    for (const status of ['PENDING', 'ACCEPTED', 'DECLINED'] as const) {
      const recipient = await createTestUser(t);
      invitationIds.push(
        await t.run(ctx =>
          ctx.db.insert('eventInvites', {
            eventId: deleted.eventId,
            inviterId: owner.personId,
            inviteeId: recipient.personId,
            role: 'ATTENDEE',
            status,
            createdAt: Date.now(),
          })
        )
      );
    }
    const retainedInvitationId = await t.run(ctx =>
      ctx.db.insert('eventInvites', {
        eventId: retained.eventId,
        inviterId: owner.personId,
        inviteeId: outsider.personId,
        role: 'ATTENDEE',
        status: 'PENDING',
        createdAt: Date.now(),
      })
    );
    const retainedInvitation = await t.run(ctx =>
      ctx.db.get(retainedInvitationId)
    );
    const mutation =
      path === 'event'
        ? api.events.mutations.deleteEvent
        : api.accountResolution.mutations.deleteOwnedEvent;
    await expect(
      outsider.auth.mutation(mutation, { eventId: deleted.eventId })
    ).rejects.toThrow();
    expect(
      await t.run(ctx => Promise.all(invitationIds.map(id => ctx.db.get(id))))
    ).toEqual([
      expect.objectContaining({ status: 'PENDING' }),
      expect.objectContaining({ status: 'ACCEPTED' }),
      expect.objectContaining({ status: 'DECLINED' }),
    ]);

    await owner.auth.mutation(mutation, { eventId: deleted.eventId });

    expect(await t.run(ctx => ctx.db.get(deleted.eventId))).toBeNull();
    expect(
      await t.run(ctx => Promise.all(invitationIds.map(id => ctx.db.get(id))))
    ).toEqual([null, null, null]);
    expect(await t.run(ctx => ctx.db.get(retained.eventId))).not.toBeNull();
    expect(await t.run(ctx => ctx.db.get(retainedInvitationId))).toEqual(
      retainedInvitation
    );
  }
);
