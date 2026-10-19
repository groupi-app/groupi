import { afterEach, expect, it, vi } from 'vitest';
import { api } from '../_generated/api';
import { setup } from './delegated-protocol.helpers';

const now = Date.now();
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
async function fixture() {
  const f = await setup();
  const groupId = await f.owner.auth.mutation(
    api.groups.mutations.createGroup,
    { name: 'Reading Circle' }
  );
  const read = () =>
    f.owner.auth.query(api.groups.currentEvent.getCurrentEvent, { groupId });
  return { ...f, groupId, read };
}
it('returns absence, one undated Event, then a typed conflict instead of picking one', async () => {
  const f = await fixture();
  expect(await f.read()).toEqual({ kind: 'none' });
  await f.owner.auth.mutation(
    api.groupEventAudiences.mutations.shareEventWithGroup,
    { groupId: f.groupId, eventId: f.event.eventId }
  );
  expect(await f.read()).toMatchObject({
    kind: 'event',
    event: { id: f.event.eventId, endsAt: null },
    participation: { rsvp: 'YES' },
  });
  const second = await f.owner.auth.mutation(api.events.mutations.createEvent, {
    title: 'Second',
    potentialDateTimes: [],
  });
  await f.owner.auth.mutation(
    api.groupEventAudiences.mutations.shareEventWithGroup,
    { groupId: f.groupId, eventId: second.eventId }
  );
  expect(await f.read()).toEqual({
    kind: 'conflict',
    code: 'STAFF_CONFIGURATION_CONFLICT',
  });
  expect(
    await f.owner.auth.query(api.events.lifecycleOperations.getLifecycle, {
      eventId: f.event.eventId,
    })
  ).toMatchObject({
    audienceConflicts: [{ groupId: f.groupId, name: 'Reading Circle' }],
  });
});
it('uses the exact end boundary, keeping past starts without an end and undated Events active', async () => {
  const f = await fixture();
  vi.useFakeTimers();
  vi.setSystemTime(now);
  await f.owner.auth.mutation(
    api.groupEventAudiences.mutations.shareEventWithGroup,
    { groupId: f.groupId, eventId: f.event.eventId }
  );
  await f.t.run(ctx =>
    ctx.db.patch(f.event.eventId, {
      chosenDateTime: now - 1000,
      chosenEndDateTime: now,
    })
  );
  expect(await f.read()).toEqual({ kind: 'none' });
  await f.t.run(ctx =>
    ctx.db.patch(f.event.eventId, { chosenEndDateTime: undefined })
  );
  expect(await f.read()).toMatchObject({
    kind: 'event',
    event: { ongoing: true },
  });
  await f.t.run(ctx =>
    ctx.db.patch(f.event.eventId, { chosenDateTime: undefined })
  );
  expect(await f.read()).toMatchObject({
    kind: 'event',
    event: { ongoing: false },
  });
});
it('reads before Join for eligible Group members, hides roster, and preserves retained Event access after leaving', async () => {
  const f = await fixture();
  const { createAuthAccount } = await import('./auth.helpers');
  const visitor = await createAuthAccount(f.t, 'visitor');
  const read = () =>
    visitor.auth.query(api.groups.currentEvent.getCurrentEvent, {
      groupId: f.groupId,
    });
  await f.owner.auth.mutation(
    api.groupEventAudiences.mutations.shareEventWithGroup,
    { groupId: f.groupId, eventId: f.event.eventId }
  );
  await f.t.run(ctx =>
    ctx.db.patch(f.event.eventId, {
      visibility: 'PUBLIC',
      location: 'Private logistics',
      description: 'Detailed description',
      admissionPolicy: 'DIRECT',
    })
  );
  await expect(read()).rejects.toThrow(); // Public is not selected Group authority.
  const memberId = await f.t.run(ctx =>
    ctx.db.insert('groupMemberships', {
      groupId: f.groupId,
      personId: visitor.personId,
      role: 'MEMBER',
      joinedAt: now,
    })
  );
  expect(await read()).toMatchObject({
    kind: 'event',
    event: {
      description: 'Detailed description',
      location: 'Private logistics',
      roster: null,
    },
    participation: null,
    allowedActions: ['groups.events.read', 'groups.events.join'],
  });
  await f.t.run(async ctx => {
    await ctx.db.insert('memberships', {
      personId: visitor.personId,
      eventId: f.event.eventId,
      role: 'ATTENDEE',
      rsvpStatus: 'MAYBE',
    });
    await ctx.db.delete(memberId);
    await ctx.db.patch(f.event.eventId, {
      permissions: { viewAttendeeList: 'ORGANIZER' },
    });
  });
  expect(await read()).toMatchObject({
    kind: 'event',
    event: { roster: null },
    participation: { rsvp: 'MAYBE' },
  });
  const organizer = await f.read();
  expect(organizer.kind).toBe('event');
  expect(JSON.stringify(organizer)).not.toContain('@');
  expect(JSON.stringify(organizer)).not.toContain('answers');
});
it('lets only a current Organizer explicitly complete, replay and versioned reopen an Event', async () => {
  const f = await fixture();
  await f.owner.auth.mutation(
    api.groupEventAudiences.mutations.shareEventWithGroup,
    { groupId: f.groupId, eventId: f.event.eventId }
  );
  const revision = (
    await f.owner.auth.query(api.events.lifecycleOperations.getLifecycle, {
      eventId: f.event.eventId,
    })
  ).revision;
  const intent = {
    eventId: f.event.eventId,
    operationId: crypto.randomUUID(),
    expectedRevision: revision,
    action: 'complete' as const,
  };
  const receipt = await f.owner.auth.mutation(
    api.events.lifecycleOperations.setLifecycle,
    intent
  );
  expect(receipt).toMatchObject({
    outcome: 'committed',
    result: { completed: true },
  });
  expect(await f.read()).toEqual({ kind: 'none' });
  expect(
    await f.owner.auth.mutation(
      api.events.lifecycleOperations.setLifecycle,
      intent
    )
  ).toEqual(receipt);
  await expect(
    f.owner.auth.mutation(api.events.lifecycleOperations.setLifecycle, {
      ...intent,
      action: 'reopen',
    })
  ).rejects.toThrow('different');
  await expect(
    f.owner.auth.mutation(api.events.mutations.chooseEventDate, {
      eventId: f.event.eventId,
      chosenDateTime: Date.now() + 100000,
    })
  ).rejects.toThrow('Reopen');
  await expect(
    f.owner.auth.mutation(api.events.lifecycleOperations.setLifecycle, {
      ...intent,
      operationId: crypto.randomUUID(),
      action: 'reopen',
    })
  ).rejects.toThrow('changed');
  const reopened = await f.owner.auth.mutation(
    api.events.lifecycleOperations.setLifecycle,
    {
      ...intent,
      operationId: crypto.randomUUID(),
      expectedRevision: receipt.result.revision,
      action: 'reopen',
    }
  );
  expect(reopened.result.completed).toBe(false);
  expect(await f.read()).toMatchObject({ kind: 'event' });
  await f.t.run(ctx =>
    ctx.db.patch(f.event.membershipId, { role: 'ATTENDEE' })
  );
  await expect(
    f.owner.auth.mutation(api.events.lifecycleOperations.setLifecycle, intent)
  ).rejects.toThrow('ORGANIZER');
});
it('serves delegated selected Group HTTP reads with read-only scope and revokes access immediately', async () => {
  const f = await fixture();
  const { authorize, token, exchange } = await import(
    './delegated-protocol.helpers'
  );
  const approval = await authorize(f, {
    scopes: 'openid groups.events.read',
    actions: ['groups.events.read'],
    selector: { kind: 'selected-group', groupId: f.groupId },
    background: false,
  });
  const tokens = await (
    await token(f.t, exchange(f.appId, approval.code))
  ).json();
  const read = (groupId: string = f.groupId) =>
    f.t.fetch(`/api/v2/groups/${groupId}/current-event`, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
  expect(await (await read()).json()).toEqual({ kind: 'none' });
  await f.owner.auth.mutation(
    api.groupEventAudiences.mutations.shareEventWithGroup,
    { groupId: f.groupId, eventId: f.event.eventId }
  );
  const response = await read();
  expect(response.status, await response.clone().text()).toBe(200);
  expect(response.headers.get('cache-control')).toContain('no-store');
  expect(await response.json()).toEqual({
    ...(await f.read()),
    allowedActions: ['groups.events.read'],
    allowedRsvpTransitions: [],
  });
  expect((await read('guessed-private-id')).status).toBe(403);
  const connections = await f.owner.auth.query(
    api.delegatedApps.queries.listConnections,
    { now: Date.now() }
  );
  await f.owner.auth.mutation(api.delegatedApps.mutations.disconnect, {
    grantId: connections[0].grantId,
  });
  expect((await read()).status).toBe(401);
});
it('validates reschedule dates and requires explicit reactivation for completed audience/date writes', async () => {
  const f = await fixture();
  const readState = () =>
    f.owner.auth.query(api.events.lifecycleOperations.getLifecycle, {
      eventId: f.event.eventId,
    });
  const change = async (
    action: 'complete' | 'reopen' | 'reschedule',
    dates: { startsAt?: number | null; endsAt?: number | null } = {}
  ) =>
    f.owner.auth.mutation(api.events.lifecycleOperations.setLifecycle, {
      eventId: f.event.eventId,
      operationId: crypto.randomUUID(),
      expectedRevision: (await readState()).revision,
      action,
      ...dates,
    });
  await change('complete');
  await expect(
    change('reschedule', { startsAt: null, endsAt: Date.now() + 200000 })
  ).rejects.toThrow('requires a start');
  await expect(
    change('reschedule', {
      startsAt: Date.now() + 100000,
      endsAt: Date.now() + 50000,
    })
  ).rejects.toThrow('later end');
  await expect(
    f.owner.auth.mutation(
      api.groupEventAudiences.mutations.shareEventWithGroup,
      { groupId: f.groupId, eventId: f.event.eventId }
    )
  ).rejects.toThrow('Reopen');
  await expect(
    f.owner.auth.mutation(api.events.mutations.resetEventDate, {
      eventId: f.event.eventId,
    })
  ).rejects.toThrow('Reopen');
  await expect(
    f.owner.auth.mutation(api.events.mutations.updateEvent, {
      eventId: f.event.eventId,
      visibility: 'PUBLIC',
    })
  ).rejects.toThrow('Reopen');
  await expect(
    f.owner.auth.mutation(api.events.mutations.updateAdmissionPolicy, {
      eventId: f.event.eventId,
      admissionPolicy: 'DIRECT',
    })
  ).rejects.toThrow('Reopen');
  await change('reschedule', { startsAt: Date.now() + 100000, endsAt: null });
  expect(await readState()).toMatchObject({ completed: false, endsAt: null });
});
it('generated SDK retries a lost committed staff HTTP response without repeating completion and rejects revoked keys', async () => {
  const f = await fixture();
  const { components } = await import('../_generated/api');
  const { Groupi } = await import('../../packages/sdk/src/index.js');
  const rawKey = 'grp_lifecycle_test_key';
  const hash = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(rawKey)
  );
  const key = await f.t.mutation(components.betterAuth.adapter.create, {
    input: {
      model: 'apikey',
      data: {
        userId: f.owner.user._id,
        key: btoa(String.fromCharCode(...new Uint8Array(hash)))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, ''),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        enabled: true,
      },
    },
  });
  let loseResponse = true;
  vi.stubGlobal('window', undefined);
  vi.stubGlobal('fetch', async (url: string | URL, init?: RequestInit) => {
    const response = await f.t.fetch(new URL(String(url)).pathname, init);
    if (init?.method === 'POST' && response.ok && loseResponse) {
      loseResponse = false;
      throw new Error('Lost committed response');
    }
    return response;
  });
  const sdk = new Groupi({
    instance: 'https://some.convex.site',
    credential: { type: 'apiKey', key: rawKey },
  });
  const state = await sdk.readEventLifecycle({
    path: { eventId: f.event.eventId },
  });
  const intent = {
    path: { eventId: f.event.eventId },
    body: { action: 'complete' as const, expectedRevision: state.revision },
  };
  const options = { idempotencyKey: crypto.randomUUID() };
  await expect(sdk.updateEventLifecycle(intent, options)).rejects.toMatchObject(
    { code: 'TRANSPORT_ERROR', uncertain: true }
  );
  const receipt = await sdk.updateEventLifecycle(intent, options);
  expect(receipt).toMatchObject({
    outcome: 'committed',
    result: { completed: true },
  });
  expect(await sdk.updateEventLifecycle(intent, options)).toEqual(receipt);
  await f.t.mutation(components.betterAuth.adapter.updateOne, {
    input: {
      model: 'apikey',
      where: [{ field: '_id', value: key._id }],
      update: { enabled: false },
    },
  });
  await expect(sdk.updateEventLifecycle(intent, options)).rejects.toMatchObject(
    { status: 401 }
  );
});
