import { expect, test, describe } from 'vitest';
import { api } from './_generated/api';
import {
  createTestInstance,
  createTestUser,
  createAuthenticatedUser,
} from './test_helpers';

describe('Blocking & Privacy', () => {
  describe('blockUser', () => {
    test('should block a user', async () => {
      const t = createTestInstance();

      const { userId: user1Id } = await createTestUser(t, {
        email: 'user1@example.com',
        username: 'user1',
      });
      const { personId: person2Id } = await createTestUser(t, {
        email: 'user2@example.com',
        username: 'user2',
      });

      const user1Auth = createAuthenticatedUser(t, user1Id);

      const result = await user1Auth.mutation(api.friends.mutations.blockUser, {
        personId: person2Id,
      });

      expect(result.success).toBe(true);

      // Verify block exists
      const { blocks } = await t.run(async ctx => {
        const blocks = await ctx.db.query('userBlocks').collect();
        return { blocks };
      });

      expect(blocks).toHaveLength(1);
      expect(blocks[0].blockedId).toBe(person2Id);
    });

    test('should remove existing friendship when blocking', async () => {
      const t = createTestInstance();

      const { userId: user1Id } = await createTestUser(t, {
        email: 'user1@example.com',
        username: 'user1',
      });
      const { userId: user2Id, personId: person2Id } = await createTestUser(t, {
        email: 'user2@example.com',
        username: 'user2',
      });

      const user1Auth = createAuthenticatedUser(t, user1Id);
      const user2Auth = createAuthenticatedUser(t, user2Id);

      // Create friendship first
      const sendResult = await user1Auth.mutation(
        api.friends.mutations.sendFriendRequest,
        { addresseePersonId: person2Id }
      );
      await user2Auth.mutation(api.friends.mutations.acceptFriendRequest, {
        friendshipId: sendResult.friendshipId,
      });

      // Block user2
      await user1Auth.mutation(api.friends.mutations.blockUser, {
        personId: person2Id,
      });

      // Verify friendship was deleted
      const { friendship } = await t.run(async ctx => {
        const friendship = await ctx.db.get(sendResult.friendshipId);
        return { friendship };
      });

      expect(friendship).toBeNull();
    });

    test('should not allow blocking yourself', async () => {
      const t = createTestInstance();

      const { userId, personId } = await createTestUser(t, {
        email: 'user@example.com',
        username: 'user',
      });

      const userAuth = createAuthenticatedUser(t, userId);

      await expect(
        userAuth.mutation(api.friends.mutations.blockUser, {
          personId,
        })
      ).rejects.toThrow('block yourself');
    });

    test('should not allow double blocking', async () => {
      const t = createTestInstance();

      const { userId: user1Id } = await createTestUser(t, {
        email: 'user1@example.com',
        username: 'user1',
      });
      const { personId: person2Id } = await createTestUser(t, {
        email: 'user2@example.com',
        username: 'user2',
      });

      const user1Auth = createAuthenticatedUser(t, user1Id);

      await user1Auth.mutation(api.friends.mutations.blockUser, {
        personId: person2Id,
      });

      await expect(
        user1Auth.mutation(api.friends.mutations.blockUser, {
          personId: person2Id,
        })
      ).rejects.toThrow('already blocked');
    });
  });

  describe('unblockUser', () => {
    test('should unblock a user', async () => {
      const t = createTestInstance();

      const { userId: user1Id } = await createTestUser(t, {
        email: 'user1@example.com',
        username: 'user1',
      });
      const { personId: person2Id } = await createTestUser(t, {
        email: 'user2@example.com',
        username: 'user2',
      });

      const user1Auth = createAuthenticatedUser(t, user1Id);

      // Block then unblock
      await user1Auth.mutation(api.friends.mutations.blockUser, {
        personId: person2Id,
      });
      const result = await user1Auth.mutation(
        api.friends.mutations.unblockUser,
        { personId: person2Id }
      );

      expect(result.success).toBe(true);

      // Verify block was removed
      const { blocks } = await t.run(async ctx => {
        const blocks = await ctx.db.query('userBlocks').collect();
        return { blocks };
      });

      expect(blocks).toHaveLength(0);
    });

    test('should fail if user is not blocked', async () => {
      const t = createTestInstance();

      const { userId: user1Id } = await createTestUser(t, {
        email: 'user1@example.com',
        username: 'user1',
      });
      const { personId: person2Id } = await createTestUser(t, {
        email: 'user2@example.com',
        username: 'user2',
      });

      const user1Auth = createAuthenticatedUser(t, user1Id);

      await expect(
        user1Auth.mutation(api.friends.mutations.unblockUser, {
          personId: person2Id,
        })
      ).rejects.toThrow('not blocked');
    });
  });

  describe('getBlockStatus', () => {
    test('should return block status', async () => {
      const t = createTestInstance();

      const { userId: user1Id } = await createTestUser(t, {
        email: 'user1@example.com',
        username: 'user1',
      });
      const { personId: person2Id } = await createTestUser(t, {
        email: 'user2@example.com',
        username: 'user2',
      });

      const user1Auth = createAuthenticatedUser(t, user1Id);

      // Initially no blocks
      const initialStatus = await user1Auth.query(
        api.friends.queries.getBlockStatus,
        { targetPersonId: person2Id }
      );
      expect(initialStatus.blockedByMe).toBe(false);
      expect(initialStatus.blockedByThem).toBe(false);

      // Block user2
      await user1Auth.mutation(api.friends.mutations.blockUser, {
        personId: person2Id,
      });

      // Check status after blocking
      const afterBlock = await user1Auth.query(
        api.friends.queries.getBlockStatus,
        { targetPersonId: person2Id }
      );
      expect(afterBlock.blockedByMe).toBe(true);
      expect(afterBlock.blockedByThem).toBe(false);
    });
  });

  describe('privacy enforcement on friend requests', () => {
    test('should block friend request when blocked', async () => {
      const t = createTestInstance();

      const { userId: user1Id, personId: person1Id } = await createTestUser(t, {
        email: 'user1@example.com',
        username: 'user1',
      });
      const { userId: user2Id } = await createTestUser(t, {
        email: 'user2@example.com',
        username: 'user2',
      });

      const user1Auth = createAuthenticatedUser(t, user1Id);
      const user2Auth = createAuthenticatedUser(t, user2Id);

      // User2 blocks User1
      await user2Auth.mutation(api.friends.mutations.blockUser, {
        personId: person1Id,
      });

      // User1 tries to send friend request - should fail
      await expect(
        user1Auth.mutation(api.friends.mutations.sendFriendRequest, {
          addresseePersonId: await t.run(async ctx => {
            const person = await ctx.db
              .query('persons')
              .withIndex('by_user_id', q => q.eq('userId', user2Id))
              .first();
            return person!._id;
          }),
        })
      ).rejects.toThrow('not accepting friend requests');
    });

    test('should enforce NO_ONE privacy setting', async () => {
      const t = createTestInstance();

      const { userId: user1Id } = await createTestUser(t, {
        email: 'user1@example.com',
        username: 'user1',
      });
      const { userId: user2Id, personId: person2Id } = await createTestUser(t, {
        email: 'user2@example.com',
        username: 'user2',
      });

      const user1Auth = createAuthenticatedUser(t, user1Id);
      const user2Auth = createAuthenticatedUser(t, user2Id);

      // User2 sets privacy to NO_ONE
      await user2Auth.mutation(api.settings.mutations.savePrivacySettings, {
        allowFriendRequestsFrom: 'NO_ONE',
        allowEventInvitesFrom: 'EVERYONE',
      });

      // User1 tries to send friend request - should fail
      await expect(
        user1Auth.mutation(api.friends.mutations.sendFriendRequest, {
          addresseePersonId: person2Id,
        })
      ).rejects.toThrow('not accepting friend requests');
    });
  });

  describe('savePrivacySettings', () => {
    test('should save privacy settings', async () => {
      const t = createTestInstance();

      const { userId, personId } = await createTestUser(t, {
        email: 'user@example.com',
        username: 'user',
      });

      const userAuth = createAuthenticatedUser(t, userId);

      const result = await userAuth.mutation(
        api.settings.mutations.savePrivacySettings,
        {
          allowFriendRequestsFrom: 'EVENT_MEMBERS',
          allowEventInvitesFrom: 'FRIENDS',
        }
      );

      expect(result.success).toBe(true);

      // Verify settings
      const { settings } = await t.run(async ctx => {
        const settings = await ctx.db
          .query('personSettings')
          .withIndex('by_person', q => q.eq('personId', personId))
          .first();
        return { settings };
      });

      expect(settings?.allowFriendRequestsFrom).toBe('EVENT_MEMBERS');
      expect(settings?.allowEventInvitesFrom).toBe('FRIENDS');
    });

    test('should update existing privacy settings', async () => {
      const t = createTestInstance();

      const { userId, personId } = await createTestUser(t, {
        email: 'user@example.com',
        username: 'user',
      });

      const userAuth = createAuthenticatedUser(t, userId);

      // Create initial settings
      await userAuth.mutation(api.settings.mutations.savePrivacySettings, {
        allowFriendRequestsFrom: 'NO_ONE',
        allowEventInvitesFrom: 'NO_ONE',
      });

      // Update
      await userAuth.mutation(api.settings.mutations.savePrivacySettings, {
        allowFriendRequestsFrom: 'EVERYONE',
        allowEventInvitesFrom: 'EVERYONE',
      });

      const { settings } = await t.run(async ctx => {
        const settings = await ctx.db
          .query('personSettings')
          .withIndex('by_person', q => q.eq('personId', personId))
          .first();
        return { settings };
      });

      expect(settings?.allowFriendRequestsFrom).toBe('EVERYONE');
      expect(settings?.allowEventInvitesFrom).toBe('EVERYONE');
    });
  });
});
