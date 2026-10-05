import { GroupApplicationResultSchema } from '../api/v2/schemas/groupApplications';
import { describe, expect, it } from 'vitest';
import { api, components } from '../_generated/api';
import { createAuthAccount, registerBetterAuth } from './auth.helpers';
import { createTestInstance } from './test_helpers';

async function actor(
  t: ReturnType<typeof createTestInstance>,
  username: string,
  permissions?: Record<string, string[]>
) {
  const account = await createAuthAccount(t, username);
  const rawKey = `grp_groups_${username}`;
  const hash = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(rawKey)
  );
  await t.mutation(components.betterAuth.adapter.create, {
    input: {
      model: 'apikey',
      data: {
        userId: account.user._id,
        key: btoa(String.fromCharCode(...new Uint8Array(hash)))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, ''),
        enabled: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        ...(permissions ? { permissions: JSON.stringify(permissions) } : {}),
      },
    },
  });
  return {
    ...account,
    request: (path: string, method = 'GET', body?: unknown) =>
      t.fetch(`/api/v2${path}`, {
        method,
        headers: { 'x-api-key': rawKey, 'content-type': 'application/json' },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      }),
  };
}
async function body(response: Response, status = 200) {
  expect(response.status, await response.clone().text()).toBe(status);
  return status === 204 ? null : response.json();
}

