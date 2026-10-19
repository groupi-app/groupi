import { afterEach, expect, it, vi } from 'vitest';
import { api } from '../_generated/api';
import { setup } from './delegated-protocol.helpers';
import { createAuthAccount } from './auth.helpers';
afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});
it('commits exclusion despite independent Event authority blocking cleanup, replaying one durable intent', async () => {
  const f = await setup();
  const target = await createAuthAccount(f.t, 'expelled');
  const groupId = await f.owner.auth.mutation(
    api.groups.mutations.createGroup,
    { name: 'Reading Circle' }
  );
  await f.owner.auth.mutation(
    api.groupEventAudiences.mutations.shareEventWithGroup,
    { groupId, eventId: f.event.eventId }
  );
  await f.t.run(async ctx => {
    await ctx.db.insert('memberships', {
      eventId: f.event.eventId,
      personId: target.personId,
      role: 'ATTENDEE',
      rsvpStatus: 'YES',
    });
  });
  const intent = {
    groupId,
    personId: target.personId,
    operationId: crypto.randomUUID(),
  };
  const result = await f.owner.auth.mutation(
    api.groups.expulsions.expel,
    intent
  );
  expect(result).toMatchObject({
    outcome: 'committed',
    exclusion: 'active',
    cleanup: 'pending',
    generation: 1,
  });
  expect(
    await f.owner.auth.mutation(api.groups.expulsions.expel, intent)
  ).toEqual(result);
  await expect(
    target.auth.query(api.events.queries.getEventHeader, {
      eventId: f.event.eventId,
    })
  ).rejects.toThrow();
  expect(
    await f.owner.auth.query(api.groups.expulsions.progress, {
      groupId,
      personId: target.personId,
    })
  ).toMatchObject({ exclusion: 'active', cleanup: 'pending', generation: 1 });
});
it('blocks alternate audience and stale invitation routes while preserving completed history and owner safeguards', async () => {
  const f = await setup();
  const target = await createAuthAccount(f.t, 'history');
  const groupId = await f.owner.auth.mutation(
    api.groups.mutations.createGroup,
    { name: 'Reading Circle' }
  );
  await f.owner.auth.mutation(
    api.groupEventAudiences.mutations.shareEventWithGroup,
    { groupId, eventId: f.event.eventId }
  );
  const invite = await f.owner.auth.mutation(
    api.invites.mutations.createInvite,
    { eventId: f.event.eventId }
  );
  await f.t.run(ctx =>
    ctx.db.insert('memberships', {
      eventId: f.event.eventId,
      personId: target.personId,
      role: 'ATTENDEE',
      rsvpStatus: 'YES',
    })
  );
  const intent = {
    groupId,
    personId: target.personId,
    operationId: crypto.randomUUID(),
  };
  await f.t.run(async ctx => {
    const m = await ctx.db
      .query('memberships')
      .withIndex('by_person_event', q =>
        q.eq('personId', f.owner.personId).eq('eventId', f.event.eventId)
      )
      .first();
    if (m) await ctx.db.delete(m._id);
  });
  expect(
    await f.owner.auth.mutation(api.groups.expulsions.expel, intent)
  ).toMatchObject({
    cleanup: 'blocked',
    conflicts: [{ code: 'EVENT_AUTHORITY_REQUIRED' }],
  });
  await expect(
    target.auth.mutation(api.invites.mutations.acceptInvite, {
      token: invite.invite.token,
    })
  ).rejects.toThrow();
  await expect(
    target.auth.mutation(api.events.mutations.updateRSVP, {
      eventId: f.event.eventId,
      rsvpStatus: 'NO',
    })
  ).rejects.toThrow();
  await expect(
    f.owner.auth.mutation(api.groups.expulsions.expel, {
      ...intent,
      personId: f.owner.personId,
      operationId: crypto.randomUUID(),
    })
  ).rejects.toThrow('PROTECTED_OWNER');
  await f.t.run(async ctx => {
    await ctx.db.patch(f.event.eventId, { completedAt: Date.now() });
  });
  expect(
    await target.auth.query(api.events.queries.getEventHeader, {
      eventId: f.event.eventId,
    })
  ).toHaveProperty('event');
  await expect(
    f.owner.auth.mutation(api.groups.expulsions.expel, {
      ...intent,
      personId: f.owner.personId,
    })
  ).rejects.toThrow();
});
it('SDK staff HTTP reconciles lost responses and rejects payload reuse and revoked credentials', async () => {
  const f = await setup();
  const target = await createAuthAccount(f.t, 'http-expelled');
  const groupId = await f.owner.auth.mutation(
    api.groups.mutations.createGroup,
    { name: 'Reading Circle' }
  );
  const { components } = await import('../_generated/api');
  const rawKey = 'grp_expulsion_staff_http_test';
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(rawKey)
  );
  const key = await f.t.mutation(components.betterAuth.adapter.create, {
    input: {
      model: 'apikey',
      data: {
        userId: f.owner.user._id,
        key: btoa(String.fromCharCode(...new Uint8Array(digest)))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, ''),
        enabled: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    },
  });
  const { Groupi } = await import('../../packages/sdk/src/index.js');
  vi.stubGlobal('window', undefined);
  let lost = true;
  vi.stubGlobal('fetch', async (url: string | URL, init?: RequestInit) => {
    const response = await f.t.fetch(new URL(String(url)).pathname, init);
    if (new URL(String(url)).pathname.includes('coordinated-expulsions'))
      expect(response.headers.get('cache-control')).toBe('private, no-store');
    if (init?.method === 'POST' && response.ok && lost) {
      lost = false;
      throw new Error('Lost response');
    }
    return response;
  });
  const sdk = new Groupi({
    instance: 'https://some.convex.site',
    credential: { type: 'apiKey', key: rawKey },
  });
  const input = {
    path: { groupId },
    body: { personId: target.personId, policy: 'coordinated' as const },
  };
  const options = { idempotencyKey: crypto.randomUUID() };
  await expect(sdk.expelCommunityMember(input, options)).rejects.toMatchObject({
    uncertain: true,
  });
  const result = await sdk.expelCommunityMember(input, options);
  expect(result).toMatchObject({
    exclusion: 'active',
    cleanup: 'pending',
    generation: 1,
  });
  expect(
    await sdk.readCommunityExpulsion({
      path: { groupId, personId: target.personId },
    })
  ).toEqual(result);
  await expect(
    sdk.expelCommunityMember(
      { ...input, body: { ...input.body, personId: f.owner.personId } },
      options
    )
  ).rejects.toThrow();
  const resolutionInput = {
    path: { groupId, personId: target.personId },
    body: { generation: result.generation },
  };
  lost = true;
  const resumeOptions = { idempotencyKey: crypto.randomUUID() };
  await expect(
    sdk.resumeCommunityExpulsion(resolutionInput, resumeOptions)
  ).rejects.toMatchObject({ uncertain: true });
  expect(
    await sdk.resumeCommunityExpulsion(resolutionInput, resumeOptions)
  ).toMatchObject({ cleanup: 'complete', exclusion: 'active' });
  const reinstateOptions = { idempotencyKey: crypto.randomUUID() };
  lost = true;
  await expect(
    sdk.reinstateCommunityMember(resolutionInput, reinstateOptions)
  ).rejects.toMatchObject({ uncertain: true });
  expect(
    await sdk.reinstateCommunityMember(resolutionInput, reinstateOptions)
  ).toMatchObject({ cleanup: 'complete', exclusion: 'inactive' });
  await f.t.mutation(components.betterAuth.adapter.updateOne, {
    input: {
      model: 'apikey',
      where: [{ field: '_id', operator: 'eq', value: key._id }],
      update: { enabled: false },
    },
  });
  await expect(sdk.expelCommunityMember(input, options)).rejects.toThrow();
});
it('captured audiences cannot evade exclusion through withdrawal, Public access, or completed Event reactivation', async () => {
  const f = await setup();
  const target = await createAuthAccount(f.t, 'reactivated');
  const groupId = await f.owner.auth.mutation(
    api.groups.mutations.createGroup,
    { name: 'Reading Circle' }
  );
  await f.owner.auth.mutation(
    api.groupEventAudiences.mutations.shareEventWithGroup,
    { groupId, eventId: f.event.eventId }
  );
  await f.t.run(ctx =>
    ctx.db.insert('memberships', {
      eventId: f.event.eventId,
      personId: target.personId,
      role: 'ATTENDEE',
      rsvpStatus: 'YES',
    })
  );
  await f.owner.auth.mutation(api.groups.expulsions.expel, {
    groupId,
    personId: target.personId,
    operationId: crypto.randomUUID(),
  });
  await f.owner.auth.mutation(
    api.groupEventAudiences.mutations.withdrawGroupEventAudience,
    { groupId, eventId: f.event.eventId }
  );
  await f.t.run(ctx =>
    ctx.db.patch(f.event.eventId, {
      visibility: 'PUBLIC',
      completedAt: Date.now(),
    })
  );
  expect(
    await target.auth.query(api.events.queries.getEventHeader, {
      eventId: f.event.eventId,
    })
  ).toHaveProperty('event');
  const state = await f.owner.auth.query(
    api.events.lifecycleOperations.getLifecycle,
    { eventId: f.event.eventId }
  );
  await f.owner.auth.mutation(api.events.lifecycleOperations.setLifecycle, {
    eventId: f.event.eventId,
    action: 'reopen',
    expectedRevision: state.revision,
    operationId: crypto.randomUUID(),
  });
  await expect(
    target.auth.query(api.events.queries.getEventHeader, {
      eventId: f.event.eventId,
    })
  ).rejects.toThrow();
});
it('retains protected Organizer identity and reports actionable cleanup conflict without granting Group owner Event authority', async () => {
  const f = await setup();
  const staff = await createAuthAccount(f.t, 'staff');
  const groupId = await staff.auth.mutation(api.groups.mutations.createGroup, {
    name: 'Reading Circle',
  });
  await f.t.run(ctx =>
    ctx.db.insert('groupMemberships', {
      groupId,
      personId: f.owner.personId,
      role: 'MODERATOR',
      joinedAt: Date.now(),
    })
  );
  await f.owner.auth.mutation(
    api.groupEventAudiences.mutations.shareEventWithGroup,
    { groupId, eventId: f.event.eventId }
  );
  const result = await staff.auth.mutation(api.groups.expulsions.expel, {
    groupId,
    personId: f.owner.personId,
    operationId: crypto.randomUUID(),
  });
  expect(result).toMatchObject({
    exclusion: 'active',
    cleanup: 'blocked',
    conflicts: [{ code: 'PROTECTED_ORGANIZER' }],
  });
  await expect(
    staff.auth.mutation(api.events.mutations.deleteEvent, {
      eventId: f.event.eventId,
    })
  ).rejects.toThrow();
});
it('serializes exclusion against concurrent Join and fences future audience Events after withdrawal', async () => {
  const f = await setup();
  const target = await createAuthAccount(f.t, 'race');
  const groupId = await f.owner.auth.mutation(
    api.groups.mutations.createGroup,
    { name: 'Reading Circle' }
  );
  await f.owner.auth.mutation(
    api.groupEventAudiences.mutations.shareEventWithGroup,
    { groupId, eventId: f.event.eventId }
  );
  await f.t.run(ctx =>
    ctx.db.patch(f.event.eventId, {
      visibility: 'PUBLIC',
      admissionPolicy: 'DIRECT',
    })
  );
  const results = await Promise.allSettled([
    f.owner.auth.mutation(api.groups.expulsions.expel, {
      groupId,
      personId: target.personId,
      operationId: crypto.randomUUID(),
    }),
    target.auth.mutation(api.events.mutations.joinDiscoverableEvent, {
      eventId: f.event.eventId,
    }),
  ]);
  expect(results[0].status).toBe('fulfilled');
  await expect(
    target.auth.mutation(api.events.mutations.updateRSVP, {
      eventId: f.event.eventId,
      rsvpStatus: 'YES',
    })
  ).rejects.toThrow();
  const future = await f.owner.auth.mutation(api.events.mutations.createEvent, {
    title: 'Future',
    potentialDateTimes: [],
  });
  await f.t.run(ctx =>
    ctx.db.patch(future.eventId, {
      visibility: 'PUBLIC',
      admissionPolicy: 'DIRECT',
      chosenDateTime: Date.now() + 86400000,
    })
  );
  await f.owner.auth.mutation(
    api.groupEventAudiences.mutations.shareEventWithGroup,
    { groupId, eventId: future.eventId }
  );
  await f.owner.auth.mutation(
    api.groupEventAudiences.mutations.withdrawGroupEventAudience,
    { groupId, eventId: future.eventId }
  );
  await expect(
    target.auth.mutation(api.events.mutations.joinDiscoverableEvent, {
      eventId: future.eventId,
    })
  ).rejects.toThrow();
});
it('serializes concurrent ongoing RSVP and invitation acceptance against committed exclusion', async () => {
  const f = await setup();
  const target = await createAuthAccount(f.t, 'rsvp-race');
  const invited = await createAuthAccount(f.t, 'invite-race');
  const groupId = await f.owner.auth.mutation(
    api.groups.mutations.createGroup,
    { name: 'Reading Circle' }
  );
  await f.owner.auth.mutation(
    api.groupEventAudiences.mutations.shareEventWithGroup,
    { groupId, eventId: f.event.eventId }
  );
  await f.t.run(async ctx => {
    await ctx.db.patch(f.event.eventId, { chosenDateTime: Date.now() - 1000 });
    await ctx.db.insert('memberships', {
      eventId: f.event.eventId,
      personId: target.personId,
      role: 'ATTENDEE',
      rsvpStatus: 'PENDING',
    });
  });
  const invite = await f.owner.auth.mutation(
    api.invites.mutations.createInvite,
    { eventId: f.event.eventId }
  );
  const rsvp = await Promise.allSettled([
    f.owner.auth.mutation(api.groups.expulsions.expel, {
      groupId,
      personId: target.personId,
      operationId: crypto.randomUUID(),
    }),
    target.auth.mutation(api.events.mutations.updateRSVP, {
      eventId: f.event.eventId,
      rsvpStatus: 'YES',
    }),
  ]);
  const acceptance = await Promise.allSettled([
    f.owner.auth.mutation(api.groups.expulsions.expel, {
      groupId,
      personId: invited.personId,
      operationId: crypto.randomUUID(),
    }),
    invited.auth.mutation(api.invites.mutations.acceptInvite, {
      token: invite.invite.token,
    }),
  ]);
  expect(rsvp[0].status).toBe('fulfilled');
  expect(acceptance[0].status).toBe('fulfilled');
  await expect(
    target.auth.query(api.events.queries.getEventHeader, {
      eventId: f.event.eventId,
    })
  ).rejects.toThrow();
  await expect(
    invited.auth.query(api.events.queries.getEventHeader, {
      eventId: f.event.eventId,
    })
  ).rejects.toThrow();
});

