import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '../_generated/api';
import {
  setup,
  authorize,
  token,
  exchange,
} from './delegated-protocol.helpers';
import { createAuthAccount } from './auth.helpers';
import { communityFixtures } from '../../packages/sdk/src/community-contract.js';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});
async function applicant() {
  const context = await setup();
  const staff = await createAuthAccount(context.t, 'community-staff');
  const groupId = await staff.auth.mutation(api.groups.mutations.createGroup, {
    name: 'Red Room',
  });
  await staff.auth.mutation(
    api.groupApplications.mutations.configureGroupApplications,
    {
      groupId,
      applicationsEnabled: true,
      questions: [
        {
          id: 'welcome',
          label: 'What brings you here?',
          required: true,
          type: 'LONG_ANSWER',
        },
      ],
    }
  );
  const result = await authorize(context, {
    scopes: 'openid groups.context.read',
    actions: ['groups.context.read'],
    selector: { kind: 'selected-group', groupId },
    background: false,
  });
  const tokens = await (
    await token(context.t, exchange(context.appId, result.code))
  ).json();
  const read = (id: string = groupId, cursor?: string) =>
    context.t.fetch(
      `/api/v2/groups/${id}/community-context${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`,
      { headers: { Authorization: `Bearer ${tokens.access_token}` } }
    );
  return { ...context, staff, groupId, read };
}
describe('selected Group delegated community context', () => {
  it('lets a never-applied applicant read only its selected Group without membership and stops on disconnect', async () => {
    const f = await applicant();
    const otherId = await f.staff.auth.mutation(
      api.groups.mutations.createGroup,
      { name: 'Unrelated' }
    );
    const response = await f.read();
    expect(response.status, await response.clone().text()).toBe(200);
    expect(response.headers.get('cache-control')).toContain('no-store');
    const own = await response.json();
    expect(own).toMatchObject({
      contractVersion: 'red-room.v1',
      group: { id: f.groupId, name: 'Red Room' },
      membership: communityFixtures.neverApplied.context.membership,
      applications: [],
      eligibility: { canApply: true, banned: false },
      form: {
        enabled: true,
        questions: communityFixtures.neverApplied.context.form.questions,
      },
      announcementPreference: { supported: false, subscribed: null },
      allowedActions: ['groups.context.read'],
    });
    expect((await f.read(otherId)).status).toBe(403);
    expect((await f.read('guessed-private-id')).status).toBe(403);
    const connections = await f.owner.auth.query(
      api.delegatedApps.queries.listConnections,
      { now: Date.now() }
    );
    await f.owner.auth.mutation(api.delegatedApps.mutations.disconnect, {
      grantId: connections[0].grantId,
    });
    const revoked = await f.read();
    expect(revoked.status).toBe(401);
    expect(await revoked.json()).toMatchObject({
      error: { code: 'CONNECTION_REVOKED' },
    });
  });
  it('keeps saved answers separate from the current form and historical approval separate from membership', async () => {
    const f = await applicant();
    await f.t.run(async ctx => {
      for (let i = 0; i < 51; i++)
        await ctx.db.insert('groupApplications', {
          groupId: f.groupId,
          personId: f.event.personId,
          questions: [],
          answers: {},
          status: 'WITHDRAWN',
          submittedAt: 1000 + i,
          updatedAt: 1000 + i,
          decisions: [
            {
              status: 'WITHDRAWN',
              at: 1000 + i,
              reason: 'Private moderation rationale',
            },
          ],
        });
    });
    const own = await f.owner.auth.mutation(
      api.groupApplications.mutations.submitGroupApplication,
      { groupId: f.groupId, answers: { welcome: 'Synthetic response' } }
    );
    const stranger = await createAuthAccount(f.t, 'other-applicant');
    await stranger.auth.mutation(
      api.groupApplications.mutations.submitGroupApplication,
      { groupId: f.groupId, answers: { welcome: 'Private other answer' } }
    );
    await f.staff.auth.mutation(
      api.groupApplications.mutations.configureGroupApplications,
      {
        groupId: f.groupId,
        applicationsEnabled: true,
        questions: [
          {
            id: 'new-question',
            label: 'Current wording',
            required: false,
            type: 'SHORT_ANSWER',
          },
        ],
      }
    );
    const pending = await (await f.read()).json();
    expect(pending.applications).toHaveLength(50);
    expect(pending.applications[0]).toMatchObject({
      id: own.applicationId,
      status: 'PENDING',
      answers: { welcome: 'Synthetic response' },
      questions: [{ id: 'welcome', label: 'What brings you here?' }],
    });
    expect(pending.form.questions[0].id).toBe('new-question');
    expect(pending.eligibility.canApply).toBe(false);
    // Historical pages must not lose the active pending application constraint.
    const firstPage = await (await f.read()).json();
    const historyPage = await f.read(f.groupId, firstPage.nextCursor);
    const history = await historyPage.json();
    expect(history.eligibility.canApply).toBe(false);
    expect(JSON.stringify(history)).not.toContain(
      'Private moderation rationale'
    );

    expect(JSON.stringify(pending)).not.toContain('Private other answer');
    await f.staff.auth.mutation(
      api.groupApplications.mutations.reviewGroupApplication,
      { applicationId: own.applicationId, decision: 'APPROVED' }
    );
    expect((await (await f.read()).json()).membership).toEqual({
      membershipId: expect.any(String),
      role: 'MEMBER',
    });
    await f.owner.auth.mutation(api.groupModeration.mutations.leaveGroup, {
      groupId: f.groupId,
    });
    const departed = await (await f.read()).json();
    expect(departed.membership).toBeNull();
    expect(departed.applications[0].status).toBe('APPROVED');
    expect(departed.eligibility.canAccessMemberContent).toBe(false);
  });
  it('rechecks scope, ban, app suspension and credential expiry rather than retaining old authority', async () => {
    const f = await applicant();
    await f.staff.auth.mutation(api.groupModeration.mutations.banGroupPerson, {
      groupId: f.groupId,
      personId: f.event.personId,
    });
    const banned = await (await f.read()).json();
    expect(banned.eligibility).toMatchObject({ canApply: false, banned: true });
    expect(banned.form.questions).toEqual([]);
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(Date.now() + 301000);
    const expired = await f.read();
    expect(expired.status).toBe(401);
    expect(await expired.json()).toMatchObject({
      error: { code: 'TOKEN_EXPIRED' },
    });
    vi.useRealTimers();
    await f.t.run(async ctx => {
      await ctx.db.patch(f.appId, { status: 'suspended' });
    });
    expect((await f.read()).status).toBe(403);
  });
});

it('does not treat identity, Event or unsupported write authority as community read authority', async () => {
  const f = await applicant();
  const result = await authorize(f, {
    scopes: 'openid identity.email',
    actions: ['identity.email'],
    selector: { kind: 'selected', eventIds: [] },
    background: false,
  });
  const tokens = await (
    await token(f.t, exchange(f.appId, result.code))
  ).json();
  const denied = await f.t.fetch(
    `/api/v2/groups/${f.groupId}/community-context`,
    { headers: { Authorization: `Bearer ${tokens.access_token}` } }
  );
  expect(denied.status).toBe(403);
  expect(await denied.json()).toEqual({
    error: {
      code: 'FORBIDDEN',
      message: 'Credential does not permit this operation.',
    },
  });
  const write = await f.t.fetch(
    `/api/v2/groups/${f.groupId}/community-applications`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ answers: { welcome: 'No read projection' } }),
    }
  );
  expect(write.status).toBe(403);
  expect(JSON.stringify(await write.json())).not.toContain(
    'No read projection'
  );
});
