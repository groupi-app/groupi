import { expect, it, vi, afterEach } from 'vitest';
import { api, internal } from '../_generated/api';
import { applicant } from './community-applications.helpers';
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});
it('links delegated application to its verified source and commits a decision independently of email', async () => {
  const f = await applicant();
  const context = await f.read();
  const receipt = await (
    await f.request('community-applications', 'POST', {
      formRevision: context.form.revision,
      answers: { welcome: 'Hello' },
    })
  ).json();
  await f.t.finishInProgressScheduledFunctions();
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  const id = receipt.result.applicationId;
  const own = await f.owner.auth.query(
    api.groupApplications.queries.getGroupApplication,
    { applicationId: id }
  );
  expect(own.sourceAppId).toBe(f.appId);
  await f.staff.auth.mutation(
    api.groupApplications.mutations.reviewGroupApplication,
    {
      applicationId: id,
      decision: 'APPROVED',
      expectedRevision: receipt.result.revision,
      operationId: crypto.randomUUID(),
    }
  );
  const decided = await f.staff.auth.query(
    api.groupApplications.queries.getGroupApplication,
    { applicationId: id }
  );
  expect(decided.status).toBe('APPROVED');
  expect(decided.decisionDelivery).toBe('suppressed');
});

it('keeps failed delivery separate, retries with the same message key, and protects status returns after departure/revocation', async () => {
  const f = await applicant();
  await f.t.run(async ctx => {
    await ctx.db.patch(f.appId, {
      status: 'approved',
      appearance: {
        brandName: 'Red Room & friends',
        senderName: 'Red Room',
        accent: '#991b1b',
        statusReturnUrl: 'https://app.example/status',
      },
    });
  });
  await f.owner.auth.mutation(api.settings.mutations.saveNotificationSettings, {
    notificationMethods: [
      {
        type: 'EMAIL',
        enabled: true,
        value: 'delivery@example.test',
        notifications: [],
      },
    ],
  });
  const context = await f.read();
  const receipt = await (
    await f.request('community-applications', 'POST', {
      formRevision: context.form.revision,
      answers: { welcome: 'Hello' },
    })
  ).json();
  await f.t.finishInProgressScheduledFunctions();
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  const id = receipt.result.applicationId;
  const operationId = crypto.randomUUID();
  const intent = {
    applicationId: id,
    decision: 'APPROVED' as const,
    expectedRevision: receipt.result.revision,
    operationId,
  };
  await f.staff.auth.mutation(
    api.groupApplications.mutations.reviewGroupApplication,
    intent
  );
  await f.staff.auth.mutation(
    api.groupApplications.mutations.reviewGroupApplication,
    intent
  );
  const provider = vi
    .fn()
    .mockResolvedValue(new Response('{}', { status: 503 }));
  vi.stubGlobal('fetch', provider);
  vi.stubEnv('RESEND_API_KEY', 'synthetic-only');
  await f.t.action(internal.groupApplications.decisionActions.send, {
    applicationId: id,
  });
  const read = () =>
    f.staff.auth.query(api.groupApplications.queries.getGroupApplication, {
      applicationId: id,
    });
  expect(await read()).toMatchObject({
    status: 'APPROVED',
    decisionDelivery: 'failed',
  });
  expect(provider).toHaveBeenCalledTimes(1);
  const request = provider.mock.calls[0][1];
  expect(JSON.parse(request.body)).toMatchObject({
    to: 'delivery@example.test',
    from: 'Red Room <notifications@groupi.gg>',
    subject: 'Your Red Room & friends application: approved',
  });
  expect(JSON.parse(request.body).html).toContain('Red Room &amp; friends');
  expect(JSON.parse(request.body).html).toContain(`/application-status/${id}`);
  expect(JSON.stringify(await f.read())).not.toContain('delivery@example.test');
  await f.staff.auth.mutation(api.groupApplications.decisionDelivery.retry, {
    applicationId: id,
  });
  provider.mockResolvedValue(new Response('{}', { status: 200 }));
  await f.t.action(internal.groupApplications.decisionActions.send, {
    applicationId: id,
  });
  expect(provider.mock.calls[1][1]).toEqual(request);
  expect(await read()).toMatchObject({
    status: 'APPROVED',
    decisionDelivery: 'sent',
  });
  await f.staff.auth.mutation(api.groupApplications.decisionDelivery.retry, {
    applicationId: id,
  });
  await f.t.action(internal.groupApplications.decisionActions.send, {
    applicationId: id,
  });
  expect(provider).toHaveBeenCalledTimes(2);
  await f.owner.auth.mutation(api.groupModeration.mutations.leaveGroup, {
    groupId: f.groupId,
  });
  expect(
    await f.owner.auth.query(
      api.groupApplications.decisionDelivery.statusReturn,
      { applicationId: id }
    )
  ).toEqual({
    status: 'APPROVED',
    currentMember: false,
    url: 'https://app.example/status',
  });
  await expect(
    f.staff.auth.query(api.groupApplications.decisionDelivery.statusReturn, {
      applicationId: id,
    })
  ).rejects.toThrow('unavailable');
  await f.t.run(async ctx => {
    await ctx.db.patch(f.appId, { status: 'suspended' });
  });
  expect(
    await f.owner.auth.query(
      api.groupApplications.decisionDelivery.statusReturn,
      { applicationId: id }
    )
  ).toMatchObject({ url: null, currentMember: false });
});

