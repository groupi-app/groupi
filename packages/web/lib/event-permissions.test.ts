import { expect, test, describe } from 'vitest';
import {
  canDeletePost,
  canEditPost,
  canDeleteReply,
  canEditReply,
  isModerator,
  isOrganizer,
} from './event-permissions';

describe('event-permissions', () => {
  describe('canDeletePost', () => {
    test('should allow author to delete their own post', () => {
      const result = canDeletePost({
        userId: 'user123',
        userRole: 'ATTENDEE',
        postAuthorId: 'user123',
      });

      expect(result).toBe(true);
    });

    test('should allow moderator to delete any post', () => {
      const result = canDeletePost({
        userId: 'user123',
        userRole: 'MODERATOR',
        postAuthorId: 'user456',
      });

      expect(result).toBe(true);
    });

    test('should allow organizer to delete any post', () => {
      const result = canDeletePost({
        userId: 'user123',
        userRole: 'ORGANIZER',
        postAuthorId: 'user456',
      });

      expect(result).toBe(true);
    });

    test("should not allow attendee to delete others' posts", () => {
      const result = canDeletePost({
        userId: 'user123',
        userRole: 'ATTENDEE',
        postAuthorId: 'user456',
      });

      expect(result).toBe(false);
    });
  });

  describe('canEditPost', () => {
    test('should allow author to edit their own post', () => {
      const result = canEditPost({
        userId: 'user123',
        postAuthorId: 'user123',
      });

      expect(result).toBe(true);
    });

    test('should not allow others to edit posts (even moderators)', () => {
      const result = canEditPost({
        userId: 'moderator123',
        postAuthorId: 'user456',
      });

      expect(result).toBe(false);
    });
  });

  describe('canDeleteReply', () => {
    test('should allow author to delete their own reply', () => {
      const result = canDeleteReply({
        userId: 'user123',
        userRole: 'ATTENDEE',
        replyAuthorId: 'user123',
      });

      expect(result).toBe(true);
    });

    test('should allow moderator to delete any reply', () => {
      const result = canDeleteReply({
        userId: 'user123',
        userRole: 'MODERATOR',
        replyAuthorId: 'user456',
      });

      expect(result).toBe(true);
    });

    test('should allow organizer to delete any reply', () => {
      const result = canDeleteReply({
        userId: 'user123',
        userRole: 'ORGANIZER',
        replyAuthorId: 'user456',
      });

      expect(result).toBe(true);
    });

    test("should not allow attendee to delete others' replies", () => {
      const result = canDeleteReply({
        userId: 'user123',
        userRole: 'ATTENDEE',
        replyAuthorId: 'user456',
      });

      expect(result).toBe(false);
    });
  });

  describe('canEditReply', () => {
    test('should allow author to edit their own reply', () => {
      const result = canEditReply({
        userId: 'user123',
        replyAuthorId: 'user123',
      });

      expect(result).toBe(true);
    });

    test('should not allow others to edit replies (even moderators)', () => {
      const result = canEditReply({
        userId: 'moderator123',
        replyAuthorId: 'user456',
      });

      expect(result).toBe(false);
    });
  });

  describe('isModerator', () => {
    test('should return true for MODERATOR role', () => {
      expect(isModerator('MODERATOR')).toBe(true);
    });

    test('should return true for ORGANIZER role', () => {
      expect(isModerator('ORGANIZER')).toBe(true);
    });

    test('should return false for ATTENDEE role', () => {
      expect(isModerator('ATTENDEE')).toBe(false);
    });
  });

  describe('isOrganizer', () => {
    test('should return true for ORGANIZER role', () => {
      expect(isOrganizer('ORGANIZER')).toBe(true);
    });

    test('should return false for MODERATOR role', () => {
      expect(isOrganizer('MODERATOR')).toBe(false);
    });

    test('should return false for ATTENDEE role', () => {
      expect(isOrganizer('ATTENDEE')).toBe(false);
    });
  });
});