it('rejects deleted targets before creating an orphan exclusion', async () => {
  const f = await setup();
  const target = await createAuthAccount(f.t, 'deleted-target');
  const groupId = await f.owner.auth.mutation(
    api.groups.mutations.createGroup,
    { name: 'Reading Circle' }
  );
  await f.t.run(ctx => ctx.db.delete(target.personId));
  await expect(
    f.owner.auth.mutation(api.groups.expulsions.expel, {
      groupId,
      personId: target.personId,
      operationId: crypto.randomUUID(),
    })
  ).rejects.toThrow('RECIPIENT_UNAVAILABLE');
  expect(
    await f.owner.auth.query(api.groups.expulsions.progress, {
      groupId,
      personId: target.personId,
    })
  ).toBeNull();
});

it('resumes captured participation cleanup and reinstates without restoring Group or Event admission', async () => {
  const f = await setup();
  const target = await createAuthAccount(f.t, 'resume');
  const groupId = await f.owner.auth.mutation(
    api.groups.mutations.createGroup,
    { name: 'Reading Circle' }
  );
  await f.owner.auth.mutation(
    api.groupEventAudiences.mutations.shareEventWithGroup,
    { groupId, eventId: f.event.eventId }
  );
  await f.t.run(async ctx => {
    await ctx.db.insert('groupMemberships', {
      groupId,
      personId: target.personId,
      role: 'MEMBER',
      joinedAt: Date.now(),
    });
    await ctx.db.insert('memberships', {
      eventId: f.event.eventId,
      personId: target.personId,
      role: 'ATTENDEE',
      rsvpStatus: 'YES',
    });
  });
  const input = { groupId, personId: target.personId };
  const expelled = await f.owner.auth.mutation(api.groups.expulsions.expel, {
    ...input,
    operationId: crypto.randomUUID(),
  });
  await expect(
    f.owner.auth.mutation(api.groups.expulsions.reinstate, {
      ...input,
      generation: expelled.generation,
      operationId: crypto.randomUUID(),
    })
  ).rejects.toThrow('CLEANUP_REQUIRED');
  await f.owner.auth.mutation(
    api.groupEventAudiences.mutations.withdrawGroupEventAudience,
    { groupId, eventId: f.event.eventId }
  );
  const intent = {
    ...input,
    generation: expelled.generation,
    operationId: crypto.randomUUID(),
  };
  const resumed = await f.owner.auth.mutation(
    api.groups.expulsions.resume,
    intent
  );
  expect(resumed).toMatchObject({
    cleanup: 'complete',
    events: [{ eventId: f.event.eventId, state: 'complete' }],
  });
  expect(
    await f.owner.auth.mutation(api.groups.expulsions.resume, intent)
  ).toEqual(resumed);
  expect(
    await f.owner.auth.mutation(api.groups.expulsions.reinstate, {
      ...input,
      generation: expelled.generation,
      operationId: crypto.randomUUID(),
    })
  ).toMatchObject({ exclusion: 'inactive', cleanup: 'complete' });
  const rows = await f.t.run(async ctx => ({
    groups: await ctx.db
      .query('groupMemberships')
      .withIndex('by_personId', q => q.eq('personId', target.personId))
      .collect(),
    events: await ctx.db
      .query('memberships')
      .withIndex('by_person_event', q =>
        q.eq('personId', target.personId).eq('eventId', f.event.eventId)
      )
      .collect(),
  }));
  expect(rows).toEqual({ groups: [], events: [] });
  await expect(
    f.owner.auth.mutation(api.groups.expulsions.resume, {
      ...intent,
      operationId: crypto.randomUUID(),
    })
  ).rejects.toThrow('STALE_GENERATION');
});