it.each(['dnd', 'disabled', 'revoked'] as const)(
  'suppresses decision delivery for %s without undoing approval or depending on announcement opt-in',
  async reason => {
    const f = await applicant();
    await f.t.run(ctx => ctx.db.patch(f.appId, { status: 'approved' }));
    await f.owner.auth.mutation(
      api.settings.mutations.saveNotificationSettings,
      {
        notificationMethods: [
          {
            type: 'EMAIL',
            enabled: true,
            value: 'delivery@example.test',
            notifications: [
              {
                notificationType: 'GROUP_APPLICATION_APPROVED',
                enabled: reason !== 'disabled',
              },
            ],
          },
        ],
      }
    );
    const context = await f.read();
    const receipt = await (
      await f.request('community-applications', 'POST', {
        formRevision: context.form.revision,
        answers: { welcome: 'Hello' },
      })
    ).json();
    await f.t.finishInProgressScheduledFunctions();
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const id = receipt.result.applicationId;
    await f.staff.auth.mutation(
      api.groupApplications.mutations.reviewGroupApplication,
      { applicationId: id, decision: 'APPROVED' }
    );
    if (reason === 'dnd')
      await f.owner.auth.mutation(api.presence.setStatus, {
        status: 'DO_NOT_DISTURB',
      });
    if (reason === 'revoked')
      await f.t.run(ctx => ctx.db.patch(f.appId, { status: 'suspended' }));
    const provider = vi.fn();
    vi.stubGlobal('fetch', provider);
    await f.t.action(internal.groupApplications.decisionActions.send, {
      applicationId: id,
    });
    expect(provider).not.toHaveBeenCalled();
    expect(
      await f.staff.auth.query(
        api.groupApplications.queries.getGroupApplication,
        { applicationId: id }
      )
    ).toMatchObject({ status: 'APPROVED', decisionDelivery: 'suppressed' });
  }
);

it.each(['lost-response', 'deleted-app', 'deleted-application'] as const)(
  'reconciles %s without duplicate delivery or admission',
  async scenario => {
    const f = await applicant();
    await f.t.run(ctx => ctx.db.patch(f.appId, { status: 'approved' }));
    await f.owner.auth.mutation(
      api.settings.mutations.saveNotificationSettings,
      {
        notificationMethods: [
          {
            type: 'EMAIL',
            enabled: true,
            value: 'decision@example.test',
            notifications: [],
          },
        ],
      }
    );
    const context = await f.read();
    const receipt = await (
      await f.request('community-applications', 'POST', {
        formRevision: context.form.revision,
        answers: { welcome: 'Hello' },
      })
    ).json();
    await f.t.finishInProgressScheduledFunctions();
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const id = receipt.result.applicationId;
    await f.staff.auth.mutation(
      api.groupApplications.mutations.reviewGroupApplication,
      { applicationId: id, decision: 'APPROVED' }
    );
    if (scenario === 'deleted-app')
      await f.t.run(ctx => ctx.db.delete(f.appId));
    if (scenario === 'deleted-application')
      await f.staff.auth.mutation(api.groups.mutations.deleteGroup, {
        groupId: f.groupId,
      });
    const keys = new Set<string>();
    let loseResponse = true;
    const provider = vi.fn(async (_url, request) => {
      keys.add(request.headers['Idempotency-Key']);
      if (loseResponse) {
        loseResponse = false;
        throw new Error('Accepted by provider; response lost');
      }
      return new Response('{}', { status: 200 });
    });
    vi.stubGlobal('fetch', provider);
    vi.stubEnv('RESEND_API_KEY', 'synthetic-only');
    await f.t.action(internal.groupApplications.decisionActions.send, {
      applicationId: id,
    });
    if (scenario !== 'lost-response') {
      expect(provider).not.toHaveBeenCalled();
      return;
    }
    await f.staff.auth.mutation(api.groupApplications.decisionDelivery.retry, {
      applicationId: id,
    });
    await f.t.action(internal.groupApplications.decisionActions.send, {
      applicationId: id,
    });
    expect(provider).toHaveBeenCalledTimes(2);
    expect(keys.size).toBe(1);
    expect(
      await f.staff.auth.query(
        api.groupApplications.queries.getGroupApplication,
        { applicationId: id }
      )
    ).toMatchObject({ status: 'APPROVED', decisionDelivery: 'sent' });
    expect((await f.read()).applications[0]).toMatchObject({
      status: 'APPROVED',
      decisionDelivery: 'sent',
    });
  }
);
