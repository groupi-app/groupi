/**
 * Tests for utility functions in lib/utils.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatDate,
  formatReplyDate,
  timeUntil,
  getInitialsFromName,
  formatRoleName,
  merge,
  getRanks,
  getNotificationSubject,
} from './utils';

describe('Utils', () => {
  describe('formatDate', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-01-17T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return "just now" for timestamps less than 10 seconds ago', () => {
      const date = new Date('2025-01-17T11:59:55Z'); // 5 seconds ago
      expect(formatDate(date)).toBe('just now');
    });

    it('should return seconds ago for recent timestamps', () => {
      const date = new Date('2025-01-17T11:59:30Z'); // 30 seconds ago
      expect(formatDate(date)).toBe('30 seconds ago');
    });

    it('should return minutes ago', () => {
      const date = new Date('2025-01-17T11:30:00Z'); // 30 minutes ago
      expect(formatDate(date)).toBe('30min ago');
    });

    it('should return hours ago', () => {
      const date = new Date('2025-01-17T09:00:00Z'); // 3 hours ago
      expect(formatDate(date)).toBe('3h ago');
    });

    it('should return days ago', () => {
      const date = new Date('2025-01-14T12:00:00Z'); // 3 days ago
      expect(formatDate(date)).toBe('3d ago');
    });

    it('should return months ago', () => {
      const date = new Date('2024-11-17T12:00:00Z'); // 2 months ago
      expect(formatDate(date)).toBe('2mon ago');
    });

    it('should return years ago', () => {
      const date = new Date('2023-01-17T12:00:00Z'); // 2 years ago
      expect(formatDate(date)).toBe('2y ago');
    });

    it('should handle string dates', () => {
      const date = '2025-01-17T11:59:55Z'; // 5 seconds ago
      expect(formatDate(date)).toBe('just now');
    });

    it('should handle number timestamps', () => {
      const timestamp = new Date('2025-01-17T09:00:00Z').getTime(); // 3 hours ago
      expect(formatDate(timestamp)).toBe('3h ago');
    });
  });

  describe('formatReplyDate', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-01-17T14:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return time only for today', () => {
      const date = new Date('2025-01-17T10:30:00Z');
      const result = formatReplyDate(date);
      // Should just be time format
      expect(result).toMatch(/\d{1,2}:\d{2}\s?(AM|PM)/i);
    });

    it('should return "Yesterday at" for yesterday', () => {
      const date = new Date('2025-01-16T15:45:00Z');
      const result = formatReplyDate(date);
      expect(result).toMatch(/Yesterday at \d{1,2}:\d{2}\s?(AM|PM)/i);
    });

    it('should return numerical date for older dates', () => {
      const date = new Date('2025-01-10T09:00:00Z');
      const result = formatReplyDate(date);
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });

    it('should handle string dates', () => {
      const date = '2025-01-17T10:30:00Z';
      const result = formatReplyDate(date);
      expect(result).toMatch(/\d{1,2}:\d{2}\s?(AM|PM)/i);
    });

    it('should handle number timestamps', () => {
      const timestamp = new Date('2025-01-16T15:45:00Z').getTime();
      const result = formatReplyDate(timestamp);
      expect(result).toMatch(/Yesterday at/i);
    });
  });

  describe('timeUntil', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-01-17T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return seconds until', () => {
      const date = new Date('2025-01-17T12:00:30Z'); // 30 seconds from now
      expect(timeUntil(date)).toBe('30s');
    });

    it('should return minutes until', () => {
      const date = new Date('2025-01-17T12:30:00Z'); // 30 minutes from now
      expect(timeUntil(date)).toBe('30min');
    });

    it('should return hours until', () => {
      const date = new Date('2025-01-17T15:00:00Z'); // 3 hours from now
      expect(timeUntil(date)).toBe('3h');
    });

    it('should return days until', () => {
      const date = new Date('2025-01-20T12:00:00Z'); // 3 days from now
      expect(timeUntil(date)).toBe('3d');
    });

    it('should return months until', () => {
      const date = new Date('2025-04-17T12:00:00Z'); // 3 months from now
      expect(timeUntil(date)).toBe('3mon');
    });

    it('should return years until', () => {
      const date = new Date('2027-01-17T12:00:00Z'); // 2 years from now
      expect(timeUntil(date)).toBe('2y');
    });

    it('should return "Expired" for past dates', () => {
      const date = new Date('2025-01-16T12:00:00Z'); // yesterday
      expect(timeUntil(date)).toBe('Expired');
    });

    it('should handle string dates', () => {
      const date = '2025-01-17T15:00:00Z'; // 3 hours from now
      expect(timeUntil(date)).toBe('3h');
    });
  });

  describe('getInitialsFromName', () => {
    it('should return initials from full name', () => {
      expect(getInitialsFromName('John Doe')).toBe('JD');
      expect(getInitialsFromName('Alice Smith')).toBe('AS');
    });

    it('should handle names with more than two parts', () => {
      expect(getInitialsFromName('John Michael Doe')).toBe('JM');
    });

    it('should handle single names', () => {
      expect(getInitialsFromName('John')).toBe('JO');
      expect(getInitialsFromName('X')).toBe('X');
    });

    it('should uppercase initials', () => {
      expect(getInitialsFromName('john doe')).toBe('JD');
    });

    it('should return fallback for empty name', () => {
      expect(getInitialsFromName(null, 'test@example.com')).toBe('TE');
      expect(getInitialsFromName(undefined, 'ab')).toBe('AB');
    });

    it('should return ?? when no name and no fallback', () => {
      expect(getInitialsFromName(null)).toBe('??');
      expect(getInitialsFromName(undefined)).toBe('??');
      expect(getInitialsFromName('')).toBe('??');
    });

    it('should handle names with extra spaces', () => {
      expect(getInitialsFromName('  John   Doe  ')).toBe('JD');
    });
  });

  describe('formatRoleName', () => {
    it('should format ATTENDEE role', () => {
      expect(formatRoleName('ATTENDEE')).toBe('Attendee');
    });

    it('should format MODERATOR role', () => {
      expect(formatRoleName('MODERATOR')).toBe('Moderator');
    });

    it('should format ORGANIZER role', () => {
      expect(formatRoleName('ORGANIZER')).toBe('Organizer');
    });

    it('should return Unknown for null/undefined', () => {
      expect(formatRoleName(null as unknown as 'ATTENDEE')).toBe('Unknown');
      expect(formatRoleName(undefined as unknown as 'ATTENDEE')).toBe(
        'Unknown'
      );
    });
  });

  describe('merge', () => {
    it('should merge two arrays of primitives', () => {
      const a = [1, 2, 3];
      const b = [3, 4, 5];
      expect(merge(a, b)).toEqual([1, 2, 3, 4, 5]);
    });

    it('should handle empty arrays', () => {
      expect(merge([], [1, 2])).toEqual([1, 2]);
      expect(merge([1, 2], [])).toEqual([1, 2]);
      expect(merge([], [])).toEqual([]);
    });

    it('should merge objects with custom predicate', () => {
      const a = [
        { id: 1, name: 'a' },
        { id: 2, name: 'b' },
      ];
      const b = [
        { id: 2, name: 'b2' },
        { id: 3, name: 'c' },
      ];
      const result = merge(a, b, (x, y) => x.id === y.id);

      expect(result).toHaveLength(3);
      expect(result.map(i => i.id)).toEqual([1, 2, 3]);
    });

    it('should not modify original arrays', () => {
      const a = [1, 2];
      const b = [3, 4];
      merge(a, b);

      expect(a).toEqual([1, 2]);
      expect(b).toEqual([3, 4]);
    });
  });

  describe('getRanks', () => {
    // Helper to create properly typed test data - uses any cast to bypass strict Convex Id types
    const createTestPdt = (
      id: string,
      dateTime: number,
      eventId: string,
      availabilities: Array<{ status: 'YES' | 'NO' | 'MAYBE' }>
    ) =>
      ({
        _id: id,
        _creationTime: 123,
        dateTime,
        eventId,
        availabilities,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any;

    it('should rank potential date times by score', () => {
      const pdts = [
        createTestPdt(
          'pdt1',
          new Date('2025-01-20T10:00:00Z').getTime(),
          'event1',
          [{ status: 'YES' }, { status: 'YES' }]
        ),
        createTestPdt(
          'pdt2',
          new Date('2025-01-21T10:00:00Z').getTime(),
          'event1',
          [{ status: 'YES' }, { status: 'MAYBE' }]
        ),
        createTestPdt(
          'pdt3',
          new Date('2025-01-22T10:00:00Z').getTime(),
          'event1',
          [{ status: 'NO' }, { status: 'NO' }]
        ),
      ];

      const ranked = getRanks(pdts);

      expect(ranked[0].rank).toBe(1);
      expect(ranked[0]._id).toBe('pdt1');
      expect(ranked[1].rank).toBe(2);
      expect(ranked[1]._id).toBe('pdt2');
      expect(ranked[2].rank).toBe(3);
      expect(ranked[2]._id).toBe('pdt3');
    });

    it('should handle ties with same rank', () => {
      const pdts = [
        createTestPdt(
          'pdt1',
          new Date('2025-01-20T10:00:00Z').getTime(),
          'event1',
          [{ status: 'YES' }]
        ),
        createTestPdt(
          'pdt2',
          new Date('2025-01-21T10:00:00Z').getTime(),
          'event1',
          [{ status: 'YES' }]
        ),
      ];

      const ranked = getRanks(pdts);

      expect(ranked[0].rank).toBe(1);
      expect(ranked[1].rank).toBe(1); // Same score = same rank
    });

    it('should handle empty availabilities', () => {
      const pdts = [
        createTestPdt(
          'pdt1',
          new Date('2025-01-20T10:00:00Z').getTime(),
          'event1',
          []
        ),
      ];

      const ranked = getRanks(pdts);
      expect(ranked[0].rank).toBe(1);
    });
  });

  describe('getNotificationSubject', () => {
    it('should format EVENT_EDITED notification', () => {
      const result = getNotificationSubject({
        type: 'EVENT_EDITED',
        event: { title: 'Team Meetup' },
      });
      expect(result).toBe('Event Updated: Team Meetup');
    });

    it('should format DATE_CHOSEN notification', () => {
      const result = getNotificationSubject({
        type: 'DATE_CHOSEN',
        event: { title: 'Conference' },
      });
      expect(result).toBe('Date Set for Conference');
    });

    it('should format DATE_CHANGED notification', () => {
      const result = getNotificationSubject({
        type: 'DATE_CHANGED',
        event: { title: 'Party' },
      });
      expect(result).toBe('Date Changed for Party');
    });

    it('should format DATE_RESET notification', () => {
      const result = getNotificationSubject({
        type: 'DATE_RESET',
        event: { title: 'Workshop' },
      });
      expect(result).toBe('New Date Poll for Workshop');
    });

    it('should format NEW_POST notification', () => {
      const result = getNotificationSubject({
        type: 'NEW_POST',
        event: { title: 'Hackathon' },
        post: { title: 'Welcome Post' },
      });
      expect(result).toBe('New Post in Hackathon: Welcome Post');
    });

    it('should format NEW_REPLY notification', () => {
      const result = getNotificationSubject({
        type: 'NEW_REPLY',
        post: { title: 'Discussion Thread' },
      });
      expect(result).toBe('New Reply to Discussion Thread');
    });

    it('should format USER_MENTIONED notification', () => {
      const result = getNotificationSubject({
        type: 'USER_MENTIONED',
        post: { title: 'Important Update' },
        author: { user: { name: 'John', email: 'john@example.com' } },
      });
      expect(result).toBe('John mentioned you in Important Update');
    });

    it('should format USER_JOINED notification', () => {
      const result = getNotificationSubject({
        type: 'USER_JOINED',
        event: { title: 'Project Kickoff' },
        author: { user: { name: 'Alice', email: 'alice@example.com' } },
      });
      expect(result).toBe('Alice Joined Project Kickoff');
    });

    it('should format USER_LEFT notification', () => {
      const result = getNotificationSubject({
        type: 'USER_LEFT',
        event: { title: 'Sprint Planning' },
        author: { user: { name: 'Bob', email: 'bob@example.com' } },
      });
      expect(result).toBe('Bob Left Sprint Planning');
    });

    it('should format USER_PROMOTED notification', () => {
      const result = getNotificationSubject({
        type: 'USER_PROMOTED',
        event: { title: 'Main Event' },
      });
      expect(result).toBe("You're Now a Moderator of Main Event");
    });

    it('should format USER_DEMOTED notification', () => {
      const result = getNotificationSubject({
        type: 'USER_DEMOTED',
        event: { title: 'Main Event' },
      });
      expect(result).toBe('Moderator Status Removed for Main Event');
    });

    it('should format USER_RSVP notification', () => {
      const result = getNotificationSubject({
        type: 'USER_RSVP',
        event: { title: 'Birthday Party' },
        author: { user: { name: 'Charlie', email: 'charlie@example.com' } },
        rsvp: 'YES',
      });
      expect(result).toBe("Charlie RSVP'd yes to Birthday Party");
    });

    it('should handle missing author name with email fallback', () => {
      const result = getNotificationSubject({
        type: 'USER_JOINED',
        event: { title: 'Event' },
        author: { user: { name: null, email: 'john@example.com' } },
      });
      expect(result).toBe('john Joined Event');
    });

    it('should handle missing author entirely', () => {
      const result = getNotificationSubject({
        type: 'USER_JOINED',
        event: { title: 'Event' },
        author: null,
      });
      expect(result).toBe('Someone Joined Event');
    });

    it('should handle unknown notification type', () => {
      const result = getNotificationSubject({
        type: 'UNKNOWN_TYPE',
        event: { title: 'Event' },
      });
      expect(result).toBe('Notification from Event');
    });

    it('should handle missing event title', () => {
      const result = getNotificationSubject({
        type: 'EVENT_EDITED',
        event: null,
      });
      expect(result).toBe('Event Updated: Event');
    });
  });
});