it('reports partial blocked cleanup, refuses reinstatement and Group deletion, then resumes under current authority', async () => {
  const f = await setup();
  const target = await createAuthAccount(f.t, 'partial');
  const staff = await createAuthAccount(f.t, 'partial-staff');
  const groupId = await staff.auth.mutation(api.groups.mutations.createGroup, {
    name: 'Room',
  });
  await f.t.run(ctx =>
    ctx.db.insert('groupMemberships', {
      groupId,
      personId: f.owner.personId,
      role: 'MODERATOR',
      joinedAt: Date.now(),
    })
  );
  await f.owner.auth.mutation(
    api.groupEventAudiences.mutations.shareEventWithGroup,
    { groupId, eventId: f.event.eventId }
  );
  await f.t.run(async ctx => {
    await ctx.db.insert('memberships', {
      eventId: f.event.eventId,
      personId: target.personId,
      role: 'ATTENDEE',
      rsvpStatus: 'YES',
    });
    await ctx.db.insert('eventInvites', {
      eventId: f.event.eventId,
      inviterId: f.owner.personId,
      inviteeId: target.personId,
      role: 'ATTENDEE',
      status: 'PENDING',
      createdAt: Date.now(),
    });
    await ctx.db.insert('groupInvites', {
      groupId,
      inviterId: staff.personId,
      inviteeId: target.personId,
      status: 'PENDING',
      createdAt: Date.now(),
    });
  });
  const input = { groupId, personId: target.personId, generation: 1 };
  await staff.auth.mutation(api.groups.expulsions.expel, {
    groupId,
    personId: target.personId,
    operationId: crypto.randomUUID(),
  });
  expect(
    await staff.auth.mutation(api.groups.expulsions.resume, {
      ...input,
      operationId: crypto.randomUUID(),
    })
  ).toMatchObject({
    cleanup: 'blocked',
    events: [{ state: 'blocked', code: 'EVENT_AUTHORITY_REQUIRED' }],
  });
  await expect(
    staff.auth.mutation(api.groups.expulsions.reinstate, {
      ...input,
      operationId: crypto.randomUUID(),
    })
  ).rejects.toThrow('CLEANUP_REQUIRED');
  await expect(
    staff.auth.mutation(api.groups.mutations.deleteGroup, { groupId })
  ).rejects.toThrow('CLEANUP_REQUIRED');
  expect(
    await f.owner.auth.mutation(api.groups.expulsions.resume, {
      ...input,
      operationId: crypto.randomUUID(),
    })
  ).toMatchObject({ cleanup: 'complete' });
  await expect(
    staff.auth.mutation(api.groups.mutations.deleteGroup, { groupId })
  ).rejects.toThrow('CLEANUP_REQUIRED');
  const invitations = await f.t.run(async ctx => ({
    event: await ctx.db.query('eventInvites').collect(),
    group: await ctx.db.query('groupInvites').collect(),
  }));
  expect(invitations.event[0].status).toBe('CANCELLED');
  expect(invitations.group[0].status).toBe('CANCELLED');
  await staff.auth.mutation(api.groups.expulsions.reinstate, {
    ...input,
    operationId: crypto.randomUUID(),
  });
  await f.t.run(ctx =>
    ctx.db.patch(f.event.eventId, {
      visibility: 'PUBLIC',
      admissionPolicy: 'DIRECT',
    })
  );
  await target.auth.mutation(api.events.mutations.joinDiscoverableEvent, {
    eventId: f.event.eventId,
  });
  await expect(
    f.owner.auth.mutation(api.groups.expulsions.resume, {
      ...input,
      operationId: crypto.randomUUID(),
    })
  ).rejects.toThrow('STALE_GENERATION');
  const member = await f.t.run(ctx =>
    ctx.db
      .query('memberships')
      .withIndex('by_person_event', q =>
        q.eq('personId', target.personId).eq('eventId', f.event.eventId)
      )
      .first()
  );
  expect(member?.rsvpStatus).toBe('PENDING');
});

