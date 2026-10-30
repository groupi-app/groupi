import { expect, it, vi, afterEach } from 'vitest';
import { api, components, internal } from '../_generated/api';
import { createAuthAccount, registerBetterAuth } from './auth.helpers';
import { createTestInstance } from './test_helpers';

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

it.each(['leave', 'remove', 'ban', 'exclude'] as const)(
  '%s fences pending Discord work and retains the old role cleanup target',
  async operation => {
    vi.useFakeTimers();
    const t = createTestInstance();
    registerBetterAuth(t);
    const owner = await createAuthAccount(t, 'eligibility-owner');
    const member = await createAuthAccount(t, 'eligibility-member');
    const groupId = await owner.auth.mutation(
      api.groups.mutations.createGroup,
      { name: 'Readers' }
    );
    const enrollmentId = await t.run(async ctx => {
      await ctx.db.insert('groupMemberships', {
        groupId,
        personId: member.personId,
        role: 'MEMBER',
        joinedAt: Date.now(),
      });
      return ctx.db.insert('groupDiscordEnrollments', {
        groupId,
        personId: member.personId,
        discordUserId: 'reader',
        guildId: 'guild',
        roleId: 'role',
        connectionGeneration: 3,
        generation: 7,
        desired: 'granted',
        status: 'pending',
        startedAt: Date.now(),
        updatedAt: Date.now(),
        attempts: 0,
        nextAttemptAt: Date.now(),
      });
    });
    if (operation === 'leave')
      await member.auth.mutation(api.groupModeration.mutations.leaveGroup, {
        groupId,
      });
    else if (operation === 'remove')
      await owner.auth.mutation(
        api.groupModeration.mutations.removeGroupMember,
        { groupId, personId: member.personId }
      );
    else if (operation === 'ban')
      await owner.auth.mutation(api.groupModeration.mutations.banGroupPerson, {
        groupId,
        personId: member.personId,
      });
    else
      await owner.auth.mutation(api.groups.expulsions.expel, {
        groupId,
        personId: member.personId,
        operationId: crypto.randomUUID(),
      });
    const state = await t.run(async ctx => ({
      enrollment: await ctx.db.get(enrollmentId),
      cleanup: await ctx.db.query('groupDiscordCleanup').collect(),
    }));
    expect(state.enrollment).toMatchObject({
      generation: 8,
      desired: 'removed',
      status: 'blocked',
      error: expect.stringContaining('Connect again'),
    });
    expect(state.cleanup).toHaveLength(1);
    expect(state.cleanup[0]).toMatchObject({
      discordUserId: 'reader',
      guildId: 'guild',
      roleId: 'role',
      generation: 3,
      enrollmentGeneration: 7,
      desired: 'role_removed',
      status: 'pending',
    });
    if (operation === 'exclude') {
      await owner.auth.mutation(api.groupModeration.mutations.banGroupPerson, {
        groupId,
        personId: member.personId,
      });
      await owner.auth.mutation(api.groups.expulsions.resume, {
        groupId,
        personId: member.personId,
        generation: 1,
        operationId: crypto.randomUUID(),
      });
      await owner.auth.mutation(api.groups.expulsions.reinstate, {
        groupId,
        personId: member.personId,
        generation: 1,
        operationId: crypto.randomUUID(),
      });
      expect(
        await t.run(ctx => ctx.db.get(state.cleanup[0]._id))
      ).toMatchObject({ status: 'pending', desired: 'role_removed' });
      expect(await t.run(ctx => ctx.db.get(enrollmentId))).toMatchObject({
        desired: 'removed',
        status: 'blocked',
      });
      expect(
        await t.run(ctx => ctx.db.query('groupBans').first())
      ).toMatchObject({ active: true });
    }
  }
);

