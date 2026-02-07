import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isReminderInPast, REMINDER_OFFSET_MS } from './datetime-helpers';

describe('REMINDER_OFFSET_MS', () => {
  it('should have correct millisecond values for all offsets', () => {
    expect(REMINDER_OFFSET_MS['30_MINUTES']).toBe(30 * 60 * 1000);
    expect(REMINDER_OFFSET_MS['1_HOUR']).toBe(60 * 60 * 1000);
    expect(REMINDER_OFFSET_MS['2_HOURS']).toBe(2 * 60 * 60 * 1000);
    expect(REMINDER_OFFSET_MS['4_HOURS']).toBe(4 * 60 * 60 * 1000);
    expect(REMINDER_OFFSET_MS['1_DAY']).toBe(24 * 60 * 60 * 1000);
    expect(REMINDER_OFFSET_MS['2_DAYS']).toBe(2 * 24 * 60 * 60 * 1000);
    expect(REMINDER_OFFSET_MS['3_DAYS']).toBe(3 * 24 * 60 * 60 * 1000);
    expect(REMINDER_OFFSET_MS['1_WEEK']).toBe(7 * 24 * 60 * 60 * 1000);
    expect(REMINDER_OFFSET_MS['2_WEEKS']).toBe(14 * 24 * 60 * 60 * 1000);
    expect(REMINDER_OFFSET_MS['4_WEEKS']).toBe(28 * 24 * 60 * 60 * 1000);
  });

  it('should have all 10 offset keys', () => {
    expect(Object.keys(REMINDER_OFFSET_MS)).toHaveLength(10);
  });
});

describe('isReminderInPast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Set "now" to 2025-06-15T12:00:00.000Z
    vi.setSystemTime(new Date('2025-06-15T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return true when reminder time is in the past', () => {
    // Event is in 30 minutes, reminder is 1 hour before → reminder would be 30 min ago
    const eventTime = new Date('2025-06-15T12:30:00.000Z');
    expect(isReminderInPast('1_HOUR', eventTime)).toBe(true);
  });

  it('should return false when reminder time is in the future', () => {
    // Event is in 2 hours, reminder is 1 hour before → reminder is in 1 hour
    const eventTime = new Date('2025-06-15T14:00:00.000Z');
    expect(isReminderInPast('1_HOUR', eventTime)).toBe(false);
  });

  it('should return true when reminder time is exactly now', () => {
    // Event is exactly 1 day from now, reminder is 1 day before → reminder is right now (<=)
    const eventTime = new Date('2025-06-16T12:00:00.000Z');
    expect(isReminderInPast('1_DAY', eventTime)).toBe(true);
  });

  it('should return true when event itself is in the past', () => {
    const eventTime = new Date('2025-06-14T12:00:00.000Z');
    expect(isReminderInPast('30_MINUTES', eventTime)).toBe(true);
  });

  it('should accept ISO string as event time', () => {
    const eventTime = '2025-06-15T12:30:00.000Z';
    expect(isReminderInPast('1_HOUR', eventTime)).toBe(true);
  });

  it('should accept numeric timestamp as event time', () => {
    // Event 30 min from now
    const eventTime = Date.now() + 30 * 60 * 1000;
    expect(isReminderInPast('1_HOUR', eventTime)).toBe(true);
    expect(isReminderInPast('30_MINUTES', eventTime)).toBe(true);
  });

  it('should return false for an unknown offset key', () => {
    const eventTime = new Date('2025-06-15T12:30:00.000Z');
    expect(isReminderInPast('UNKNOWN_OFFSET', eventTime)).toBe(false);
  });

  it('should handle 4 weeks offset correctly', () => {
    // Event is 27 days away → 4 week reminder would be in the past
    const eventTime = new Date('2025-07-12T12:00:00.000Z');
    expect(isReminderInPast('4_WEEKS', eventTime)).toBe(true);

    // Event is 29 days away → 4 week reminder would be in the future
    const eventTimeFar = new Date('2025-07-14T12:00:00.000Z');
    expect(isReminderInPast('4_WEEKS', eventTimeFar)).toBe(false);
  });

  it('should handle edge case: event 1 minute after offset', () => {
    // Event is 1 hour + 1 minute from now, reminder is 1 hour before → 1 minute in the future
    const eventTime = new Date('2025-06-15T13:01:00.000Z');
    expect(isReminderInPast('1_HOUR', eventTime)).toBe(false);
  });
});