describe('authenticated Group application REST', () => {
  it('enforces scopes, owner forms, saved definitions, author privacy and current manager decisions', async () => {
    const t = createTestInstance();
    registerBetterAuth(t);
    const owner = await actor(t, 'http-app-owner');
    const person = await actor(t, 'http-app-person');
    const mod = await actor(t, 'http-app-mod');
    const outsider = await actor(t, 'http-app-outsider');
    const readOnly = await actor(t, 'http-app-readonly', { groups: ['read'] });
    const { groupId } = await body(
      await owner.request('/groups', 'POST', { name: 'REST applications' }),
      201
    );
    const base = `/groups/${groupId}`;
    const questions = [
      { id: 'why', label: 'Why?', required: true, type: 'SHORT_ANSWER' },
      { id: 'number', label: 'Number', required: true, type: 'NUMBER' },
      { id: 'bool', label: 'Boolean', required: true, type: 'YES_NO' },
    ];
    expect(
      await body(await person.request(base + '/application-form'))
    ).toMatchObject({
      applicationsEnabled: false,
      canApply: false,
      pending: null,
    });
    await body(
      await readOnly.request(base + '/application-settings', 'PUT', {
        applicationsEnabled: true,
        questions,
      }),
      403
    );
    await body(
      await person.request(base + '/application-settings', 'PUT', {
        applicationsEnabled: true,
        questions,
      }),
      403
    );
    await body(
      await owner.request(base + '/application-settings', 'PUT', {
        applicationsEnabled: true,
        questions,
      })
    );
    await body(
      await person.request(base + '/applications', 'POST', {
        answers: { why: 'Reason', number: 0, bool: false },
        personId: owner.personId,
      }),
      400
    );
    await body(
      await person.request(base + '/applications', 'POST', {
        answers: { why: 'Reason', number: '0', bool: false },
      }),
      400
    );
    const invite = await body(
      await owner.request(base + '/invitations', 'POST', {
        inviteePersonId: mod.personId,
      })
    );
    await body(
      await mod.request(`/group-invites/${invite.inviteId}/accept`, 'POST')
    );
    await body(
      await owner.request(`${base}/members/${mod.personId}/role`, 'PATCH', {
        role: 'MODERATOR',
      })
    );
    const submitted = await body(
      await person.request(base + '/applications', 'POST', {
        answers: { why: 'Reason', number: 0, bool: false },
      })
    );
    const path = base + '/applications/' + submitted.applicationId;
    expect(
      await body(
        await person.request(base + '/applications', 'POST', {
          answers: { why: 'Reason', number: 0, bool: false },
        })
      )
    ).toEqual(submitted);
    await body(await outsider.request(path), 403);
    await body(await person.request(base + '/members'), 403);
    await body(await person.request(base + '/applications'), 403);
    expect(
      (
        await body(
          await mod.request(base + '/applications?status=PENDING&limit=1')
        )
      ).items[0]
    ).toMatchObject({
      _id: submitted.applicationId,
      applicant: { username: 'http-app-person' },
    });
    await body(await mod.request(base + '/applications?limit=101'), 400);
    await body(
      await owner.request(base + '/application-settings', 'PUT', {
        applicationsEnabled: true,
        questions: [
          { id: 'changed', label: 'New', required: true, type: 'NUMBER' },
        ],
      })
    );
    await body(
      await person.request(path, 'PATCH', {
        answers: { why: 'Edited', number: 0, bool: false },
      })
    );
    await body(
      await mod.request(path + '/review', 'POST', { decision: 'APPROVED' })
    );
    await body(
      await mod.request(path + '/review', 'POST', { decision: 'APPROVED' })
    );
    await body(
      await person.request(path, 'PATCH', {
        answers: { why: 'Replace', number: 1, bool: true },
      }),
      409
    );
    expect(await body(await person.request(path))).toMatchObject({
      questions,
      answers: { why: 'Edited', number: 0, bool: false },
      status: 'APPROVED',
    });
    expect(
      (await body(await person.request(base + '/applications/mine?limit=1')))
        .items
    ).toHaveLength(1);
    expect(await body(await owner.request(base))).toMatchObject({
      memberCount: 3,
    });
    await body(await person.request(base + '/leave', 'POST'));
    expect(await body(await person.request(path))).toMatchObject({
      status: 'APPROVED',
    });
    await body(
      await mod.request(path + '/review', 'POST', { decision: 'APPROVED' })
    );
    expect(
      await person.auth.query(api.groups.queries.getGroup, { groupId })
    ).toBeNull();
    const notices = await mod.auth.query(
      api.notifications.queries.fetchNotificationsForPerson,
      {}
    );
    expect(
      notices.notifications.find(n => n.type === 'GROUP_APPLICATION_RECEIVED')
    ).toMatchObject({
      groupApplication: { id: submitted.applicationId, status: 'APPROVED' },
    });
    await body(
      await owner.request(`${base}/members/${mod.personId}/role`, 'PATCH', {
        role: 'MEMBER',
      })
    );
    const demotedNotices = await mod.auth.query(
      api.notifications.queries.fetchNotificationsForPerson,
      {}
    );
    expect(
      demotedNotices.notifications.find(
        n => n.type === 'GROUP_APPLICATION_RECEIVED'
      )
    ).toMatchObject({ groupApplication: null });
  });
  it('cleans private applications through three account paths, retains anonymized decisions, and rolls back owner deletion', async () => {
    const t = createTestInstance();
    registerBetterAuth(t);
    const owner = await actor(t, 'app-clean-owner');
    const admin = await actor(t, 'app-clean-admin');
    await t.mutation(components.betterAuth.adapter.updateOne, {
      input: {
        model: 'user',
        where: [{ field: '_id', value: admin.user._id }],
        update: { role: 'admin' },
      },
    });
    const { groupId } = await body(
      await owner.request('/groups', 'POST', { name: 'Cleanup' }),
      201
    );
    const base = `/groups/${groupId}`;
    await body(
      await owner.request(base + '/application-settings', 'PUT', {
        applicationsEnabled: true,
        questions: [],
      })
    );
    for (const path of ['self', 'app', 'rest'] as const) {
      const person = await actor(t, `app-clean-${path}`);
      await body(
        await person.request(base + '/applications', 'POST', { answers: {} })
      );
      if (path === 'self')
        await person.auth.mutation(api.users.mutations.deleteUserAccount, {
          confirmation: `app-clean-${path}`,
        });
      else if (path === 'app')
        await admin.auth.mutation(api.admin.mutations.deletePerson, {
          personId: person.personId,
        });
      else
        await body(
          await admin.request(`/admin/users/${person.user._id}`, 'DELETE'),
          204
        );
      expect(
        (await body(await owner.request(base + '/applications'))).items
      ).toEqual([]);
    }
    const mod = await actor(t, 'app-clean-reviewer');
    const person = await actor(t, 'app-clean-retained');
    const invite = await body(
      await owner.request(base + '/invitations', 'POST', {
        inviteePersonId: mod.personId,
      })
    );
    await body(
      await mod.request(`/group-invites/${invite.inviteId}/accept`, 'POST')
    );
    await body(
      await owner.request(`${base}/members/${mod.personId}/role`, 'PATCH', {
        role: 'MODERATOR',
      })
    );
    const submitted = await body(
      await person.request(base + '/applications', 'POST', { answers: {} })
    );
    await body(
      await mod.request(
        base + '/applications/' + submitted.applicationId + '/review',
        'POST',
        { decision: 'DECLINED' }
      )
    );
    await expect(
      owner.auth.mutation(api.users.mutations.deleteUserAccount, {
        confirmation: 'app-clean-owner',
      })
    ).rejects.toThrow('owned Groups');
    expect(
      (await body(await person.request(base + '/applications/mine'))).items
    ).toHaveLength(1);
    await mod.auth.mutation(api.users.mutations.deleteUserAccount, {
      confirmation: 'app-clean-reviewer',
    });
    const retained = await body(
      await person.request(base + '/applications/' + submitted.applicationId)
    );
    expect(retained.decisions).toEqual([
      { status: 'DECLINED', at: expect.any(Number) },
    ]);
    await body(await owner.request(base, 'DELETE'), 204);
    expect(
      await t.run(async ctx => ({
        applications: await ctx.db.query('groupApplications').collect(),
        actors: await ctx.db.query('groupApplicationActors').collect(),
        notifications: await ctx.db
          .query('notifications')
          .withIndex('by_groupApplicationId', q =>
            q.eq('groupApplicationId', submitted.applicationId)
          )
          .collect(),
      }))
    ).toEqual({ applications: [], actors: [], notifications: [] });
  });
});