it.each([1, 25])(
  'new required onboarding revokes %i enrolled roles through bounded work and requires a fresh Connect after completion',
  async count => {
    vi.useFakeTimers();
    const t = createTestInstance();
    registerBetterAuth(t);
    const owner = await createAuthAccount(t, 'onboarding-role-owner');
    const member = await createAuthAccount(t, 'onboarding-role-member');
    const groupId = await owner.auth.mutation(
      api.groups.mutations.createGroup,
      {
        name: 'Readers',
      }
    );
    const enrollmentId = await t.run(async ctx => {
      await ctx.db.insert('groupMemberships', {
        groupId,
        personId: member.personId,
        role: 'MEMBER',
        joinedAt: Date.now(),
      });
      return ctx.db.insert('groupDiscordEnrollments', {
        groupId,
        personId: member.personId,
        discordUserId: 'reader',
        guildId: 'guild',
        roleId: 'role',
        connectionGeneration: 3,
        generation: 7,
        desired: 'granted',
        status: 'connected',
        startedAt: Date.now(),
        updatedAt: Date.now(),
        attempts: 0,
        nextAttemptAt: Date.now(),
      });
    });
    for (let i = 1; i < count; i++) {
      const other = await createAuthAccount(t, `reader-${i}`);
      await t.run(async ctx => {
        await ctx.db.insert('groupMemberships', {
          groupId,
          personId: other.personId,
          role: 'MEMBER',
          joinedAt: Date.now(),
        });
        const original = (await ctx.db.get(enrollmentId))!;
        const { _id, _creationTime, ...data } = original;
        void _id;
        void _creationTime;
        await ctx.db.insert('groupDiscordEnrollments', {
          ...data,
          personId: other.personId,
          discordUserId: `reader-${i}`,
        });
      });
    }
    await owner.auth.mutation(
      api.groupQuestionnaires.mutations.configureJoiningQuestionnaire,
      {
        groupId,
        enabled: true,
        requiredCompletion: true,
        questions: [
          {
            id: 'book',
            label: 'Favorite book',
            type: 'SHORT_ANSWER',
            required: true,
          },
        ],
      }
    );
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    expect(await t.run(ctx => ctx.db.get(enrollmentId))).toMatchObject({
      generation: 8,
      desired: 'removed',
      status: 'blocked',
    });
    const cleanup = await t.run(ctx =>
      ctx.db.query('groupDiscordCleanup').collect()
    );
    expect(cleanup).toHaveLength(count);
    const form = await member.auth.query(
      api.groupQuestionnaires.queries.getJoiningQuestionnaire,
      { groupId }
    );
    await member.auth.mutation(
      api.groupQuestionnaires.mutations.submitJoiningQuestionnaire,
      { groupId, version: form.version, answers: { book: 'Dune' } }
    );
    expect(await t.run(ctx => ctx.db.get(enrollmentId))).toMatchObject({
      generation: 8,
      desired: 'removed',
      status: 'blocked',
    });
    await t.run(ctx =>
      ctx.db.insert('groupDiscordConnections', {
        groupId,
        guildId: 'guild',
        guildName: 'Readers',
        mode: 'role',
        roleId: 'role',
        generation: 3,
        status: 'active',
        updatedAt: Date.now(),
      })
    );
    await t.mutation(components.betterAuth.adapter.create, {
      input: {
        model: 'account',
        data: {
          userId: member.user._id,
          providerId: 'discord',
          accountId: 'reader',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      },
    });
    expect(
      await member.auth.query(api.groupDiscord.enrollment.getStatus, {
        groupId,
      })
    ).toMatchObject({ eligible: true, status: 'blocked' });
    vi.stubEnv('DISCORD_BOT_TOKEN', 'bot-token');
    let rolePresent = true;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const path = String(input);
        if (init?.method === 'DELETE') {
          rolePresent = false;
          return new Response(null, { status: 204 });
        }
        if (init?.method === 'PUT') {
          rolePresent = true;
          return new Response(null, { status: 204 });
        }
        if (path.endsWith('/roles'))
          return new Response(
            JSON.stringify([
              { id: 'guild', permissions: '0', position: 0 },
              { id: 'role', permissions: '0', position: 1 },
              { id: 'bot-role', permissions: '268435584', position: 10 },
            ])
          );
        if (path.endsWith('/guilds/guild'))
          return new Response(JSON.stringify({ owner_id: 'other' }));
        if (path.endsWith('/members/bot'))
          return new Response(JSON.stringify({ roles: ['bot-role'] }));
        if (path.includes('/audit-logs'))
          return new Response(JSON.stringify({ audit_log_entries: [] }));
        if (path.endsWith('/users/@me'))
          return new Response(JSON.stringify({ id: 'bot' }));
        return path.includes('/bans/')
          ? new Response(JSON.stringify({ code: 10026 }), { status: 404 })
          : new Response(
              JSON.stringify({
                roles: rolePresent ? ['role'] : [],
                pending: false,
              })
            );
      })
    );
    await t.action(internal.groupDiscord.reconcile.dispatch, {});
    await member.auth.action(api.groupDiscord.connect.connect, {
      groupId,
      consent: true,
    });
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    expect(
      await member.auth.query(api.groupDiscord.enrollment.getStatus, {
        groupId,
      })
    ).toMatchObject({ eligible: true, status: 'connected' });
    expect(await t.run(ctx => ctx.db.get(enrollmentId))).toMatchObject({
      generation: 9,
      desired: 'granted',
    });
  }
);

