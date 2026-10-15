import { afterEach, expect, it, vi } from 'vitest';
import { api } from '../_generated/api';
import { authorize, token, exchange } from './delegated-protocol.helpers';
import { createAuthAccount } from './auth.helpers';
import { applicant } from './community-applications.helpers';
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});
it('commits one submission and replays a lost response without leaking answers', async () => {
  const f = await applicant();
  const context = await f.read();
  const operationId = crypto.randomUUID();
  const body = {
    formRevision: context.form.revision,
    answers: { welcome: 'Hello' },
  };
  const first = await f.request(
    'community-applications',
    'POST',
    body,
    operationId
  );
  expect(first.status, await first.clone().text()).toBe(200);
  const receipt = await first.json();
  expect(receipt).toMatchObject({
    operationId,
    outcome: 'committed',
    result: { status: 'PENDING', revision: expect.any(Number) },
  });
  expect(JSON.stringify(receipt)).not.toContain('Hello');
  expect(
    await (
      await f.request('community-applications', 'POST', body, operationId)
    ).json()
  ).toEqual(receipt);
  expect((await f.read()).applications).toHaveLength(1);
  const mismatch = await f.request(
    'community-applications',
    'POST',
    { ...body, answers: { welcome: 'Different' } },
    operationId
  );
  expect(mismatch.status).toBe(409);
  expect(await mismatch.json()).toMatchObject({
    error: { code: 'IDEMPOTENCY_CONFLICT' },
  });
});
it('preserves saved snapshots and rejects stale edits and staff decisions even within one millisecond', async () => {
  const f = await applicant();
  const context = await f.read();
  const receipt = await (
    await f.request('community-applications', 'POST', {
      formRevision: context.form.revision,
      answers: { welcome: 'Initial' },
    })
  ).json();
  const id = receipt.result.applicationId;
  await f.staff.auth.mutation(
    api.groupApplications.mutations.configureGroupApplications,
    {
      groupId: f.groupId,
      applicationsEnabled: true,
      questions: [
        {
          id: 'current',
          label: 'New question',
          required: true,
          type: 'SHORT_ANSWER',
        },
      ],
    }
  );
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(receipt.result.revision);
  const edited = await f.request(`community-applications/${id}`, 'PATCH', {
    expectedRevision: receipt.result.revision,
    answers: { welcome: 'Saved form answer' },
  });
  expect(edited.status, await edited.clone().text()).toBe(200);
  const next = await edited.json();
  expect(next.result.revision).toBeGreaterThan(receipt.result.revision);
  expect((await f.read()).applications[0]).toMatchObject({
    answers: { welcome: 'Saved form answer' },
    questions: [{ id: 'welcome' }],
  });
  const stale = await f.request(`community-applications/${id}`, 'PATCH', {
    expectedRevision: receipt.result.revision,
    answers: { welcome: 'Overwritten' },
  });
  expect(await stale.json()).toMatchObject({
    error: { code: 'STALE_REVISION' },
  });
  await expect(
    f.staff.auth.mutation(
      api.groupApplications.mutations.reviewGroupApplication,
      {
        applicationId: id,
        decision: 'APPROVED',
        expectedRevision: receipt.result.revision,
      }
    )
  ).rejects.toThrow('STALE_REVISION');
  await f.staff.auth.mutation(
    api.groupApplications.mutations.reviewGroupApplication,
    {
      applicationId: id,
      decision: 'DECLINED',
      expectedRevision: next.result.revision,
    }
  );
  const after = await f.request(`community-applications/${id}`, 'PATCH', {
    expectedRevision: next.result.revision,
    answers: { welcome: 'Too late' },
  });
  expect(after.status).toBe(409);
  expect((await f.read()).applications[0].status).toBe('DECLINED');
});
it('requires a fresh deliberate intent and current form after decline or withdrawal', async () => {
  const f = await applicant();
  const initial = await f.read();
  const operationId = crypto.randomUUID();
  const body = {
    formRevision: initial.form.revision,
    answers: { welcome: 'First' },
  };
  const first = await (
    await f.request('community-applications', 'POST', body, operationId)
  ).json();
  await f.staff.auth.mutation(
    api.groupApplications.mutations.reviewGroupApplication,
    { applicationId: first.result.applicationId, decision: 'DECLINED' }
  );
  expect(
    await (
      await f.request('community-applications', 'POST', body, operationId)
    ).json()
  ).toEqual(first);
  const again = await (
    await f.request('community-applications', 'POST', body)
  ).json();
  expect(again.result.applicationId).not.toBe(first.result.applicationId);
  const withdrawn = await f.request(
    `community-applications/${again.result.applicationId}/withdraw`,
    'POST',
    { expectedRevision: again.result.revision }
  );
  expect(await withdrawn.json()).toMatchObject({
    result: { status: 'WITHDRAWN' },
  });
  expect(
    (await f.read()).applications.map((a: { status: string }) => a.status)
  ).toEqual(['WITHDRAWN', 'DECLINED']);
  await f.staff.auth.mutation(
    api.groupApplications.mutations.configureGroupApplications,
    { groupId: f.groupId, applicationsEnabled: true, questions: [] }
  );
  const stale = await f.request('community-applications', 'POST', body);
  expect(await stale.json()).toMatchObject({
    error: { code: 'STALE_REVISION' },
  });
});
it('expires recognized intent receipts without silently resubmitting after the window', async () => {
  const f = await applicant();
  const initial = await f.read();
  const operationId = crypto.randomUUID();
  const body = {
    formRevision: initial.form.revision,
    answers: { welcome: 'Old intent' },
  };
  const first = await (
    await f.request('community-applications', 'POST', body, operationId)
  ).json();
  await f.staff.auth.mutation(
    api.groupApplications.mutations.reviewGroupApplication,
    { applicationId: first.result.applicationId, decision: 'DECLINED' }
  );
  // Arrange a recognized historical receipt, retaining its original immutable binding.
  await f.t.run(async ctx => {
    const receipt = await ctx.db
      .query('communityOperationReceipts')
      .withIndex('by_operationId', q => q.eq('operationId', operationId))
      .unique();
    await ctx.db.patch(receipt!._id, {
      acceptedAt: Date.now() - 31 * 24 * 60 * 60 * 1000,
      expiresAt: Date.now() - 24 * 60 * 60 * 1000,
    });
  });
  const expired = await f.request(
    'community-applications',
    'POST',
    body,
    operationId
  );
  expect(expired.status).toBe(409);
  expect(await expired.json()).toMatchObject({
    error: { code: 'IDEMPOTENCY_EXPIRED' },
  });
});
it('allows write-only consent without returning answers or community read authority', async () => {
  const f = await applicant();
  const context = await f.read();
  const authorization = await authorize(f, {
    scopes: 'openid groups.applications.submit',
    actions: ['groups.applications.submit'],
    selector: { kind: 'selected-group', groupId: f.groupId },
    background: false,
  });
  const tokens = await (
    await token(f.t, exchange(f.appId, authorization.code))
  ).json();
  const headers = {
    Authorization: `Bearer ${tokens.access_token}`,
    'Content-Type': 'application/json',
    'Idempotency-Key': crypto.randomUUID(),
  };
  const read = await f.t.fetch(
    `/api/v2/groups/${f.groupId}/community-context`,
    { headers }
  );
  expect(read.status).toBe(403);
  const submitted = await f.t.fetch(
    `/api/v2/groups/${f.groupId}/community-applications`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        formRevision: context.form.revision,
        answers: { welcome: 'Private answer' },
      }),
    }
  );
  expect(submitted.status, await submitted.clone().text()).toBe(200);
  expect(JSON.stringify(await submitted.json())).not.toContain(
    'Private answer'
  );
});
it('denies guessed records, unrelated Groups and revoked authority even for committed receipts', async () => {
  const f = await applicant();
  const context = await f.read();
  const operationId = crypto.randomUUID();
  const body = {
    formRevision: context.form.revision,
    answers: { welcome: 'Own' },
  };
  const first = await (
    await f.request('community-applications', 'POST', body, operationId)
  ).json();
  const stranger = await createAuthAccount(f.t, 'private-other-applicant');
  const other = await stranger.auth.mutation(
    api.groupApplications.mutations.submitGroupApplication,
    { groupId: f.groupId, answers: { welcome: 'Other private answer' } }
  );
  const forged = await f.request(
    `community-applications/${other.applicationId}`,
    'PATCH',
    { expectedRevision: first.result.revision, answers: { welcome: 'Guess' } }
  );
  expect(forged.status).toBe(403);
  expect(JSON.stringify(await forged.json())).not.toContain(
    'Other private answer'
  );
  expect(
    (
      await f.request('community-applications/guessed-id', 'PATCH', {
        expectedRevision: 1,
        answers: { welcome: 'Guess' },
      })
    ).status
  ).toBe(403);
  const unrelated = await f.staff.auth.mutation(
    api.groups.mutations.createGroup,
    { name: 'Other Group' }
  );
  const wrongGroup = await f.t.fetch(
    `/api/v2/groups/${unrelated}/community-applications`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${f.accessToken}`,
        'Idempotency-Key': crypto.randomUUID(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );
  expect(wrongGroup.status).toBe(403);
  await f.staff.auth.mutation(api.groupModeration.mutations.banGroupPerson, {
    groupId: f.groupId,
    personId: f.event.personId,
  });
  expect(
    (await f.request('community-applications', 'POST', body, operationId))
      .status
  ).toBe(403);
  await f.staff.auth.mutation(api.groupModeration.mutations.liftGroupBan, {
    groupId: f.groupId,
    personId: f.event.personId,
  });
  const connections = await f.owner.auth.query(
    api.delegatedApps.queries.listConnections,
    { now: Date.now() }
  );
  await f.owner.auth.mutation(api.delegatedApps.mutations.disconnect, {
    grantId: connections[0].grantId,
  });
  const revoked = await f.request(
    'community-applications',
    'POST',
    body,
    operationId
  );
  expect(revoked.status).toBe(401);
  expect(await revoked.json()).toMatchObject({
    error: { code: 'CONNECTION_REVOKED' },
  });
});
it('replays an edit after a decision without undoing the decision or current membership', async () => {
  const f = await applicant();
  const context = await f.read();
  const first = await (
    await f.request('community-applications', 'POST', {
      formRevision: context.form.revision,
      answers: { welcome: 'Initial' },
    })
  ).json();
  const id = first.result.applicationId;
  const operationId = crypto.randomUUID();
  const body = {
    expectedRevision: first.result.revision,
    answers: { welcome: 'Reviewed answer' },
  };
  const edited = await (
    await f.request(`community-applications/${id}`, 'PATCH', body, operationId)
  ).json();
  await f.staff.auth.mutation(
    api.groupApplications.mutations.reviewGroupApplication,
    {
      applicationId: id,
      decision: 'APPROVED',
      expectedRevision: edited.result.revision,
    }
  );
  expect(
    await (
      await f.request(
        `community-applications/${id}`,
        'PATCH',
        body,
        operationId
      )
    ).json()
  ).toEqual(edited);
  expect((await f.read()).membership).toEqual({ role: 'MEMBER' });
  await f.owner.auth.mutation(api.groupModeration.mutations.leaveGroup, {
    groupId: f.groupId,
  });
  await f.staff.auth.mutation(
    api.groupApplications.mutations.reviewGroupApplication,
    { applicationId: id, decision: 'APPROVED' }
  );
  const current = await f.read();
  expect(current.membership).toBeNull();
  expect(current.applications[0].status).toBe('APPROVED');
});
it('replays a committed staff decision intent without duplicate admission or later re-admission', async () => {
  const f = await applicant();
  const context = await f.read();
  const first = await (
    await f.request('community-applications', 'POST', {
      formRevision: context.form.revision,
      answers: { welcome: 'Ready' },
    })
  ).json();
  const intent = {
    applicationId: first.result.applicationId,
    decision: 'APPROVED' as const,
    expectedRevision: first.result.revision,
    operationId: crypto.randomUUID(),
  };
  const approved = await f.staff.auth.mutation(
    api.groupApplications.mutations.reviewGroupApplication,
    intent
  );
  expect(
    await f.staff.auth.mutation(
      api.groupApplications.mutations.reviewGroupApplication,
      intent
    )
  ).toEqual(approved);
  await f.owner.auth.mutation(api.groupModeration.mutations.leaveGroup, {
    groupId: f.groupId,
  });
  await f.staff.auth.mutation(
    api.groupApplications.mutations.reviewGroupApplication,
    intent
  );
  expect((await f.read()).membership).toBeNull();
  await expect(
    f.staff.auth.mutation(
      api.groupApplications.mutations.reviewGroupApplication,
      { ...intent, decision: 'DECLINED' }
    )
  ).rejects.toThrow('IDEMPOTENCY_CONFLICT');
});
