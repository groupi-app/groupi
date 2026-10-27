import { describe, expect, it } from 'vitest';
import {
  classifyEventLifecycle,
  isDateOptionPassed,
  isScheduledEventComplete,
} from './event-lifecycle';

const time = Date.parse;
describe('Event-local lifecycle', () => {
  it.each([
    [
      'spring forward',
      '2026-03-08T05:00:00Z',
      '2026-03-09T03:59:59Z',
      '2026-03-09T04:00:00Z',
    ],
    [
      'fall back',
      '2026-11-01T04:00:00Z',
      '2026-11-02T04:59:59Z',
      '2026-11-02T05:00:00Z',
    ],
  ])(
    'completes at next local midnight across %s',
    (_, start, before, after) => {
      const event = {
        chosenDateTime: time(start),
        timezone: 'America/New_York',
      };
      expect(isScheduledEventComplete(event, time(before))).toBe(false);
      expect(isScheduledEventComplete(event, time(after))).toBe(true);
    }
  );
  it('uses the Event zone, exact end boundary and stable UTC legacy fallback', () => {
    const start = time('2026-04-02T02:00:00Z');
    const now = time('2026-04-02T07:00:00Z');
    expect(
      isScheduledEventComplete(
        { chosenDateTime: start, timezone: 'America/Los_Angeles' },
        now
      )
    ).toBe(true);
    expect(
      isScheduledEventComplete(
        { chosenDateTime: start, timezone: 'Asia/Tokyo' },
        now
      )
    ).toBe(false);
    for (const timezone of [undefined, 'Invalid/Legacy']) {
      expect(
        isScheduledEventComplete(
          { chosenDateTime: start, timezone },
          time('2026-04-03T00:00:00Z')
        )
      ).toBe(true);
    }
    expect(
      isScheduledEventComplete(
        { chosenDateTime: start, chosenEndDateTime: now + 1 },
        now
      )
    ).toBe(false);
    expect(
      isScheduledEventComplete(
        { chosenDateTime: start, chosenEndDateTime: now },
        now
      )
    ).toBe(true);
  });
  it('classifies expired polls separately without completing or changing their records', () => {
    const now = time('2026-01-05T12:00:00Z');
    const event = { potentialDateTimes: [now - 1, now] };
    expect(classifyEventLifecycle(event, now)).toBe('NEEDS_NEW_DATES');
    expect(isScheduledEventComplete(event, now)).toBe(false);
    expect(
      classifyEventLifecycle(
        {
          ...event,
          potentialDateTimes: [...event.potentialDateTimes, now + 1],
        },
        now
      )
    ).toBe('UPCOMING');
    expect(classifyEventLifecycle({}, now)).toBe('UNDATED');
    expect(classifyEventLifecycle({ potentialDateTimes: [] }, now)).toBe(
      'UNDATED'
    );
    expect(
      classifyEventLifecycle({ ...event, completedAt: now - 1 }, now)
    ).toBe('COMPLETED');
    expect(event.potentialDateTimes).toEqual([now - 1, now]);
    expect(isDateOptionPassed({ dateTime: now }, now)).toBe(true);
  });
});