it('preserves completed history at retry time and retires deleted captured Events', async () => {
  const f = await setup();
  const target = await createAuthAccount(f.t, 'preserved');
  const groupId = await f.owner.auth.mutation(
    api.groups.mutations.createGroup,
    { name: 'Room' }
  );
  await f.owner.auth.mutation(
    api.groupEventAudiences.mutations.shareEventWithGroup,
    { groupId, eventId: f.event.eventId }
  );
  const membershipId = await f.t.run(ctx =>
    ctx.db.insert('memberships', {
      eventId: f.event.eventId,
      personId: target.personId,
      role: 'ATTENDEE',
      rsvpStatus: 'YES',
    })
  );
  await f.owner.auth.mutation(api.groups.expulsions.expel, {
    groupId,
    personId: target.personId,
    operationId: crypto.randomUUID(),
  });
  await f.t.run(ctx =>
    ctx.db.patch(f.event.eventId, { chosenEndDateTime: Date.now() })
  );
  const input = { groupId, personId: target.personId, generation: 1 };
  expect(
    await f.owner.auth.mutation(api.groups.expulsions.resume, {
      ...input,
      operationId: crypto.randomUUID(),
    })
  ).toMatchObject({ cleanup: 'complete', events: [{ state: 'preserved' }] });
  expect(await f.t.run(ctx => ctx.db.get(membershipId))).toMatchObject({
    rsvpStatus: 'YES',
  });
  await f.owner.auth.mutation(api.events.mutations.deleteEvent, {
    eventId: f.event.eventId,
  });
  expect(
    await f.owner.auth.mutation(api.groups.expulsions.resume, {
      ...input,
      operationId: crypto.randomUUID(),
    })
  ).toMatchObject({ cleanup: 'complete', events: [{ state: 'retired' }] });
});

