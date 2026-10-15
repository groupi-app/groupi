import { afterEach, expect, it, vi } from 'vitest';
import { api } from '../_generated/api';
import { setup } from './delegated-protocol.helpers';

const now = Date.now();
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); });
async function fixture() {
  const f = await setup();
  const groupId = await f.owner.auth.mutation(api.groups.mutations.createGroup, { name: 'Red Room' });
  const read = () => f.owner.auth.query(api.groups.currentEvent.getCurrentEvent, { groupId });
  return { ...f, groupId, read };
}
it('returns absence, one undated Event, then a typed conflict instead of picking one', async () => {
  const f = await fixture();
  expect(await f.read()).toEqual({ kind: 'none' });
  await f.owner.auth.mutation(api.groupEventAudiences.mutations.shareEventWithGroup, { groupId: f.groupId, eventId: f.event.eventId });
  expect(await f.read()).toMatchObject({ kind: 'event', event: { id: f.event.eventId, endsAt: null }, participation: { rsvp: 'YES' } });
  const second = await f.owner.auth.mutation(api.events.mutations.createEvent, { title: 'Second', potentialDateTimes: [] });
  await f.owner.auth.mutation(api.groupEventAudiences.mutations.shareEventWithGroup, { groupId: f.groupId, eventId: second.eventId });
  expect(await f.read()).toEqual({ kind: 'conflict', code: 'STAFF_CONFIGURATION_CONFLICT' });
});
it('uses the exact end boundary, keeping past starts without an end and undated Events active', async () => {
  const f = await fixture();
  vi.useFakeTimers(); vi.setSystemTime(now);
  await f.owner.auth.mutation(api.groupEventAudiences.mutations.shareEventWithGroup, { groupId: f.groupId, eventId: f.event.eventId });
  await f.t.run(ctx => ctx.db.patch(f.event.eventId, { chosenDateTime: now - 1000, chosenEndDateTime: now }));
  expect(await f.read()).toEqual({ kind: 'none' });
  await f.t.run(ctx => ctx.db.patch(f.event.eventId, { chosenEndDateTime: undefined }));
  expect(await f.read()).toMatchObject({ kind: 'event', event: { ongoing: true } });
  await f.t.run(ctx => ctx.db.patch(f.event.eventId, { chosenDateTime: undefined }));
  expect(await f.read()).toMatchObject({ kind: 'event', event: { ongoing: false } });
});
it('reads before Join for eligible Group members, hides roster, and preserves retained Event access after leaving', async () => {
  const f = await fixture();
  const { createAuthAccount } = await import('./auth.helpers');
  const visitor = await createAuthAccount(f.t, 'visitor');
  const read = () => visitor.auth.query(api.groups.currentEvent.getCurrentEvent, { groupId: f.groupId });
  await f.owner.auth.mutation(api.groupEventAudiences.mutations.shareEventWithGroup, { groupId: f.groupId, eventId: f.event.eventId });
  await f.t.run(ctx => ctx.db.patch(f.event.eventId, { visibility: 'PUBLIC', location: 'Private logistics', description: 'Detailed description', admissionPolicy: 'DIRECT' }));
  await expect(read()).rejects.toThrow(); // Public is not selected Group authority.
  const memberId = await f.t.run(ctx => ctx.db.insert('groupMemberships', { groupId: f.groupId, personId: visitor.personId, role: 'MEMBER', joinedAt: now }));
  expect(await read()).toMatchObject({ kind: 'event', event: { description: 'Detailed description', location: 'Private logistics', roster: null }, participation: null, allowedActions: ['groups.events.read'] });
  await f.t.run(async ctx => {
    await ctx.db.insert('memberships', { personId: visitor.personId, eventId: f.event.eventId, role: 'ATTENDEE', rsvpStatus: 'MAYBE' });
    await ctx.db.delete(memberId);
    await ctx.db.patch(f.event.eventId, { permissions: { viewAttendeeList: 'ORGANIZER' } });
  });
  expect(await read()).toMatchObject({ kind: 'event', event: { roster: null }, participation: { rsvp: 'MAYBE' } });
  const organizer = await f.read();
  expect(organizer.kind).toBe('event');
  expect(JSON.stringify(organizer)).not.toContain('@');
  expect(JSON.stringify(organizer)).not.toContain('answers');
});
it('lets only a current Organizer explicitly complete, replay and versioned reopen an Event', async () => {
  const f = await fixture();
  await f.owner.auth.mutation(api.groupEventAudiences.mutations.shareEventWithGroup, { groupId: f.groupId, eventId: f.event.eventId });
  const revision = (await f.owner.auth.query(api.events.lifecycleOperations.getLifecycle, { eventId: f.event.eventId })).revision;
  const intent = { eventId: f.event.eventId, operationId: crypto.randomUUID(), expectedRevision: revision, action: 'complete' as const };
  const receipt = await f.owner.auth.mutation(api.events.lifecycleOperations.setLifecycle, intent);
  expect(receipt).toMatchObject({ outcome: 'committed', result: { completed: true } });
  expect(await f.read()).toEqual({ kind: 'none' });
  expect(await f.owner.auth.mutation(api.events.lifecycleOperations.setLifecycle, intent)).toEqual(receipt);
  await expect(f.owner.auth.mutation(api.events.lifecycleOperations.setLifecycle, { ...intent, action: 'reopen' })).rejects.toThrow('different');
  await expect(f.owner.auth.mutation(api.events.mutations.chooseEventDate, { eventId: f.event.eventId, chosenDateTime: Date.now() + 100000 })).rejects.toThrow('Reopen');
  await expect(f.owner.auth.mutation(api.events.lifecycleOperations.setLifecycle, { ...intent, operationId: crypto.randomUUID(), action: 'reopen' })).rejects.toThrow('changed');
  const reopened = await f.owner.auth.mutation(api.events.lifecycleOperations.setLifecycle, { ...intent, operationId: crypto.randomUUID(), expectedRevision: receipt.result.revision, action: 'reopen' });
  expect(reopened.result.completed).toBe(false);
  expect(await f.read()).toMatchObject({ kind: 'event' });
  await f.t.run(ctx => ctx.db.patch(f.event.membershipId, { role: 'ATTENDEE' }));
  await expect(f.owner.auth.mutation(api.events.lifecycleOperations.setLifecycle, intent)).rejects.toThrow('ORGANIZER');
});
