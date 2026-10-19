import { afterEach, expect, it, vi } from 'vitest';
import { api } from '../_generated/api';
import { applicant } from './community-applications.helpers';
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});
const actions = [
  'groups.context.read',
  'groups.events.read',
  'groups.events.join',
  'groups.events.rsvp',
  'groups.events.leave',
  'groups.leave',
] as const;
async function fixture() {
  const f = await applicant(actions);
  await f.t.run(ctx =>
    ctx.db.insert('groupMemberships', {
      groupId: f.groupId,
      personId: f.owner.personId,
      role: 'MEMBER',
      joinedAt: Date.now(),
    })
  );
  await f.owner.auth.mutation(api.events.mutations.updateAdmissionPolicy, {
    eventId: f.event.eventId,
    admissionPolicy: 'DIRECT',
  });
  await f.t.run(ctx =>
    ctx.db.insert('memberships', {
      eventId: f.event.eventId,
      personId: f.staff.personId,
      role: 'ORGANIZER',
      rsvpStatus: 'YES',
    })
  );
  await f.staff.auth.mutation(
    api.groupEventAudiences.mutations.shareEventWithGroup,
    { groupId: f.groupId, eventId: f.event.eventId }
  );
  // The applicant starts outside this independently owned Event.
  await f.owner.auth.mutation(api.events.mutations.leaveEvent, {
    eventId: f.event.eventId,
  });
  return f;
}
it('Join creates Pending; explicit RSVP sets Yes and replay never resets it', async () => {
  const f = await fixture();
  const path = `events/${f.event.eventId}`;
  const operationId = crypto.randomUUID();
  const joined = await f.request(`${path}/join`, 'POST', {}, operationId);
  expect(joined.status, await joined.clone().text()).toBe(200);
  expect(await joined.json()).toMatchObject({
    outcome: 'committed',
    result: { participation: { rsvp: 'PENDING' } },
  });
  const current = await (await f.request('current-event')).json();
  expect(current.allowedRsvpTransitions).toEqual([
    'PENDING',
    'YES',
    'NO',
    'MAYBE',
  ]);
  const yes = await f.request(`${path}/own-rsvp`, 'PUT', {
    expectedRevision: current.participation.revision,
    rsvp: 'YES',
  });
  expect(yes.status, await yes.clone().text()).toBe(200);
  expect(await yes.json()).toMatchObject({
    result: { participation: { rsvp: 'YES' } },
  });
  expect(
    (await f.request(`${path}/join`, 'POST', {}, operationId)).status
  ).toBe(200);
  expect(await (await f.request('current-event')).json()).toMatchObject({
    participation: { rsvp: 'YES' },
  });
});
it('Event leave replays its committed receipt but a fresh stale intent cannot erase same-millisecond replacement membership', async () => {
  const f = await fixture();
  vi.useFakeTimers();
  vi.setSystemTime(Date.now());
  const path = `events/${f.event.eventId}`;
  await f.request(`${path}/join`, 'POST', {});
  const first = await (await f.request('current-event')).json();
  const body = { expectedRevision: first.participation.revision };
  const operationId = crypto.randomUUID();
  const left = await f.request(`${path}/leave`, 'POST', body, operationId);
  expect(left.status).toBe(200);
  const receipt = await left.json();
  expect(
    await (await f.request(`${path}/leave`, 'POST', body, operationId)).json()
  ).toEqual(receipt);
  await f.owner.auth.mutation(api.events.mutations.joinDiscoverableEvent, {
    eventId: f.event.eventId,
  });
  const replacement = await (await f.request('current-event')).json();
  expect(replacement.participation.revision).not.toBe(
    first.participation.revision
  );
  expect(
    await (await f.request(`${path}/leave`, 'POST', body, operationId)).json()
  ).toEqual(receipt);
  const stale = await f.request(`${path}/leave`, 'POST', body);
  expect(stale.status).toBe(409);
  expect(await stale.json()).toMatchObject({
    error: { code: 'STALE_REVISION' },
  });
  expect(await (await f.request('current-event')).json()).toMatchObject({
    participation: { membershipId: replacement.participation.membershipId },
  });
});
it('Group leave preserves Event and RSVP, original replay ignores replacement, and departed audience cannot newly Join', async () => {
  const f = await fixture();
  const path = `events/${f.event.eventId}`;
  await f.request(`${path}/join`, 'POST', {});
  const before = await (await f.request('current-event')).json();
  await f.request(`${path}/own-rsvp`, 'PUT', {
    expectedRevision: before.participation.revision,
    rsvp: 'YES',
  });
  const context = await f.read();
  const body = { expectedMembershipId: context.membership.membershipId };
  const operationId = crypto.randomUUID();
  const left = await f.request('community-leave', 'POST', body, operationId);
  expect(left.status).toBe(200);
  const receipt = await left.json();
  expect(await f.read()).toMatchObject({ membership: null });
  expect(await (await f.request('current-event')).json()).toMatchObject({
    participation: { rsvp: 'YES' },
  });
  expect(
    await (await f.request('community-leave', 'POST', body, operationId)).json()
  ).toEqual(receipt);
  const membershipId = await f.t.run(ctx =>
    ctx.db.insert('groupMemberships', {
      groupId: f.groupId,
      personId: f.owner.personId,
      role: 'MEMBER',
      joinedAt: Date.now(),
    })
  );
  expect(
    await (await f.request('community-leave', 'POST', body, operationId)).json()
  ).toEqual(receipt);
  expect((await f.read()).membership.membershipId).toBe(membershipId);
  expect((await f.request('community-leave', 'POST', body)).status).toBe(409);
  const departure = await f.request('community-leave', 'POST', {
    expectedMembershipId: membershipId,
  });
  expect(departure.status).toBe(200);
  const retained = await (await f.request('current-event')).json();
  expect(
    (
      await f.request(`${path}/leave`, 'POST', {
        expectedRevision: retained.participation.revision,
      })
    ).status
  ).toBe(200);
  expect((await f.request(`${path}/join`, 'POST', {})).status).toBe(403);
});
it('rejects stale RSVP after a native edit, duplicate RSVP replays once, and binds payloads', async () => {
  const f = await fixture();
  const path = `events/${f.event.eventId}`;
  await f.request(`${path}/join`, 'POST', {});
  const before = await (await f.request('current-event')).json();
  await f.owner.auth.mutation(api.events.mutations.updateRSVP, {
    eventId: f.event.eventId,
    rsvpStatus: 'MAYBE',
  });
  const stale = await f.request(`${path}/own-rsvp`, 'PUT', {
    expectedRevision: before.participation.revision,
    rsvp: 'YES',
  });
  expect(stale.status).toBe(409);
  const current = await (await f.request('current-event')).json();
  const body = { expectedRevision: current.participation.revision, rsvp: 'NO' };
  const id = crypto.randomUUID();
  const first = await f.request(`${path}/own-rsvp`, 'PUT', body, id);
  expect(first.status).toBe(200);
  const receipt = await first.json();
  expect(
    await (await f.request(`${path}/own-rsvp`, 'PUT', body, id)).json()
  ).toEqual(receipt);
  expect(
    (await f.request(`${path}/own-rsvp`, 'PUT', { ...body, rsvp: 'YES' }, id))
      .status
  ).toBe(409);
  expect(
    (await (await f.request('current-event')).json()).participation.revision
  ).toBe(receipt.result.participation.revision);
});
it('enforces typed Group owner and last Event Organizer safeguards through native and delegated boundaries', async () => {
  const f = await fixture();
  const context = await f.staff.auth.query(api.groups.queries.getGroup, {
    groupId: f.groupId,
  });
  expect(context).not.toBeNull();
  const ownerMember = await f.t.run(ctx =>
    ctx.db
      .query('groupMemberships')
      .withIndex('by_groupId_and_personId', q =>
        q.eq('groupId', f.groupId).eq('personId', f.staff.personId)
      )
      .unique()
  );
  await expect(
    f.staff.auth.mutation(api.groups.communityParticipation.participate, {
      groupId: f.groupId,
      operation: 'leave-group',
      bodyJson: JSON.stringify({ expectedMembershipId: ownerMember!._id }),
      operationId: crypto.randomUUID(),
    })
  ).rejects.toThrow(/PROTECTED_OWNER/);
  const ownerEvent = await f.staff.auth.query(
    api.groups.currentEvent.getCurrentEvent,
    { groupId: f.groupId }
  );
  expect(ownerEvent.kind).toBe('event');
  if (ownerEvent.kind !== 'event') throw new Error('Event required');
  expect(ownerEvent.allowedActions).not.toContain('groups.events.leave');
  await expect(
    f.staff.auth.mutation(api.groups.communityParticipation.participate, {
      groupId: f.groupId,
      eventId: f.event.eventId,
      operation: 'leave-event',
      bodyJson: JSON.stringify({
        expectedRevision: ownerEvent.participation!.revision,
      }),
      operationId: crypto.randomUUID(),
    })
  ).rejects.toThrow(/PROTECTED_ORGANIZER/);
});
it('checks current admission and exact scope, hides unrelated Events, and returns no private read projection for write-only Join', async () => {
  const f = await fixture();
  const path = `events/${f.event.eventId}`;
  await f.staff.auth.mutation(api.events.mutations.updateAdmissionPolicy, {
    eventId: f.event.eventId,
    admissionPolicy: 'APPLY',
  });
  expect((await f.request(`${path}/join`, 'POST', {})).status).toBe(403);
  await f.staff.auth.mutation(api.events.mutations.updateAdmissionPolicy, {
    eventId: f.event.eventId,
    admissionPolicy: 'DIRECT',
  });
  expect(
    (
      await f.request('events/guessed/own-rsvp', 'PUT', {
        expectedRevision: 1,
        rsvp: 'YES',
      })
    ).status
  ).toBe(403);
  const receipts = await f.t.run(ctx =>
    ctx.db.query('authorizationCredentials').collect()
  );
  const credential = receipts.find(c => c.kind === 'delegated-access');
  if (!credential) throw new Error('Credential required');
  await f.t.run(ctx =>
    ctx.db.patch(credential._id, { actions: ['groups.events.join'] })
  );
  const joined = await f.request(`${path}/join`, 'POST', {});
  expect(joined.status).toBe(200);
  const result = await joined.json();
  expect(Object.keys(result.result).sort()).toEqual([
    'eventId',
    'participation',
  ]);
  expect(JSON.stringify(result)).not.toMatch(
    /location|roster|description|answers|personId/
  );
  expect((await f.request('current-event')).status).toBe(403);
  const opId = result.operationId;
  await f.t.run(ctx =>
    ctx.db.patch(credential.grantId, { revokedAt: Date.now() })
  );
  expect((await f.request(`${path}/join`, 'POST', {}, opId)).status).toBe(401);
});
it('allows one revision-bound RSVP intent to win a race and never repeats a committed transition', async () => {
  const f = await fixture();
  const path = `events/${f.event.eventId}`;
  await f.request(`${path}/join`, 'POST', {});
  const current = await (await f.request('current-event')).json();
  const intents = ['YES', 'NO'].map(rsvp => ({
    body: { expectedRevision: current.participation.revision, rsvp },
    id: crypto.randomUUID(),
  }));
  const responses = await Promise.all(
    intents.map(i => f.request(`${path}/own-rsvp`, 'PUT', i.body, i.id))
  );
  expect(responses.map(r => r.status).sort()).toEqual([200, 409]);
  const won = responses.findIndex(r => r.status === 200);
  const receipt = await responses[won].json();
  expect(
    await (
      await f.request(
        `${path}/own-rsvp`,
        'PUT',
        intents[won].body,
        intents[won].id
      )
    ).json()
  ).toEqual(receipt);
  expect(
    (await (await f.request('current-event')).json()).participation
  ).toEqual(receipt.result.participation);
});
it('expires a recognized leave receipt without permitting a new destructive write from its old operation ID', async () => {
  const f = await fixture();
  const path = `events/${f.event.eventId}`;
  await f.request(`${path}/join`, 'POST', {});
  const current = await (await f.request('current-event')).json();
  const body = { expectedRevision: current.participation.revision };
  const id = crypto.randomUUID();
  expect((await f.request(`${path}/leave`, 'POST', body, id)).status).toBe(200);
  await f.request(`${path}/join`, 'POST', {});
  // Historical receipt fixture keeps live credential lifetime independent.
  await f.t.run(async ctx => {
    const receipt = await ctx.db
      .query('communityOperationReceipts')
      .withIndex('by_operationId', q => q.eq('operationId', id))
      .unique();
    await ctx.db.patch(receipt!._id, {
      acceptedAt: Date.now() - 31 * 24 * 60 * 60 * 1000,
      expiresAt: Date.now() - 1,
    });
  });
  const expired = await f.request(`${path}/leave`, 'POST', body, id);
  expect(expired.status, await expired.clone().text()).toBe(409);
  expect(await expired.json()).toMatchObject({
    error: { code: 'IDEMPOTENCY_EXPIRED' },
  });
  expect(await (await f.request('current-event')).json()).toMatchObject({
    participation: { rsvp: 'PENDING' },
  });
});
it('checks coordinated exclusion before replay and atomically denies fresh Join or RSVP through alternate audiences', async () => {
  const f = await fixture();
  const path = `events/${f.event.eventId}`;
  const id = crypto.randomUUID();
  expect((await f.request(`${path}/join`, 'POST', {}, id)).status).toBe(200);
  const current = await (await f.request('current-event')).json();
  await f.staff.auth.mutation(api.groups.expulsions.expel, {
    groupId: f.groupId,
    personId: f.owner.personId,
    operationId: crypto.randomUUID(),
  });
  expect((await f.request(`${path}/join`, 'POST', {}, id)).status).toBe(403);
  expect(
    (
      await f.request(`${path}/own-rsvp`, 'PUT', {
        expectedRevision: current.participation.revision,
        rsvp: 'YES',
      })
    ).status
  ).toBe(403);
  expect((await f.request(`${path}/join`, 'POST', {})).status).toBe(403);
  expect((await f.request('current-event')).status).toBe(403);
  expect((await f.read()).allowedActions).not.toContain('groups.leave');
});
it('preserves independent Event RSVP and departure after ordinary Group ban, while denying a new audience Join', async () => {
  const f = await fixture();
  const path = `events/${f.event.eventId}`;
  expect((await f.request(`${path}/join`, 'POST', {})).status).toBe(200);
  await f.staff.auth.mutation(api.groupModeration.mutations.banGroupPerson, {
    groupId: f.groupId,
    personId: f.owner.personId,
  });
  const retained = await (await f.request('current-event')).json();
  expect(retained).toMatchObject({ participation: { rsvp: 'PENDING' } });
  const yes = await f.request(`${path}/own-rsvp`, 'PUT', {
    expectedRevision: retained.participation.revision,
    rsvp: 'YES',
  });
  expect(yes.status, await yes.clone().text()).toBe(200);
  const changed = await yes.json();
  expect(
    (
      await f.request(`${path}/leave`, 'POST', {
        expectedRevision: changed.result.participation.revision,
      })
    ).status
  ).toBe(200);
  expect((await f.request(`${path}/join`, 'POST', {})).status).toBe(403);
});
