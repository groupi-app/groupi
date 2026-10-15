import { describe, expect, it } from 'vitest';
import { api } from '../_generated/api';
import { createTestInstance } from './test_helpers';
import { createAuthAccount, registerBetterAuth } from './auth.helpers';

describe('Group ownership through authenticated sessions', () => {
  it('creates an owner-only Group with a stable identity and private owner authority', async () => {
    const t = createTestInstance();
    registerBetterAuth(t);
    const owner = await createAuthAccount(t, 'group-owner');
    const outsider = await createAuthAccount(t, 'group-outsider');
    const groupId = await owner.auth.mutation(
      api.groups.mutations.createGroup,
      { name: '  Book club  ' }
    );
    expect(
      await owner.auth.query(api.groups.queries.getGroup, { groupId })
    ).toMatchObject({
      _id: groupId,
      name: 'Book club',
      role: 'OWNER',
      memberCount: 1,
    });
    expect(
      await outsider.auth.query(api.groups.queries.getGroup, { groupId })
    ).toBeNull();
    expect(
      await t.query(api.groups.queries.getGroupLanding, { groupId })
    ).toEqual({ groupId, name: 'Book club', description: null, image: null });
    await expect(
      outsider.auth.mutation(api.groups.mutations.updateGroup, {
        groupId,
        name: 'Stolen',
      })
    ).rejects.toThrow('Only the Group owner');
    await owner.auth.mutation(api.groups.mutations.updateGroup, {
      groupId,
      name: 'Readers',
    });
    expect(
      await t.query(api.groups.queries.getGroupLanding, { groupId })
    ).toMatchObject({ groupId, name: 'Readers' });
    await expect(
      owner.auth.mutation(api.users.mutations.deleteUserAccount, {
        confirmation: 'group-owner',
      })
    ).rejects.toThrow('Resolve owned Groups');
    await owner.auth.mutation(api.groups.mutations.deleteGroup, { groupId });
    expect(
      await t.query(api.groups.queries.getGroupLanding, { groupId })
    ).toBeNull();
    expect(
      (
        await owner.auth.query(api.groups.queries.listGroups, {
          paginationOpts: { cursor: null, numItems: 20 },
        })
      ).page
    ).toEqual([]);
  });
  it('validates trimmed Group identity and allows duplicate display names', async () => {
    const t = createTestInstance();
    registerBetterAuth(t);
    const owner = await createAuthAccount(t, 'validation-owner');
    for (const name of ['   ', 'a'.repeat(101)])
      await expect(
        owner.auth.mutation(api.groups.mutations.createGroup, { name })
      ).rejects.toThrow('1–100');
    await expect(
      owner.auth.mutation(api.groups.mutations.createGroup, {
        name: 'Readers',
        image: 'javascript:alert(1)',
      })
    ).rejects.toThrow('HTTPS');
    await expect(
      owner.auth.mutation(api.groups.mutations.createGroup, {
        name: 'Readers',
        description: 'a'.repeat(2001),
      })
    ).rejects.toThrow('2000');
    await expect(
      t.mutation(api.groups.mutations.createGroup, { name: 'Anonymous' })
    ).rejects.toThrow();
    const first = await owner.auth.mutation(api.groups.mutations.createGroup, {
      name: 'Readers',
    });
    const second = await owner.auth.mutation(api.groups.mutations.createGroup, {
      name: 'Readers',
    });
    expect(first).not.toBe(second);
    expect(
      (
        await owner.auth.query(api.groups.queries.listGroups, {
          paginationOpts: { numItems: 20, cursor: null },
        })
      ).page
    ).toHaveLength(2);
  });
  it('account deletion leaves another owner’s Group intact and removes the deleted member', async () => {
    const t = createTestInstance();
    registerBetterAuth(t);
    const owner = await createAuthAccount(t, 'remaining-owner');
    const member = await createAuthAccount(t, 'deleting-member');
    const groupId = await owner.auth.mutation(
      api.groups.mutations.createGroup,
      { name: 'Persistent' }
    );
    // Seed the future admitted-member state; exercise deletion only through the public boundary.
    await t.run(async ctx => {
      await ctx.db.insert('groupMemberships', {
        groupId,
        personId: member.personId,
        role: 'MEMBER',
        joinedAt: Date.now(),
      });
      await ctx.db.patch(groupId, { memberCount: 2 });
    });
    expect(
      await member.auth.query(api.groups.queries.getGroup, { groupId })
    ).toMatchObject({
      viewerRole: 'MEMBER',
      canManageIdentity: false,
      memberCount: 2,
    });
    await member.auth.mutation(api.users.mutations.deleteUserAccount, {
      confirmation: 'deleting-member',
    });
    expect(
      await owner.auth.query(api.groups.queries.getGroup, { groupId })
    ).toMatchObject({
      name: 'Persistent',
      memberCount: 1,
      canManageIdentity: true,
    });
    expect(
      await t.query(api.groups.queries.getGroupLanding, { groupId })
    ).toMatchObject({ name: 'Persistent' });
  });
});