it('REST approval preserves required status through the published schema and completion without replaying admission', async () => {
  vi.useFakeTimers();
  try {
    const t = createTestInstance();
    registerBetterAuth(t);
    const owner = await actor(t, 'required-rest-owner'),
      person = await actor(t, 'required-rest-applicant');
    const { groupId } = await body(
      await owner.request('/groups', 'POST', { name: 'Required approval' }),
      201
    );
    const base = `/groups/${groupId}`;
    await body(
      await owner.request(base + '/application-settings', 'PUT', {
        applicationsEnabled: true,
        questions: [],
      })
    );
    await body(
      await owner.request(base + '/joining-questionnaire', 'PUT', {
        enabled: true,
        requiredCompletion: true,
        questions: [
          {
            id: 'required',
            label: 'Required private answer',
            type: 'SHORT_ANSWER',
            required: true,
          },
        ],
      })
    );
    const application = await body(
      await person.request(base + '/applications', 'POST', { answers: {} }),
      200
    );
    const endpoint =
      base + '/applications/' + application.applicationId + '/review';
    const approved = await body(
      await owner.request(endpoint, 'POST', { decision: 'APPROVED' })
    );
    const flags = {
      requiredCompletion: true,
      requiresCompletion: true,
      canAccessMemberContent: false,
    };
    expect(approved.joiningQuestionnaire).toMatchObject(flags);
    expect(
      GroupApplicationResultSchema.parse(approved).joiningQuestionnaire
    ).toMatchObject(flags);
    expect(JSON.stringify(approved)).not.toContain('Required private answer');
    await body(await person.request(base + '/members'), 403);
    const form = await body(
      await person.request(base + '/joining-questionnaire')
    );
    await body(
      await person.request(base + '/joining-questionnaire/answers', 'PUT', {
        version: form.version,
        answers: { required: 'Saved' },
      })
    );
    expect(
      (await body(await person.request(base + '/members'))).items
    ).toHaveLength(2);
    await owner.auth.mutation(api.groupModeration.mutations.banGroupPerson, {
      groupId,
      personId: person.personId,
    });
    expect(
      await body(
        await owner.request(endpoint, 'POST', { decision: 'APPROVED' })
      )
    ).toEqual({ applicationId: application.applicationId, status: 'APPROVED' });
    expect(
      await person.auth.query(api.groups.queries.getGroup, { groupId })
    ).toBeNull();
    await t.finishAllScheduledFunctions(() => vi.runAllTimers());
  } finally {
    vi.useRealTimers();
  }
});
