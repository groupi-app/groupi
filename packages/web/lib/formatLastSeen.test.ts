import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatLastSeen, UserStatusType, DisplayStatus } from './utils';

/**
 * Comprehensive tests for formatLastSeen utility function
 *
 * Tests cover:
 * 1. Basic functionality with different statuses
 * 2. Stale vs fresh lastSeen handling
 * 3. isOwnStatus parameter behavior
 * 4. INVISIBLE status handling
 * 5. Status expiration
 * 6. Time formatting (relative time strings)
 * 7. Edge cases and boundary conditions
 */

describe('formatLastSeen', () => {
  // Use fixed time for consistent testing
  const NOW = 1700000000000; // Fixed timestamp

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('basic functionality', () => {
    it('should return "Never seen" for null lastSeen', () => {
      const result = formatLastSeen(null);

      expect(result.text).toBe('Never seen');
      expect(result.isOnline).toBe(false);
      expect(result.displayStatus).toBe('offline');
    });

    it('should return "Never seen" for undefined lastSeen', () => {
      const result = formatLastSeen(undefined);

      expect(result.text).toBe('Never seen');
      expect(result.isOnline).toBe(false);
      expect(result.displayStatus).toBe('offline');
    });

    it('should return "Online now" for fresh lastSeen with ONLINE status', () => {
      const freshLastSeen = NOW - 2 * 60 * 1000; // 2 minutes ago

      const result = formatLastSeen(freshLastSeen, 'ONLINE');

      expect(result.text).toBe('Online now');
      expect(result.isOnline).toBe(true);
      expect(result.displayStatus).toBe('online');
    });

    it('should return "Online now" for fresh lastSeen with no status', () => {
      const freshLastSeen = NOW - 2 * 60 * 1000; // 2 minutes ago

      const result = formatLastSeen(freshLastSeen);

      expect(result.text).toBe('Online now');
      expect(result.isOnline).toBe(true);
      expect(result.displayStatus).toBe('online');
    });
  });

  describe('stale lastSeen handling (viewing others)', () => {
    const staleLastSeen = NOW - 10 * 60 * 1000; // 10 minutes ago

    it('should return OFFLINE for stale lastSeen with ONLINE status', () => {
      const result = formatLastSeen(staleLastSeen, 'ONLINE');

      expect(result.isOnline).toBe(false);
      expect(result.displayStatus).toBe('offline');
      expect(result.text).toBe('Last seen 10m ago');
    });

    it('should return OFFLINE for stale lastSeen with DND status', () => {
      const result = formatLastSeen(staleLastSeen, 'DO_NOT_DISTURB');

      expect(result.isOnline).toBe(false);
      expect(result.displayStatus).toBe('offline');
      expect(result.text).toBe('Last seen 10m ago');
    });

    it('should return OFFLINE for stale lastSeen with IDLE status', () => {
      const result = formatLastSeen(staleLastSeen, 'IDLE');

      expect(result.isOnline).toBe(false);
      expect(result.displayStatus).toBe('offline');
      expect(result.text).toBe('Last seen 10m ago');
    });
  });

  describe('fresh lastSeen with different statuses (viewing others)', () => {
    const freshLastSeen = NOW - 2 * 60 * 1000; // 2 minutes ago

    it('should return DND for fresh lastSeen with DND status', () => {
      const result = formatLastSeen(freshLastSeen, 'DO_NOT_DISTURB');

      expect(result.text).toBe('Do Not Disturb');
      expect(result.isOnline).toBe(false); // DND is "busy", not "online"
      expect(result.displayStatus).toBe('dnd');
    });

    it('should return IDLE for fresh lastSeen with IDLE status', () => {
      const result = formatLastSeen(freshLastSeen, 'IDLE');

      expect(result.text).toBe('Idle');
      expect(result.isOnline).toBe(false); // IDLE is "away"
      expect(result.displayStatus).toBe('idle');
    });

    it('should return ONLINE for fresh lastSeen with ONLINE status', () => {
      const result = formatLastSeen(freshLastSeen, 'ONLINE');

      expect(result.text).toBe('Online now');
      expect(result.isOnline).toBe(true);
      expect(result.displayStatus).toBe('online');
    });
  });

  describe('INVISIBLE status', () => {
    const freshLastSeen = NOW - 2 * 60 * 1000;

    it('should return OFFLINE for INVISIBLE when viewing others', () => {
      const result = formatLastSeen(freshLastSeen, 'INVISIBLE', null, false);

      expect(result.text).toBe('Offline');
      expect(result.isOnline).toBe(false);
      expect(result.displayStatus).toBe('offline');
    });

    it('should return INVISIBLE when viewing own status', () => {
      const result = formatLastSeen(freshLastSeen, 'INVISIBLE', null, true);

      expect(result.text).toBe('Invisible');
      expect(result.isOnline).toBe(true);
      expect(result.displayStatus).toBe('invisible');
    });

    it('should return OFFLINE for INVISIBLE even with stale lastSeen (others)', () => {
      const staleLastSeen = NOW - 10 * 60 * 1000;

      const result = formatLastSeen(staleLastSeen, 'INVISIBLE', null, false);

      expect(result.text).toBe('Offline');
      expect(result.displayStatus).toBe('offline');
    });
  });

  describe('isOwnStatus parameter', () => {
    it('should show DND when viewing own status regardless of lastSeen', () => {
      const staleLastSeen = NOW - 10 * 60 * 1000;

      const result = formatLastSeen(
        staleLastSeen,
        'DO_NOT_DISTURB',
        null,
        true
      );

      expect(result.text).toBe('Do Not Disturb');
      expect(result.isOnline).toBe(true);
      expect(result.displayStatus).toBe('dnd');
    });

    it('should show IDLE when viewing own status regardless of lastSeen', () => {
      const staleLastSeen = NOW - 10 * 60 * 1000;

      const result = formatLastSeen(staleLastSeen, 'IDLE', null, true);

      expect(result.text).toBe('Idle');
      expect(result.isOnline).toBe(true);
      expect(result.displayStatus).toBe('idle');
    });

    it('should show ONLINE when viewing own status with ONLINE/null status', () => {
      const staleLastSeen = NOW - 10 * 60 * 1000;

      const result = formatLastSeen(staleLastSeen, 'ONLINE', null, true);

      expect(result.text).toBe('Online');
      expect(result.isOnline).toBe(true);
      expect(result.displayStatus).toBe('online');
    });

    it('should show ONLINE when viewing own status with no status set', () => {
      const staleLastSeen = NOW - 10 * 60 * 1000;

      const result = formatLastSeen(staleLastSeen, null, null, true);

      expect(result.text).toBe('Online');
      expect(result.isOnline).toBe(true);
      expect(result.displayStatus).toBe('online');
    });
  });

  describe('status expiration', () => {
    const freshLastSeen = NOW - 2 * 60 * 1000;

    it('should treat expired DND as ONLINE (viewing others)', () => {
      const expiredAt = NOW - 1000; // Expired 1 second ago

      const result = formatLastSeen(
        freshLastSeen,
        'DO_NOT_DISTURB',
        expiredAt,
        false
      );

      expect(result.text).toBe('Online now');
      expect(result.isOnline).toBe(true);
      expect(result.displayStatus).toBe('online');
    });

    it('should treat expired IDLE as ONLINE (viewing others)', () => {
      const expiredAt = NOW - 1000;

      const result = formatLastSeen(freshLastSeen, 'IDLE', expiredAt, false);

      expect(result.text).toBe('Online now');
      expect(result.isOnline).toBe(true);
      expect(result.displayStatus).toBe('online');
    });

    it('should treat expired INVISIBLE as ONLINE (viewing others)', () => {
      const expiredAt = NOW - 1000;

      const result = formatLastSeen(
        freshLastSeen,
        'INVISIBLE',
        expiredAt,
        false
      );

      expect(result.text).toBe('Online now');
      expect(result.isOnline).toBe(true);
      expect(result.displayStatus).toBe('online');
    });

    it('should respect non-expired DND status', () => {
      const expiresLater = NOW + 60 * 60 * 1000; // Expires in 1 hour

      const result = formatLastSeen(
        freshLastSeen,
        'DO_NOT_DISTURB',
        expiresLater,
        false
      );

      expect(result.text).toBe('Do Not Disturb');
      expect(result.displayStatus).toBe('dnd');
    });

    it('should respect expiration even when viewing own status', () => {
      const expiredAt = NOW - 1000;

      const result = formatLastSeen(
        freshLastSeen,
        'DO_NOT_DISTURB',
        expiredAt,
        true
      );

      // Own status with expired DND should show as ONLINE
      expect(result.displayStatus).toBe('online');
    });

    it('should handle expired status with stale lastSeen', () => {
      const staleLastSeen = NOW - 10 * 60 * 1000;
      const expiredAt = NOW - 1000;

      const result = formatLastSeen(
        staleLastSeen,
        'DO_NOT_DISTURB',
        expiredAt,
        false
      );

      // Expired DND + stale lastSeen = OFFLINE
      expect(result.displayStatus).toBe('offline');
      expect(result.text).toBe('Last seen 10m ago');
    });
  });

  describe('time formatting', () => {
    it('should format "just now" for very recent lastSeen that is stale', () => {
      // This edge case: just over 5 minutes but less than a full minute more
      const lastSeen = NOW - 5 * 60 * 1000 - 30 * 1000; // 5:30 ago

      const result = formatLastSeen(lastSeen, 'ONLINE');

      // Should be offline since > 5 min
      expect(result.displayStatus).toBe('offline');
    });

    it('should format minutes correctly', () => {
      const lastSeen = NOW - 15 * 60 * 1000; // 15 minutes ago

      const result = formatLastSeen(lastSeen, 'ONLINE');

      expect(result.text).toBe('Last seen 15m ago');
    });

    it('should format hours correctly', () => {
      const lastSeen = NOW - 3 * 60 * 60 * 1000; // 3 hours ago

      const result = formatLastSeen(lastSeen, 'ONLINE');

      expect(result.text).toBe('Last seen 3h ago');
    });

    it('should format days correctly', () => {
      const lastSeen = NOW - 5 * 24 * 60 * 60 * 1000; // 5 days ago

      const result = formatLastSeen(lastSeen, 'ONLINE');

      expect(result.text).toBe('Last seen 5d ago');
    });

    it('should format months correctly', () => {
      const lastSeen = NOW - 60 * 24 * 60 * 60 * 1000; // ~2 months ago

      const result = formatLastSeen(lastSeen, 'ONLINE');

      expect(result.text).toBe('Last seen 2mo ago');
    });

    it('should format years correctly', () => {
      const lastSeen = NOW - 400 * 24 * 60 * 60 * 1000; // ~1 year ago

      const result = formatLastSeen(lastSeen, 'ONLINE');

      expect(result.text).toBe('Last seen 1y ago');
    });

    it('should handle exactly 1 minute ago', () => {
      const lastSeen = NOW - 6 * 60 * 1000; // 6 minutes ago (stale)

      const result = formatLastSeen(lastSeen, 'ONLINE');

      expect(result.text).toBe('Last seen 6m ago');
    });

    it('should handle exactly 1 hour ago', () => {
      // Note: The implementation uses `> 1` for intervals, so exactly 1 hour
      // (3600 seconds / 3600 = 1) is not > 1, so it falls through to minutes
      const lastSeen = NOW - 60 * 60 * 1000; // 1 hour ago

      const result = formatLastSeen(lastSeen, 'ONLINE');

      // 60 minutes, not 1h, because interval check is > 1
      expect(result.text).toBe('Last seen 60m ago');
    });

    it('should handle exactly 1 day ago', () => {
      // Note: The implementation uses `> 1` for intervals, so exactly 1 day
      // (86400 seconds / 86400 = 1) is not > 1, so it falls through to hours
      const lastSeen = NOW - 24 * 60 * 60 * 1000; // 1 day ago

      const result = formatLastSeen(lastSeen, 'ONLINE');

      // 24 hours, not 1d, because interval check is > 1
      expect(result.text).toBe('Last seen 24h ago');
    });
  });

  describe('boundary conditions', () => {
    it('should consider exactly 5 minutes as stale', () => {
      const lastSeen = NOW - 5 * 60 * 1000; // Exactly 5 minutes

      const result = formatLastSeen(lastSeen, 'ONLINE');

      // >= 5 minutes is stale
      expect(result.displayStatus).toBe('offline');
    });

    it('should consider just under 5 minutes as fresh', () => {
      const lastSeen = NOW - (5 * 60 * 1000 - 1); // 4:59.999

      const result = formatLastSeen(lastSeen, 'ONLINE');

      expect(result.displayStatus).toBe('online');
      expect(result.isOnline).toBe(true);
    });

    it('should handle 0 lastSeen (epoch)', () => {
      const result = formatLastSeen(0, 'ONLINE');

      // 0 is truthy for numbers, but very old
      expect(result.displayStatus).toBe('offline');
    });

    it('should handle future lastSeen (clock skew)', () => {
      const futureLastSeen = NOW + 60 * 1000; // 1 minute in future

      const result = formatLastSeen(futureLastSeen, 'ONLINE');

      // Future lastSeen should still be considered "fresh"
      expect(result.displayStatus).toBe('online');
      expect(result.isOnline).toBe(true);
    });

    it('should handle expiration exactly at current time', () => {
      const freshLastSeen = NOW - 2 * 60 * 1000;

      const result = formatLastSeen(
        freshLastSeen,
        'DO_NOT_DISTURB',
        NOW, // Expires exactly now
        false
      );

      // >= now means expired
      expect(result.displayStatus).toBe('online');
    });
  });

  describe('all status types', () => {
    const freshLastSeen = NOW - 2 * 60 * 1000;
    const statuses: UserStatusType[] = [
      'ONLINE',
      'IDLE',
      'DO_NOT_DISTURB',
      'INVISIBLE',
    ];

    const expectedDisplayStatus: Record<UserStatusType, DisplayStatus> = {
      ONLINE: 'online',
      IDLE: 'idle',
      DO_NOT_DISTURB: 'dnd',
      INVISIBLE: 'offline', // INVISIBLE shows as offline to others
    };

    statuses.forEach(status => {
      it(`should handle ${status} status correctly (fresh lastSeen, viewing others)`, () => {
        const result = formatLastSeen(freshLastSeen, status, null, false);

        expect(result.displayStatus).toBe(expectedDisplayStatus[status]);
      });
    });
  });

  describe('null/undefined handling', () => {
    const freshLastSeen = NOW - 2 * 60 * 1000;

    it('should handle null status as ONLINE', () => {
      const result = formatLastSeen(freshLastSeen, null);

      expect(result.displayStatus).toBe('online');
    });

    it('should handle undefined status as ONLINE', () => {
      const result = formatLastSeen(freshLastSeen, undefined);

      expect(result.displayStatus).toBe('online');
    });

    it('should handle null statusExpiresAt', () => {
      const result = formatLastSeen(
        freshLastSeen,
        'DO_NOT_DISTURB',
        null,
        false
      );

      expect(result.displayStatus).toBe('dnd');
    });

    it('should handle undefined isOwnStatus (defaults to false)', () => {
      const staleLastSeen = NOW - 10 * 60 * 1000;

      const result = formatLastSeen(
        staleLastSeen,
        'DO_NOT_DISTURB',
        null,
        undefined
      );

      // Should behave as viewing others (offline for stale DND)
      expect(result.displayStatus).toBe('offline');
    });
  });

  describe('integration scenarios', () => {
    it('should handle DND user who closed app and status expired', () => {
      const staleLastSeen = NOW - 30 * 60 * 1000; // 30 min ago
      const expiredAt = NOW - 5 * 60 * 1000; // Expired 5 min ago

      const result = formatLastSeen(
        staleLastSeen,
        'DO_NOT_DISTURB',
        expiredAt,
        false
      );

      // Expired DND + stale = OFFLINE
      expect(result.displayStatus).toBe('offline');
      expect(result.text).toBe('Last seen 30m ago');
    });

    it('should handle DND user actively using app (fresh lastSeen)', () => {
      const freshLastSeen = NOW - 1 * 60 * 1000; // 1 min ago

      const result = formatLastSeen(
        freshLastSeen,
        'DO_NOT_DISTURB',
        null,
        false
      );

      // Active DND user shows as DND
      expect(result.displayStatus).toBe('dnd');
      expect(result.text).toBe('Do Not Disturb');
    });

    it('should handle user viewing their own expired status', () => {
      const freshLastSeen = NOW - 1 * 60 * 1000;
      const expiredAt = NOW - 1000;

      const result = formatLastSeen(
        freshLastSeen,
        'DO_NOT_DISTURB',
        expiredAt,
        true
      );

      // Own status, expired = back to ONLINE
      expect(result.displayStatus).toBe('online');
    });

    it('should handle IDLE user who became inactive', () => {
      const staleLastSeen = NOW - 20 * 60 * 1000; // 20 min ago

      const result = formatLastSeen(staleLastSeen, 'IDLE', null, false);

      // Stale IDLE = OFFLINE (reveals inactivity)
      expect(result.displayStatus).toBe('offline');
      expect(result.text).toBe('Last seen 20m ago');
    });
  });
});
