import { expect, test, describe } from 'vitest';
import { api } from './_generated/api';
import {
  createTestInstance,
  createTestUser,
  createAuthenticatedUser,
} from './test_helpers';

describe('Friends Feature', () => {
  describe('Friend Requests', () => {
    test('should send a friend request', async () => {
      const t = createTestInstance();

      // Create two users
      const { userId: user1Id, personId: person1Id } = await createTestUser(t, {
        email: 'user1@example.com',
        username: 'user1',
      });
      const { userId: _user2Id, personId: person2Id } = await createTestUser(
        t,
        {
          email: 'user2@example.com',
          username: 'user2',
        }
      );

      const user1Auth = createAuthenticatedUser(t, user1Id);

      // Send friend request
      const result = await user1Auth.mutation(
        api.friends.mutations.sendFriendRequest,
        { addresseePersonId: person2Id }
      );

      expect(result.status).toBe('PENDING');
      expect(result.friendshipId).toBeDefined();
      expect(result.message).toBe('Friend request sent');

      // Verify friendship exists in database
      const { friendship } = await t.run(async ctx => {
        const friendship = await ctx.db.get(result.friendshipId);
        return { friendship };
      });

      expect(friendship).toBeTruthy();
      expect(friendship!.requesterId).toBe(person1Id);
      expect(friendship!.addresseeId).toBe(person2Id);
      expect(friendship!.status).toBe('PENDING');
    });

    test('should create notification when friend request is sent', async () => {
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

      await user1Auth.mutation(api.friends.mutations.sendFriendRequest, {
        addresseePersonId: person2Id,
      });

      // Verify notification was created
      const { notifications } = await t.run(async ctx => {
        const notifications = await ctx.db.query('notifications').collect();
        return { notifications };
      });

      const friendRequestNotification = notifications.find(
        n => n.type === 'FRIEND_REQUEST_RECEIVED' && n.personId === person2Id
      );
      expect(friendRequestNotification).toBeTruthy();
    });

    test('should not allow sending friend request to yourself', async () => {
      const t = createTestInstance();

      const { userId, personId } = await createTestUser(t, {
        email: 'user@example.com',
        username: 'user',
      });

      const userAuth = createAuthenticatedUser(t, userId);

      await expect(
        userAuth.mutation(api.friends.mutations.sendFriendRequest, {
          addresseePersonId: personId,
        })
      ).rejects.toThrow("You can't send a friend request to yourself");
    });

    test('should not allow duplicate friend requests', async () => {
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

      // First request
      await user1Auth.mutation(api.friends.mutations.sendFriendRequest, {
        addresseePersonId: person2Id,
      });

      // Second request should fail
      await expect(
        user1Auth.mutation(api.friends.mutations.sendFriendRequest, {
          addresseePersonId: person2Id,
        })
      ).rejects.toThrow('Friend request already sent');
    });

    test('should auto-accept if target already sent a request', async () => {
      const t = createTestInstance();

      const { userId: user1Id, personId: person1Id } = await createTestUser(t, {
        email: 'user1@example.com',
        username: 'user1',
      });
      const { userId: user2Id, personId: person2Id } = await createTestUser(t, {
        email: 'user2@example.com',
        username: 'user2',
      });

      const user1Auth = createAuthenticatedUser(t, user1Id);
      const user2Auth = createAuthenticatedUser(t, user2Id);

      // User1 sends request to User2
      await user1Auth.mutation(api.friends.mutations.sendFriendRequest, {
        addresseePersonId: person2Id,
      });

      // User2 sends request to User1 - should auto-accept
      const result = await user2Auth.mutation(
        api.friends.mutations.sendFriendRequest,
        { addresseePersonId: person1Id }
      );

      expect(result.status).toBe('ACCEPTED');
      expect(result.message).toBe('Friend request accepted');
    });
  });

  describe('Accept/Decline Requests', () => {
    test('should accept a friend request', async () => {
      const t = createTestInstance();

      const { userId: user1Id, personId: person1Id } = await createTestUser(t, {
        email: 'user1@example.com',
        username: 'user1',
      });
      const { userId: user2Id, personId: person2Id } = await createTestUser(t, {
        email: 'user2@example.com',
        username: 'user2',
      });

      const user1Auth = createAuthenticatedUser(t, user1Id);
      const user2Auth = createAuthenticatedUser(t, user2Id);

      // User1 sends request
      const sendResult = await user1Auth.mutation(
        api.friends.mutations.sendFriendRequest,
        { addresseePersonId: person2Id }
      );

      // User2 accepts
      const acceptResult = await user2Auth.mutation(
        api.friends.mutations.acceptFriendRequest,
        { friendshipId: sendResult.friendshipId }
      );

      expect(acceptResult.success).toBe(true);
      expect(acceptResult.message).toBe('Friend request accepted');

      // Verify friendship status updated
      const { friendship } = await t.run(async ctx => {
        const friendship = await ctx.db.get(sendResult.friendshipId);
        return { friendship };
      });

      expect(friendship!.status).toBe('ACCEPTED');

      // Verify notification was created for user1
      const { notifications } = await t.run(async ctx => {
        const notifications = await ctx.db.query('notifications').collect();
        return { notifications };
      });

      const acceptedNotification = notifications.find(
        n => n.type === 'FRIEND_REQUEST_ACCEPTED' && n.personId === person1Id
      );
      expect(acceptedNotification).toBeTruthy();
    });

    test('should decline a friend request', async () => {
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

      // User1 sends request
      const sendResult = await user1Auth.mutation(
        api.friends.mutations.sendFriendRequest,
        { addresseePersonId: person2Id }
      );

      // User2 declines
      const declineResult = await user2Auth.mutation(
        api.friends.mutations.declineFriendRequest,
        { friendshipId: sendResult.friendshipId }
      );

      expect(declineResult.success).toBe(true);

      // Verify friendship status updated
      const { friendship } = await t.run(async ctx => {
        const friendship = await ctx.db.get(sendResult.friendshipId);
        return { friendship };
      });

      expect(friendship!.status).toBe('DECLINED');
    });

    test('should not allow non-addressee to accept request', async () => {
      const t = createTestInstance();

      const { userId: user1Id } = await createTestUser(t, {
        email: 'user1@example.com',
        username: 'user1',
      });
      const { personId: person2Id } = await createTestUser(t, {
        email: 'user2@example.com',
        username: 'user2',
      });
      const { userId: user3Id } = await createTestUser(t, {
        email: 'user3@example.com',
        username: 'user3',
      });

      const user1Auth = createAuthenticatedUser(t, user1Id);
      const user3Auth = createAuthenticatedUser(t, user3Id);

      // User1 sends request to User2
      const sendResult = await user1Auth.mutation(
        api.friends.mutations.sendFriendRequest,
        { addresseePersonId: person2Id }
      );

      // User3 tries to accept - should fail
      await expect(
        user3Auth.mutation(api.friends.mutations.acceptFriendRequest, {
          friendshipId: sendResult.friendshipId,
        })
      ).rejects.toThrow("You can't accept this friend request");
    });
  });

  describe('Cancel Request', () => {
    test('should cancel a sent friend request', async () => {
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

      // User1 sends request
      const sendResult = await user1Auth.mutation(
        api.friends.mutations.sendFriendRequest,
        { addresseePersonId: person2Id }
      );

      // User1 cancels
      const cancelResult = await user1Auth.mutation(
        api.friends.mutations.cancelFriendRequest,
        { friendshipId: sendResult.friendshipId }
      );

      expect(cancelResult.success).toBe(true);

      // Verify friendship deleted
      const { friendship } = await t.run(async ctx => {
        const friendship = await ctx.db.get(sendResult.friendshipId);
        return { friendship };
      });

      expect(friendship).toBeNull();
    });

    test('should not allow non-requester to cancel', async () => {
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

      // User1 sends request
      const sendResult = await user1Auth.mutation(
        api.friends.mutations.sendFriendRequest,
        { addresseePersonId: person2Id }
      );

      // User2 tries to cancel - should fail
      await expect(
        user2Auth.mutation(api.friends.mutations.cancelFriendRequest, {
          friendshipId: sendResult.friendshipId,
        })
      ).rejects.toThrow("You can't cancel this friend request");
    });
  });

  describe('Remove Friend', () => {
    test('should remove a friend', async () => {
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

      // Create friendship
      const sendResult = await user1Auth.mutation(
        api.friends.mutations.sendFriendRequest,
        { addresseePersonId: person2Id }
      );
      await user2Auth.mutation(api.friends.mutations.acceptFriendRequest, {
        friendshipId: sendResult.friendshipId,
      });

      // User1 removes friend
      const removeResult = await user1Auth.mutation(
        api.friends.mutations.removeFriend,
        { friendshipId: sendResult.friendshipId }
      );

      expect(removeResult.success).toBe(true);

      // Verify friendship deleted
      const { friendship } = await t.run(async ctx => {
        const friendship = await ctx.db.get(sendResult.friendshipId);
        return { friendship };
      });

      expect(friendship).toBeNull();
    });

    test('should allow either party to remove friendship', async () => {
      const t = createTestInstance();

      const { userId: user1Id, personId: _person1Id } = await createTestUser(
        t,
        {
          email: 'user1@example.com',
          username: 'user1',
        }
      );
      const { userId: user2Id, personId: person2Id } = await createTestUser(t, {
        email: 'user2@example.com',
        username: 'user2',
      });

      const user1Auth = createAuthenticatedUser(t, user1Id);
      const user2Auth = createAuthenticatedUser(t, user2Id);

      // Create friendship
      const sendResult = await user1Auth.mutation(
        api.friends.mutations.sendFriendRequest,
        { addresseePersonId: person2Id }
      );
      await user2Auth.mutation(api.friends.mutations.acceptFriendRequest, {
        friendshipId: sendResult.friendshipId,
      });

      // User2 (addressee) removes friend
      const removeResult = await user2Auth.mutation(
        api.friends.mutations.removeFriend,
        { friendshipId: sendResult.friendshipId }
      );

      expect(removeResult.success).toBe(true);
    });

    test('should remove friend by person ID', async () => {
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

      // Create friendship
      const sendResult = await user1Auth.mutation(
        api.friends.mutations.sendFriendRequest,
        { addresseePersonId: person2Id }
      );
      await user2Auth.mutation(api.friends.mutations.acceptFriendRequest, {
        friendshipId: sendResult.friendshipId,
      });

      // Remove by person ID
      const removeResult = await user1Auth.mutation(
        api.friends.mutations.removeFriendByPersonId,
        { personId: person2Id }
      );

      expect(removeResult.success).toBe(true);
    });
  });

  describe('Queries', () => {
    test('should get list of friends', async () => {
      const t = createTestInstance();

      const { userId: user1Id } = await createTestUser(t, {
        email: 'user1@example.com',
        username: 'user1',
      });
      const { userId: user2Id, personId: person2Id } = await createTestUser(t, {
        email: 'user2@example.com',
        username: 'user2',
      });
      const { userId: user3Id, personId: person3Id } = await createTestUser(t, {
        email: 'user3@example.com',
        username: 'user3',
      });

      const user1Auth = createAuthenticatedUser(t, user1Id);
      const user2Auth = createAuthenticatedUser(t, user2Id);
      const user3Auth = createAuthenticatedUser(t, user3Id);

      // User1 befriends User2
      const friend2Result = await user1Auth.mutation(
        api.friends.mutations.sendFriendRequest,
        { addresseePersonId: person2Id }
      );
      await user2Auth.mutation(api.friends.mutations.acceptFriendRequest, {
        friendshipId: friend2Result.friendshipId,
      });

      // User1 befriends User3
      const friend3Result = await user1Auth.mutation(
        api.friends.mutations.sendFriendRequest,
        { addresseePersonId: person3Id }
      );
      await user3Auth.mutation(api.friends.mutations.acceptFriendRequest, {
        friendshipId: friend3Result.friendshipId,
      });

      // Query friends
      const friends = await user1Auth.query(api.friends.queries.getFriends, {});

      expect(friends).toHaveLength(2);
      const friendPersonIds = friends.map(f => f.personId);
      expect(friendPersonIds).toContain(person2Id);
      expect(friendPersonIds).toContain(person3Id);
    });

    test('should get pending requests', async () => {
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

      // User1 sends request to User2
      await user1Auth.mutation(api.friends.mutations.sendFriendRequest, {
        addresseePersonId: person2Id,
      });

      // User2 queries pending requests
      const pendingRequests = await user2Auth.query(
        api.friends.queries.getPendingRequests,
        {}
      );

      expect(pendingRequests).toHaveLength(1);
    });

    test('should get sent requests', async () => {
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

      // User1 sends request
      await user1Auth.mutation(api.friends.mutations.sendFriendRequest, {
        addresseePersonId: person2Id,
      });

      // User1 queries sent requests
      const sentRequests = await user1Auth.query(
        api.friends.queries.getSentRequests,
        {}
      );

      expect(sentRequests).toHaveLength(1);
      expect(sentRequests[0].personId).toBe(person2Id);
    });

    test('should get friendship status', async () => {
      const t = createTestInstance();

      const { userId: user1Id, personId: person1Id } = await createTestUser(t, {
        email: 'user1@example.com',
        username: 'user1',
      });
      const { userId: user2Id, personId: person2Id } = await createTestUser(t, {
        email: 'user2@example.com',
        username: 'user2',
      });
      const { personId: person3Id } = await createTestUser(t, {
        email: 'user3@example.com',
        username: 'user3',
      });

      const user1Auth = createAuthenticatedUser(t, user1Id);
      const user2Auth = createAuthenticatedUser(t, user2Id);

      // Initially no relationship
      const initialStatus = await user1Auth.query(
        api.friends.queries.getFriendshipStatus,
        { targetPersonId: person2Id }
      );
      expect(initialStatus.status).toBe('none');

      // Send request
      const sendResult = await user1Auth.mutation(
        api.friends.mutations.sendFriendRequest,
        { addresseePersonId: person2Id }
      );

      // User1 sees pending_sent
      const user1Status = await user1Auth.query(
        api.friends.queries.getFriendshipStatus,
        { targetPersonId: person2Id }
      );
      expect(user1Status.status).toBe('pending_sent');

      // User2 sees pending_received
      const user2Status = await user2Auth.query(
        api.friends.queries.getFriendshipStatus,
        { targetPersonId: person1Id }
      );
      expect(user2Status.status).toBe('pending_received');

      // Accept
      await user2Auth.mutation(api.friends.mutations.acceptFriendRequest, {
        friendshipId: sendResult.friendshipId,
      });

      // Both see friends
      const user1FriendStatus = await user1Auth.query(
        api.friends.queries.getFriendshipStatus,
        { targetPersonId: person2Id }
      );
      expect(user1FriendStatus.status).toBe('friends');

      // Check self status
      const selfStatus = await user1Auth.query(
        api.friends.queries.getFriendshipStatus,
        { targetPersonId: person1Id }
      );
      expect(selfStatus.status).toBe('self');

      // Check with no relationship
      const noRelationStatus = await user1Auth.query(
        api.friends.queries.getFriendshipStatus,
        { targetPersonId: person3Id }
      );
      expect(noRelationStatus.status).toBe('none');
    });
  });

  describe('Authentication', () => {
    test('should require auth for sending friend request', async () => {
      const t = createTestInstance();

      const { personId } = await createTestUser(t, {
        email: 'user@example.com',
        username: 'user',
      });

      // No auth
      await expect(
        t.mutation(api.friends.mutations.sendFriendRequest, {
          addresseePersonId: personId,
        })
      ).rejects.toThrow('Authentication required');
    });

    test('should return empty array for unauthenticated queries', async () => {
      const t = createTestInstance();

      const friends = await t.query(api.friends.queries.getFriends, {});
      expect(friends).toEqual([]);

      const pending = await t.query(api.friends.queries.getPendingRequests, {});
      expect(pending).toEqual([]);

      const sent = await t.query(api.friends.queries.getSentRequests, {});
      expect(sent).toEqual([]);
    });
  });
});
