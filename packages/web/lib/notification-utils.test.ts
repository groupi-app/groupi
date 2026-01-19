/**
 * Tests for notification utility functions
 */

import { describe, it, expect } from 'vitest';
import { getNotificationTypeDisplayName } from './notification-utils';

describe('Notification Utils', () => {
  describe('getNotificationTypeDisplayName', () => {
    it('should return display name for EVENT_EDITED', () => {
      expect(getNotificationTypeDisplayName('EVENT_EDITED')).toBe('Event Edited');
    });

    it('should return display name for DATE_CHANGED', () => {
      expect(getNotificationTypeDisplayName('DATE_CHANGED')).toBe('Date Changed');
    });

    it('should return display name for DATE_CHOSEN', () => {
      expect(getNotificationTypeDisplayName('DATE_CHOSEN')).toBe('Date Chosen');
    });

    it('should return display name for DATE_RESET', () => {
      expect(getNotificationTypeDisplayName('DATE_RESET')).toBe('Date Reset');
    });

    it('should return display name for USER_JOINED', () => {
      expect(getNotificationTypeDisplayName('USER_JOINED')).toBe('User Joined');
    });

    it('should return display name for USER_LEFT', () => {
      expect(getNotificationTypeDisplayName('USER_LEFT')).toBe('User Left');
    });

    it('should return display name for USER_PROMOTED', () => {
      expect(getNotificationTypeDisplayName('USER_PROMOTED')).toBe('User Promoted');
    });

    it('should return display name for USER_DEMOTED', () => {
      expect(getNotificationTypeDisplayName('USER_DEMOTED')).toBe('User Demoted');
    });

    it('should return display name for USER_RSVP', () => {
      expect(getNotificationTypeDisplayName('USER_RSVP')).toBe('User RSVP');
    });

    it('should return display name for NEW_POST', () => {
      expect(getNotificationTypeDisplayName('NEW_POST')).toBe('New Post');
    });

    it('should return display name for NEW_REPLY', () => {
      expect(getNotificationTypeDisplayName('NEW_REPLY')).toBe('New Reply');
    });

    it('should return display name for USER_MENTIONED', () => {
      expect(getNotificationTypeDisplayName('USER_MENTIONED')).toBe('Mentioned');
    });

    it('should return raw type for unknown types', () => {
      // Cast to test unknown type handling
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const unknownType = 'UNKNOWN_TYPE' as any;
      expect(getNotificationTypeDisplayName(unknownType)).toBe('UNKNOWN_TYPE');
    });
  });
});
