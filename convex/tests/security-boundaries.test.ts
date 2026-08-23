import { describe, expect, test } from 'vitest';
import presenceTest from '@convex-dev/presence/test';
import { api } from './_generated/api';
import {
  createAuthenticatedUser,
  createTestInstance,
  createTestUser,
  TestScenarios,
} from './test_helpers';

describe('event isolation boundaries', () => {
  test('private events require membership while public events remain readable', async () => {
    const t = createTestInstance();
    const { eventId } = await TestScenarios.singleEvent(t);

    await expect(
      t.query(api.events.queries.getEvent, { eventId })
    ).rejects.toThrow('Access denied');
    await expect(
      t.query(api.events.queries.getEventPotentialDates, { eventId })
    ).rejects.toThrow('Authentication required');

    await t.run(async ctx => {
      await ctx.db.patch(eventId, { visibility: 'PUBLIC' });
    });

    const publicEvent = await t.query(api.events.queries.getEvent, { eventId });
    expect(publicEvent._id).toBe(eventId);
  });

  test('post and reply reads reject anonymous and non-member callers', async () => {
    const t = createTestInstance();
    const { eventId, auth } = await TestScenarios.singleEvent(t);
    const { outsiderAuth } = await TestScenarios.outsiderUser(t);
    const { postId } = await auth.mutation(api.posts.mutations.createPost, {
      eventId,
      title: 'Private discussion',
      content: 'Members only',
    });

    await expect(
      t.query(api.posts.queries.getPost, { postId })
    ).rejects.toThrow('Authentication required');
    await expect(
      t.query(api.posts.queries.getPostReplies, { postId })
    ).rejects.toThrow('Authentication required');
    await expect(
      t.query(api.replies.queries.getRepliesByPost, { postId })
    ).rejects.toThrow('Authentication required');

    await expect(
      outsiderAuth.query(api.posts.queries.getPost, { postId })
    ).rejects.toThrow('Access denied');
    await expect(
      outsiderAuth.query(api.replies.queries.getRepliesByPost, { postId })
    ).rejects.toThrow('Access denied');
  });
});

describe('event role boundaries', () => {
  test('moderators cannot grant or target organizer authority', async () => {
    const t = createTestInstance();
    const { organizer, attendee, eventId } = await TestScenarios.multiUser(t);
    const secondOrganizer = await createTestUser(t, {
      username: 'second-organizer',
    });

    const secondOrganizerMembershipId = await t.run(async ctx => {
      await ctx.db.patch(attendee.membershipId, { role: 'MODERATOR' });
      return await ctx.db.insert('memberships', {
        personId: secondOrganizer.personId,
        eventId,
        role: 'ORGANIZER',
        rsvpStatus: 'YES',
      });
    });

    const moderatorAuth = createAuthenticatedUser(t, attendee.userId);

    await expect(
      moderatorAuth.mutation(api.events.mutations.updateMemberRole, {
        membershipId: attendee.membershipId,
        newRole: 'ORGANIZER',
      })
    ).rejects.toThrow('Only organizers');

    await expect(
      moderatorAuth.mutation(api.events.mutations.updateMemberRole, {
        membershipId: secondOrganizerMembershipId,
        newRole: 'MODERATOR',
      })
    ).rejects.toThrow('Only organizers');

    await expect(
      moderatorAuth.mutation(api.events.mutations.removeMember, {
        membershipId: secondOrganizerMembershipId,
      })
    ).rejects.toThrow('Only organizers');

    await expect(
      moderatorAuth.mutation(api.events.mutations.banMember, {
        membershipId: secondOrganizerMembershipId,
      })
    ).rejects.toThrow('Only organizers');

    const memberships = await t.run(async ctx => ({
      moderator: await ctx.db.get(attendee.membershipId),
      organizer: await ctx.db.get(organizer.membershipId),
      secondOrganizer: await ctx.db.get(secondOrganizerMembershipId),
    }));
    expect(memberships.moderator?.role).toBe('MODERATOR');
    expect(memberships.organizer?.role).toBe('ORGANIZER');
    expect(memberships.secondOrganizer?.role).toBe('ORGANIZER');
  });
});