it.each(['leave', 'remove'] as const)(
  '%s durably removes only the managed role, removes manual restoration, and retains permission failures for retry',
  async operation => {
    vi.useFakeTimers();
    vi.stubEnv('DISCORD_BOT_TOKEN', 'bot-token');
    const t = createTestInstance();
    registerBetterAuth(t);
    const owner = await createAuthAccount(t, 'cleanup-owner');
    const member = await createAuthAccount(t, 'cleanup-member');
    const groupId = await owner.auth.mutation(
      api.groups.mutations.createGroup,
      { name: 'Readers' }
    );
    const roles = new Set(['managed-role', 'independent-role']);
    let denied = false;
    const provider = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const path = String(input).replace('https://discord.com/api/v10', '');
        if (init?.method === 'DELETE') {
          expect(path).toBe('/guilds/guild/members/reader/roles/managed-role');
          if (denied)
            return new Response(JSON.stringify({ code: 50013 }), {
              status: 403,
            });
          roles.delete('managed-role');
          return new Response(null, { status: 204 });
        }
        if (path === '/users/@me')
          return new Response(JSON.stringify({ id: 'bot' }));
        if (path === '/guilds/guild/members/bot')
          return new Response(JSON.stringify({ roles: ['bot-role'] }));
        if (path === '/guilds/guild/roles')
          return new Response(
            JSON.stringify([
              { id: 'guild', permissions: '0', position: 0 },
              { id: 'managed-role', permissions: '0', position: 1 },
              { id: 'bot-role', permissions: '268435456', position: 10 },
            ])
          );
        if (path.includes('/audit-logs'))
          return new Response(JSON.stringify({ audit_log_entries: [] }));
        if (path === '/guilds/guild/members/reader')
          return new Response(JSON.stringify({ roles: [...roles] }));
        throw new Error(
          `Unexpected provider operation ${init?.method ?? 'GET'} ${path}`
        );
      }
    );
    vi.stubGlobal('fetch', provider);
    await t.run(async ctx => {
      await ctx.db.insert('groupMemberships', {
        groupId,
        personId: member.personId,
        role: 'MEMBER',
        joinedAt: Date.now(),
      });
      await ctx.db.insert('groupDiscordConnections', {
        groupId,
        guildId: 'guild',
        guildName: 'Readers',
        mode: 'role',
        roleId: 'managed-role',
        generation: 1,
        status: 'active',
        updatedAt: Date.now(),
      });
      await ctx.db.insert('groupDiscordEnrollments', {
        groupId,
        personId: member.personId,
        discordUserId: 'reader',
        guildId: 'guild',
        roleId: 'managed-role',
        connectionGeneration: 1,
        generation: 1,
        desired: 'granted',
        status: 'connected',
        startedAt: Date.now(),
        updatedAt: Date.now(),
        attempts: 0,
        nextAttemptAt: Date.now(),
      });
    });
    if (operation === 'leave')
      await member.auth.mutation(api.groupModeration.mutations.leaveGroup, {
        groupId,
      });
    else
      await owner.auth.mutation(
        api.groupModeration.mutations.removeGroupMember,
        { groupId, personId: member.personId }
      );
    await t.action(internal.groupDiscord.reconcile.dispatch, {});
    expect([...roles]).toEqual(['independent-role']);
    expect(
      await t.run(ctx => ctx.db.query('groupDiscordCleanup').collect())
    ).toEqual([
      expect.objectContaining({ status: 'completed', observed: 'absent' }),
    ]);

    roles.add('managed-role');
    vi.setSystemTime(Date.now() + 300001);
    await t.action(internal.groupDiscord.reconcile.dispatch, {});
    await t.action(internal.groupDiscord.reconcile.dispatch, {});
    expect([...roles]).toEqual(['independent-role']);

    roles.add('managed-role');
    denied = true;
    vi.setSystemTime(Date.now() + 300001);
    await t.action(internal.groupDiscord.reconcile.dispatch, {});
    await t.action(internal.groupDiscord.reconcile.dispatch, {});
    expect(roles.has('independent-role')).toBe(true);
    expect(roles.has('managed-role')).toBe(true);
    expect(
      await t.run(ctx => ctx.db.query('groupDiscordCleanup').collect())
    ).toContainEqual(
      expect.objectContaining({
        status: 'pending',
        error: expect.stringContaining('Manage Roles'),
      })
    );
    expect(
      provider.mock.calls
        .filter(([, init]) => init?.method && init.method !== 'GET')
        .every(([, init]) => init?.method === 'DELETE')
    ).toBe(true);
  }
);
