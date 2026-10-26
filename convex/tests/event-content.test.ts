import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, internal } from '../_generated/api';
import { createTestInstance as baseTestInstance } from './test_helpers';
import { createAuthAccount, registerBetterAuth } from './auth.helpers';
import { contentContext } from '../groupTools/context';
const instances: ReturnType<typeof baseTestInstance>[] = [];
beforeEach(() => vi.useFakeTimers());
afterEach(async () => {
  for (const t of instances.splice(0))
    await t.finishAllScheduledFunctions(() => vi.runAllTimers());
  vi.useRealTimers();
});
const paginationOpts = { numItems: 20, cursor: null };
const questions = [
  { id: 'meal', label: 'Meal', type: 'SHORT_ANSWER' as const, required: true },
];
const options = [
  { id: 'a', label: 'First' },
  { id: 'b', label: 'Second' },
];
async function fixture(prefix: string) {
  const t = baseTestInstance();
  instances.push(t);
  registerBetterAuth(t);
  const owner = await createAuthAccount(t, prefix + '-owner');
  const member = await createAuthAccount(t, prefix + '-member');
  const outsider = await createAuthAccount(t, prefix + '-outsider');
  const mod = await createAuthAccount(t, prefix + '-mod');
  const eventId = await t.run(async ctx => {
    const eventId = await ctx.db.insert('events', {
      potentialDateTimes: [],
      title: 'Shared content',
      description: '',
      location: '',
      creatorId: owner.personId,
      timezone: 'UTC',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    for (const [personId, role] of [
      [owner.personId, 'ORGANIZER'],
      [member.personId, 'ATTENDEE'],
      [mod.personId, 'MODERATOR'],
    ] as const)
      await ctx.db.insert('memberships', {
        eventId,
        personId,
        role,
        rsvpStatus: 'YES',
      });
    return eventId;
  });
  return { t, owner, member, outsider, mod, eventId };
}
describe('shared Event content adapters', () => {
  it('creates independent Event forms, lists and polls without synthetic Groups and scopes discovery', async () => {
    const { t, owner, member, eventId } = await fixture('event-content-create');
    const groupId = await owner.auth.mutation(
      api.groups.mutations.createGroup,
      { name: 'Separate Group' }
    );
    const old = await owner.auth.mutation(api.groupForms.mutations.createForm, {
      groupId,
      title: 'Group form',
      questions,
      resultsVisibility: 'MEMBERS',
    });
    const form = await owner.auth.mutation(
      api.eventContent.mutations.createForm,
      { eventId, title: 'Event form', questions, resultsVisibility: 'MEMBERS' }
    );
    const list = await member.auth.mutation(
      api.eventContent.mutations.createList,
      { eventId, title: 'Event list', resultsVisibility: 'MEMBERS' }
    );
    const poll = await owner.auth.mutation(
      api.eventContent.mutations.createPoll,
      {
        eventId,
        title: 'Event poll',
        mode: 'SINGLE',
        options,
        resultsVisibility: 'MEMBERS',
      }
    );
    expect(
      (
        await member.auth.query(api.eventContent.queries.listForms, {
          eventId,
          paginationOpts,
        })
      ).page.map(x => x._id)
    ).toEqual([form]);
    expect(
      (
        await member.auth.query(api.eventContent.queries.listLists, {
          eventId,
          paginationOpts,
        })
      ).page.map(x => x._id)
    ).toEqual([list]);
    expect(
      (
        await member.auth.query(api.eventContent.queries.listPolls, {
          eventId,
          paginationOpts,
        })
      ).page.map(x => x._id)
    ).toEqual([poll]);
    expect(
      (
        await owner.auth.query(api.groupForms.queries.listForms, {
          groupId,
          paginationOpts,
        })
      ).page.map(x => x._id)
    ).toEqual([old]);
    const saved = await t.run(ctx => ctx.db.get(form));
    expect(saved).toMatchObject({ eventId, creatorId: owner.personId });
    expect(saved?.groupId).toBeUndefined();
    expect(await t.run(ctx => ctx.db.query('groups').collect())).toHaveLength(
      1
    );
    await expect(
      t.query(internal.groupForms.rest.get, {
        groupId,
        personId: owner.personId,
        toolId: form,
      })
    ).rejects.toThrow('not found');
  });
  it('uses Event creation policy and rejects outsiders without granting creator moderation', async () => {
    const { t, owner, member, outsider, mod, eventId } = await fixture(
      'event-content-policy'
    );
    await t.run(ctx =>
      ctx.db.patch(eventId, { permissions: { createPosts: 'MODERATOR' } })
    );
    expect(
      await member.auth.query(api.eventContent.queries.getContext, { eventId })
    ).toMatchObject({ canCreate: false, canManage: false });
    await expect(
      member.auth.mutation(api.eventContent.mutations.createList, {
        eventId,
        title: 'No',
        resultsVisibility: 'MEMBERS',
      })
    ).rejects.toThrow('creation');
    await expect(
      outsider.auth.query(api.eventContent.queries.listForms, {
        eventId,
        paginationOpts,
      })
    ).rejects.toThrow('permission');
    await expect(
      outsider.auth.mutation(api.eventContent.mutations.createPoll, {
        eventId,
        title: 'No',
        mode: 'SINGLE',
        options,
        resultsVisibility: 'MEMBERS',
      })
    ).rejects.toThrow('permission');
    const toolId = await mod.auth.mutation(
      api.eventContent.mutations.createForm,
      { eventId, title: 'Managed', questions, resultsVisibility: 'MANAGERS' }
    );
    await expect(
      member.auth.query(api.groupForms.queries.getFormForManagement, { toolId })
    ).rejects.toThrow('permission');
    await member.auth.mutation(api.groupForms.mutations.submitResponse, {
      toolId,
      version: 1,
      expectedRevision: 0,
      answers: { meal: 'Soup' },
    });
    await expect(
      member.auth.query(api.groupForms.queries.listResults, {
        toolId,
        paginationOpts,
      })
    ).rejects.toThrow('permission');
    expect(
      (
        await owner.auth.query(api.groupForms.queries.listResults, {
          toolId,
          paginationOpts,
        })
      ).page
    ).toHaveLength(1);
  });
  it('preserves form snapshots and own recovery after Event membership loss', async () => {
    const { t, owner, member, outsider, eventId } =
      await fixture('event-content-form');
    const toolId = await owner.auth.mutation(
      api.eventContent.mutations.createForm,
      { eventId, title: 'Meal', questions, resultsVisibility: 'MEMBERS' }
    );
    await member.auth.mutation(api.groupForms.mutations.submitResponse, {
      toolId,
      version: 1,
      expectedRevision: 0,
      answers: { meal: 'Soup' },
    });
    await owner.auth.mutation(api.groupForms.mutations.configureForm, {
      toolId,
      version: 1,
      title: 'Meal update',
      questions: [
        { id: 'rating', label: 'Rating', type: 'NUMBER', required: true },
      ],
    });
    await expect(
      member.auth.mutation(api.groupForms.mutations.submitResponse, {
        toolId,
        version: 1,
        expectedRevision: 1,
        answers: { meal: 'Other' },
      })
    ).rejects.toThrow('configuration changed');
    await t.run(async ctx => {
      const m = await ctx.db
        .query('memberships')
        .withIndex('by_person_event', q =>
          q.eq('personId', member.personId).eq('eventId', eventId)
        )
        .unique();
      await ctx.db.delete(m!._id);
    });
    await expect(
      member.auth.query(api.groupForms.queries.getForm, { toolId })
    ).rejects.toThrow('permission');
    expect(
      (
        await member.auth.query(api.groupForms.queries.getOwnHistory, {
          toolId,
          paginationOpts,
        })
      ).page[0]
    ).toMatchObject({ eventId, questions, answers: { meal: 'Soup' } });
    expect(
      (
        await outsider.auth.query(api.groupForms.queries.getOwnHistory, {
          toolId,
          paginationOpts,
        })
      ).page
    ).toEqual([]);
    await member.auth.mutation(api.groupForms.mutations.removeResponse, {
      toolId,
    });
    expect(
      (
        await owner.auth.query(api.groupForms.queries.listResults, {
          toolId,
          paginationOpts,
        })
      ).page
    ).toEqual([]);
  });
  it('keeps poll semantic history and manager moderation in the stored Event', async () => {
    const { owner, member, outsider, eventId } =
      await fixture('event-content-poll');
    const toolId = await owner.auth.mutation(
      api.eventContent.mutations.createPoll,
      {
        eventId,
        title: 'Choose',
        mode: 'SINGLE',
        options,
        resultsVisibility: 'MEMBERS',
      }
    );
    await member.auth.mutation(api.groupPolls.mutations.submitVote, {
      toolId,
      version: 1,
      expectedRevision: 0,
      selections: ['a'],
    });
    await owner.auth.mutation(api.groupPolls.mutations.configurePoll, {
      toolId,
      version: 1,
      title: 'New options',
      mode: 'SINGLE',
      options: [options[0], { id: 'c', label: 'Third' }],
    });
    const result = (
      await owner.auth.query(api.groupPolls.queries.listResults, {
        toolId,
        paginationOpts,
      })
    ).page[0];
    expect(result.isCurrent).toBe(false);
    expect(
      (
        await member.auth.query(api.groupPolls.queries.getOwnHistory, {
          toolId,
          paginationOpts,
        })
      ).page[0]
    ).toMatchObject({ eventId, options, selections: ['a'] });
    await expect(
      outsider.auth.mutation(api.groupPolls.mutations.removeResult, {
        voteId: result._id,
        expectedRevision: 1,
      })
    ).rejects.toThrow('permission');
    await owner.auth.mutation(api.groupPolls.mutations.removeResult, {
      voteId: result._id,
      expectedRevision: 1,
    });
    expect(
      (
        await member.auth.query(api.groupPolls.queries.getOwnHistory, {
          toolId,
          paginationOpts,
        })
      ).page
    ).toEqual([]);
  });
  it('retains List idempotency, authorship and recovery without touching legacy Bring List claims', async () => {
    const { t, owner, member, outsider, eventId } =
      await fixture('event-content-list');
    const addon = { eventId, addonType: 'bring-list' };
    const key = `claims:${member.personId}`;
    await owner.auth.mutation(api.addons.mutations.enableAddon, {
      ...addon,
      config: { items: [{ id: 'chips', name: 'Chips', quantity: 3 }] },
    });
    await member.auth.mutation(api.addons.mutations.setAddonData, {
      ...addon,
      key,
      data: { chips: 2 },
    });
    const legacy = {
      config: await member.auth.query(api.addons.queries.getAddonConfig, addon),
      claim: await member.auth.query(api.addons.queries.getAddonDataByKey, {
        ...addon,
        key,
      }),
    };
    expect(legacy.config).toMatchObject({
      enabled: true,
      config: { items: [{ id: 'chips', name: 'Chips', quantity: 3 }] },
    });
    expect(legacy.claim).toMatchObject({
      key,
      data: { chips: 2 },
      createdBy: member.personId,
    });
    const toolId = await member.auth.mutation(
      api.eventContent.mutations.createList,
      { eventId, title: 'Tasks', resultsVisibility: 'MEMBERS' }
    );
    const input = {
      toolId,
      version: 1,
      requestId: `${Date.now()}.12345678-1234-4123-8123-123456789abc`,
      text: 'Bring games',
    };
    const first = await member.auth.mutation(
      api.groupLists.mutations.addEntry,
      input
    );
    expect(
      await member.auth.mutation(api.groupLists.mutations.addEntry, input)
    ).toEqual(first);
    await expect(
      outsider.auth.mutation(api.groupLists.mutations.editEntry, {
        entryId: first.entryId,
        version: 1,
        expectedRevision: 1,
        text: 'Changed',
        completed: true,
      })
    ).rejects.toThrow('permission');
    await owner.auth.mutation(api.groupLists.mutations.editEntry, {
      entryId: first.entryId,
      version: 1,
      expectedRevision: 1,
      text: 'Bring games',
      completed: true,
    });
    expect(
      (
        await owner.auth.query(api.groupLists.queries.listEntries, {
          toolId,
          paginationOpts,
        })
      ).page[0]
    ).toMatchObject({ eventId, completed: true, revision: 2 });
    await t.run(async ctx => {
      const m = await ctx.db
        .query('memberships')
        .withIndex('by_person_event', q =>
          q.eq('personId', member.personId).eq('eventId', eventId)
        )
        .unique();
      await ctx.db.delete(m!._id);
    });
    expect(
      (
        await member.auth.query(api.groupLists.queries.getOwnEntries, {
          toolId,
          paginationOpts,
        })
      ).page
    ).toHaveLength(1);
    await member.auth.mutation(api.groupLists.mutations.removeEntry, {
      entryId: first.entryId,
      expectedRevision: 2,
    });
    // The legacy route's own queries still expose the exact saved quantity claims.
    expect({
      config: await owner.auth.query(api.addons.queries.getAddonConfig, addon),
      claim: await owner.auth.query(api.addons.queries.getAddonDataByKey, {
        ...addon,
        key,
      }),
    }).toEqual(legacy);
    expect(
      await owner.auth.query(api.addons.queries.getAddonData, addon)
    ).toEqual([legacy.claim]);
  });
  it('purges only Event-owned tools when deleting an Event', async () => {
    const { t, owner, eventId } = await fixture('event-content-cleanup');
    const groupId = await owner.auth.mutation(
      api.groups.mutations.createGroup,
      { name: 'Unrelated' }
    );
    const groupTool = await owner.auth.mutation(
      api.groupLists.mutations.createList,
      { groupId, title: 'Keep', resultsVisibility: 'MEMBERS' }
    );
    const toolId = await owner.auth.mutation(
      api.eventContent.mutations.createForm,
      { eventId, title: 'Delete', questions, resultsVisibility: 'MEMBERS' }
    );
    await owner.auth.mutation(api.groupForms.mutations.submitResponse, {
      toolId,
      version: 1,
      expectedRevision: 0,
      answers: { meal: 'Soup' },
    });
    await owner.auth.mutation(api.events.mutations.deleteEvent, { eventId });
    expect(await t.run(ctx => ctx.db.get(toolId))).toBeNull();
    expect(await t.run(ctx => ctx.db.get(groupTool))).not.toBeNull();
    expect(
      await t.run(ctx => ctx.db.query('groupFormResponses').collect())
    ).toEqual([]);
    expect(
      await t.run(ctx => ctx.db.query('groupFormRevisions').collect())
    ).toEqual([]);
  });
  it('denies excluded Event members even when their membership and manager role remain', async () => {
    const { t, owner, mod, eventId } = await fixture('event-content-excluded');
    const groupId = await owner.auth.mutation(
      api.groups.mutations.createGroup,
      { name: 'Community' }
    );
    const toolId = await owner.auth.mutation(
      api.eventContent.mutations.createList,
      { eventId, title: 'Protected', resultsVisibility: 'MEMBERS' }
    );
    await t.run(ctx =>
      ctx.db.insert('communityExclusions', {
        groupId,
        personId: mod.personId,
        actorId: owner.personId,
        active: true,
        generation: 1,
        operationId: 'event-content-exclusion',
        eventIds: [eventId],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        cleanup: 'complete',
        conflicts: [],
      })
    );
    await expect(
      mod.auth.query(api.eventContent.queries.getContext, { eventId })
    ).rejects.toThrow('exclusion');
    await expect(
      mod.auth.query(api.groupLists.queries.getList, { toolId })
    ).rejects.toThrow('exclusion');
    await expect(
      mod.auth.mutation(api.groupLists.mutations.deleteList, { toolId })
    ).rejects.toThrow('exclusion');
    await expect(
      mod.auth.mutation(api.eventContent.mutations.createForm, {
        eventId,
        title: 'Denied',
        questions,
        resultsVisibility: 'MEMBERS',
      })
    ).rejects.toThrow('exclusion');
  });
  it('rejects ambiguous or missing ownership at the shared creation seam', async () => {
    const { eventId, owner } = await fixture('event-content-context');
    const groupId = await owner.auth.mutation(
      api.groups.mutations.createGroup,
      { name: 'Context' }
    );
    expect(() => contentContext({ eventId, groupId })).toThrow('exactly one');
    expect(() => contentContext({})).toThrow('exactly one');
  });
});