describe('attachment boundaries', () => {
  test('requires parent authorship and validates stored file metadata', async () => {
    const t = createTestInstance();
    const { organizer, organizerAuth, attendeeAuth, eventId } =
      await TestScenarios.multiUser(t);
    const { postId } = await organizerAuth.mutation(
      api.posts.mutations.createPost,
      {
        eventId,
        title: 'Organizer post',
        content: 'Private attachment parent',
      }
    );
    const { storageId, size } = await t.run(async ctx => {
      const file = new Blob(['safe attachment'], { type: 'text/plain' });
      return {
        storageId: await ctx.storage.store(file),
        size: file.size,
      };
    });

    await expect(
      attendeeAuth.mutation(api.attachments.mutations.createAttachmentsBatch, {
        postId,
        attachments: [
          {
            storageId,
            filename: 'stolen.txt',
            size,
            mimeType: 'text/plain',
          },
        ],
      })
    ).rejects.toThrow('your own content');

    await expect(
      organizerAuth.mutation(api.attachments.mutations.createAttachmentsBatch, {
        postId,
        attachments: [
          {
            storageId,
            filename: 'wrong-size.txt',
            size: size + 1,
            mimeType: 'text/plain',
          },
        ],
      })
    ).rejects.toThrow('size does not match');

    const result = await organizerAuth.mutation(
      api.attachments.mutations.createAttachmentsBatch,
      {
        postId,
        attachments: [
          {
            storageId,
            filename: 'safe.txt',
            size,
            mimeType: 'text/plain',
          },
        ],
      }
    );
    expect(result.attachmentIds).toHaveLength(1);

    const { postId: secondPostId } = await organizerAuth.mutation(
      api.posts.mutations.createPost,
      {
        eventId,
        title: 'Second organizer post',
        content: 'A different parent',
      }
    );
    await expect(
      organizerAuth.mutation(api.attachments.mutations.createAttachment, {
        postId: secondPostId,
        storageId,
        filename: 'reused.txt',
        size,
        mimeType: 'text/plain',
      })
    ).rejects.toThrow('already attached');

    // Simulate a legacy duplicate row that predates the unique-registration
    // guard. Deleting one reference must not delete the shared blob.
    const duplicateAttachmentId = await t.run(async ctx => {
      return await ctx.db.insert('attachments', {
        storageId,
        type: 'FILE',
        filename: 'legacy-duplicate.txt',
        size,
        mimeType: 'text/plain',
        postId: secondPostId,
        uploaderId: organizer.personId,
        createdAt: Date.now(),
      });
    });

    await organizerAuth.mutation(api.attachments.mutations.deleteAttachment, {
      attachmentId: result.attachmentIds[0],
    });
    const afterFirstDelete = await t.run(async ctx => ({
      duplicate: await ctx.db.get(duplicateAttachmentId),
      storedFile: await ctx.db.system.get('_storage', storageId),
    }));
    expect(afterFirstDelete.duplicate).not.toBeNull();
    expect(afterFirstDelete.storedFile).not.toBeNull();

    await organizerAuth.mutation(api.attachments.mutations.deleteAttachment, {
      attachmentId: duplicateAttachmentId,
    });
    const storedFileAfterFinalDelete = await t.run(async ctx =>
      ctx.db.system.get('_storage', storageId)
    );
    expect(storedFileAfterFinalDelete).toBeNull();
  });
});

describe('presence boundaries', () => {
  test('requires authentication and derives the presence identity', async () => {
    const t = createTestInstance();
    presenceTest.register(t);
    const currentUser = await createTestUser(t, { username: 'present-user' });
    const spoofTarget = await createTestUser(t, { username: 'spoof-target' });
    const auth = createAuthenticatedUser(t, currentUser.userId);

    await expect(
      t.mutation(api.presence.heartbeat, {
        roomId: 'app',
        userId: spoofTarget.personId,
        sessionId: 'anonymous-session',
        interval: 10_000,
      })
    ).rejects.toThrow('Authentication required');
    await expect(
      t.mutation(api.presence.updatePresenceData, {
        roomId: 'app',
        userId: spoofTarget.personId,
        data: { isTyping: true },
      })
    ).rejects.toThrow('Authentication required');

    const { roomToken } = await auth.mutation(api.presence.heartbeat, {
      roomId: 'app',
      userId: spoofTarget.personId,
      sessionId: 'authenticated-session',
      interval: 10_000,
    });
    await auth.mutation(api.presence.updatePresenceData, {
      roomId: 'app',
      userId: spoofTarget.personId,
      data: { isTyping: true },
    });
    const room = await auth.query(api.presence.list, { roomToken });

    expect(room).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          userId: currentUser.personId,
          data: { isTyping: true },
        }),
      ])
    );
    expect(room).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ userId: spoofTarget.personId }),
      ])
    );
  });

  test('rejects presence writes to events the caller cannot access', async () => {
    const t = createTestInstance();
    const { eventId, outsiderAuth, outsiderPersonId } =
      await TestScenarios.outsiderUser(t);

    await expect(
      outsiderAuth.mutation(api.presence.updatePresenceData, {
        roomId: `event:${eventId}`,
        userId: outsiderPersonId,
        data: { isTyping: true },
      })
    ).rejects.toThrow('Event membership required');
  });
});