it('resets explicit announcement opt-in so fresh admission cannot revive consent', async () => {
  const f = await setup();
  const target = await createAuthAccount(f.t, 'consent-reset');
  const groupId = await f.owner.auth.mutation(
    api.groups.mutations.createGroup,
    { name: 'Reading Circle' }
  );
  await f.t.run(async ctx => {
    await ctx.db.insert('groupMemberships', {
      groupId,
      personId: target.personId,
      role: 'MEMBER',
      joinedAt: Date.now(),
    });
  });
  await target.auth.mutation(api.groups.announcementPreferences.updateOwn, {
    groupId,
    subscribed: true,
    operationId: crypto.randomUUID(),
  });
  const result = await f.owner.auth.mutation(api.groups.expulsions.expel, {
    groupId,
    personId: target.personId,
    operationId: crypto.randomUUID(),
  });
  await f.owner.auth.mutation(api.groups.expulsions.resume, {
    groupId,
    personId: target.personId,
    generation: result.generation,
    operationId: crypto.randomUUID(),
  });
  await f.owner.auth.mutation(api.groups.expulsions.reinstate, {
    groupId,
    personId: target.personId,
    generation: result.generation,
    operationId: crypto.randomUUID(),
  });
  await f.t.run(async ctx => {
    await ctx.db.insert('groupMemberships', {
      groupId,
      personId: target.personId,
      role: 'MEMBER',
      joinedAt: Date.now(),
    });
  });
  expect(
    await target.auth.query(api.groups.announcementPreferences.readOwn, {
      groupId,
    })
  ).toEqual({ subscribed: false });
});

it('returns a validated empty staff reconciliation page for a newly created Group', async () => {
  const f = await setup();
  const groupId = await f.owner.auth.mutation(
    api.groups.mutations.createGroup,
    { name: 'New community' }
  );
  expect(
    await f.owner.auth.query(api.groups.expulsions.listProgress, { groupId })
  ).toEqual({ page: [], continueCursor: expect.any(String), isDone: true });
});
