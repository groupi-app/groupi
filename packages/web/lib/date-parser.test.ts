import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  parseNaturalDate,
  parseDateExpressions,
  parseRawDateInput,
  tryClientDecomposition,
  needsLLMDecomposition,
  validateParsedDates,
  formatParsedDateRange,
  type ParsedDateRange,
} from './date-parser';

// Reference date: Sunday June 15, 2025 at 12:00:00 (local time)
// This gives us predictable weekday calculations:
// - "tomorrow" = Monday June 16
// - "next Tuesday" = Tuesday June 17
// - "next Friday" = Friday June 20
// - "next Saturday" = Saturday June 21
// - "next Sunday" = Sunday June 22
const REFERENCE_DATE = new Date(2025, 5, 15, 12, 0, 0);

describe('parseNaturalDate', () => {
  describe('simple expressions', () => {
    it('parses "next Friday at 3pm"', () => {
      const result = parseNaturalDate('next Friday at 3pm', REFERENCE_DATE);
      expect(result).not.toBeNull();
      expect(result!.start.getMonth()).toBe(5); // June
      expect(result!.start.getDate()).toBe(20);
      expect(result!.start.getHours()).toBe(15);
      expect(result!.start.getMinutes()).toBe(0);
    });

    it('parses "tomorrow at 6pm"', () => {
      const result = parseNaturalDate('tomorrow at 6pm', REFERENCE_DATE);
      expect(result).not.toBeNull();
      expect(result!.start.getMonth()).toBe(5);
      expect(result!.start.getDate()).toBe(16);
      expect(result!.start.getHours()).toBe(18);
    });

    it('parses "July 4th at noon"', () => {
      const result = parseNaturalDate('July 4th at noon', REFERENCE_DATE);
      expect(result).not.toBeNull();
      expect(result!.start.getMonth()).toBe(6); // July
      expect(result!.start.getDate()).toBe(4);
      expect(result!.start.getHours()).toBe(12);
    });

    it('parses "this Saturday at 2:30pm"', () => {
      const result = parseNaturalDate(
        'this Saturday at 2:30pm',
        REFERENCE_DATE
      );
      expect(result).not.toBeNull();
      expect(result!.start.getDate()).toBe(21);
      expect(result!.start.getHours()).toBe(14);
      expect(result!.start.getMinutes()).toBe(30);
    });

    it('parses "tonight at 8" as 8pm', () => {
      const result = parseNaturalDate('tonight at 8', REFERENCE_DATE);
      expect(result).not.toBeNull();
      expect(result!.start.getHours()).toBe(20);
    });

    it('parses absolute date "August 10 2025 at 5pm"', () => {
      const result = parseNaturalDate('August 10 2025 at 5pm', REFERENCE_DATE);
      expect(result).not.toBeNull();
      expect(result!.start.getFullYear()).toBe(2025);
      expect(result!.start.getMonth()).toBe(7); // August
      expect(result!.start.getDate()).toBe(10);
      expect(result!.start.getHours()).toBe(17);
    });

    it('parses "day after tomorrow at 3pm"', () => {
      const result = parseNaturalDate(
        'day after tomorrow at 3pm',
        REFERENCE_DATE
      );
      expect(result).not.toBeNull();
      expect(result!.start.getDate()).toBe(17);
      expect(result!.start.getHours()).toBe(15);
    });

    it('parses "day after next Monday"', () => {
      // next Monday = June 16, day after = June 17
      const result = parseNaturalDate('day after next Monday', REFERENCE_DATE);
      expect(result).not.toBeNull();
      expect(result!.start.getDate()).toBe(17);
    });

    it('parses "day before next Friday"', () => {
      // next Friday = June 20, day before = June 19
      const result = parseNaturalDate('day before next Friday', REFERENCE_DATE);
      expect(result).not.toBeNull();
      expect(result!.start.getDate()).toBe(19);
    });

    it('parses "day after next Sunday"', () => {
      // next Sunday = June 22, day after = June 23
      const result = parseNaturalDate('day after next Sunday', REFERENCE_DATE);
      expect(result).not.toBeNull();
      expect(result!.start.getDate()).toBe(23);
    });

    it('parses "day before Saturday at 7pm"', () => {
      // next Saturday = June 21, day before = June 20
      const result = parseNaturalDate(
        'day before Saturday at 7pm',
        REFERENCE_DATE
      );
      expect(result).not.toBeNull();
      expect(result!.start.getDate()).toBe(20);
    });
  });

  describe('time ranges', () => {
    it('parses "Friday 4 pm to 8 pm" with start and end', () => {
      const result = parseNaturalDate('Friday 4 pm to 8 pm', REFERENCE_DATE);
      expect(result).not.toBeNull();
      expect(result!.start.getDate()).toBe(20);
      expect(result!.start.getHours()).toBe(16);
      expect(result!.end).toBeDefined();
      expect(result!.end!.getHours()).toBe(20);
    });

    it('parses "Saturday 6pm to 10pm"', () => {
      const result = parseNaturalDate('Saturday 6pm to 10pm', REFERENCE_DATE);
      expect(result).not.toBeNull();
      expect(result!.start.getHours()).toBe(18);
      expect(result!.end).toBeDefined();
      expect(result!.end!.getHours()).toBe(22);
    });

    it('parses "tomorrow 9am to 11am"', () => {
      const result = parseNaturalDate('tomorrow 9am to 11am', REFERENCE_DATE);
      expect(result).not.toBeNull();
      expect(result!.start.getDate()).toBe(16);
      expect(result!.start.getHours()).toBe(9);
      expect(result!.end).toBeDefined();
      expect(result!.end!.getHours()).toBe(11);
    });

    it('parses "next Tuesday 2 pm to 5 pm"', () => {
      const result = parseNaturalDate(
        'next Tuesday 2 pm to 5 pm',
        REFERENCE_DATE
      );
      expect(result).not.toBeNull();
      expect(result!.start.getDate()).toBe(17);
      expect(result!.start.getHours()).toBe(14);
      expect(result!.end).toBeDefined();
      expect(result!.end!.getHours()).toBe(17);
    });

    it('parses time range with hyphen "Friday 6-8pm"', () => {
      const result = parseNaturalDate('Friday 6-8pm', REFERENCE_DATE);
      expect(result).not.toBeNull();
      expect(result!.start.getHours()).toBe(18);
      expect(result!.end).toBeDefined();
      expect(result!.end!.getHours()).toBe(20);
    });

    it('parses "next Monday 9 am to 12 pm"', () => {
      const result = parseNaturalDate(
        'next Monday 9 am to 12 pm',
        REFERENCE_DATE
      );
      expect(result).not.toBeNull();
      expect(result!.start.getDate()).toBe(16);
      expect(result!.start.getHours()).toBe(9);
      expect(result!.end).toBeDefined();
      expect(result!.end!.getHours()).toBe(12);
    });

    it('parses "January 15 4 pm to 6 pm"', () => {
      const result = parseNaturalDate(
        'January 15 4 pm to 6 pm',
        REFERENCE_DATE
      );
      expect(result).not.toBeNull();
      expect(result!.start.getMonth()).toBe(0); // January
      expect(result!.start.getDate()).toBe(15);
      expect(result!.start.getHours()).toBe(16);
      expect(result!.end).toBeDefined();
      expect(result!.end!.getHours()).toBe(18);
    });

    it('parses am time range "Tuesday 9am to 11am"', () => {
      const result = parseNaturalDate('Tuesday 9am to 11am', REFERENCE_DATE);
      expect(result).not.toBeNull();
      expect(result!.start.getHours()).toBe(9);
      expect(result!.end).toBeDefined();
      expect(result!.end!.getHours()).toBe(11);
    });

    it('parses cross-meridiem range "Saturday 10am to 2pm"', () => {
      const result = parseNaturalDate('Saturday 10am to 2pm', REFERENCE_DATE);
      expect(result).not.toBeNull();
      expect(result!.start.getHours()).toBe(10);
      expect(result!.end).toBeDefined();
      expect(result!.end!.getHours()).toBe(14);
    });
  });

  describe('weekday in X weeks (custom parser)', () => {
    it('parses "Tuesday in 2 weeks at 7pm"', () => {
      const result = parseNaturalDate(
        'Tuesday in 2 weeks at 7pm',
        REFERENCE_DATE
      );
      expect(result).not.toBeNull();
      // From Sunday June 15: daysUntilTarget = 2 (Tue) - 0 (Sun) = 2
      // totalDays = 2 + (2-1)*7 = 9
      // June 15 + 9 = June 24
      expect(result!.start.getMonth()).toBe(5);
      expect(result!.start.getDate()).toBe(24);
      expect(result!.start.getHours()).toBe(19);
    });

    it('parses "Friday in 3 weeks"', () => {
      const result = parseNaturalDate('Friday in 3 weeks', REFERENCE_DATE);
      expect(result).not.toBeNull();
      // daysUntilTarget = 5 (Fri) - 0 (Sun) = 5
      // totalDays = 5 + (3-1)*7 = 19
      // June 15 + 19 = July 4
      expect(result!.start.getMonth()).toBe(6);
      expect(result!.start.getDate()).toBe(4);
    });

    it('parses "Monday in 1 week at noon"', () => {
      const result = parseNaturalDate(
        'Monday in 1 week at noon',
        REFERENCE_DATE
      );
      expect(result).not.toBeNull();
      // daysUntilTarget = 1 (Mon) - 0 (Sun) = 1
      // totalDays = 1 + (1-1)*7 = 1
      // June 15 + 1 = June 16
      expect(result!.start.getDate()).toBe(16);
      expect(result!.start.getHours()).toBe(12);
    });

    it('parses "Saturday in 4 weeks at 3pm"', () => {
      const result = parseNaturalDate(
        'Saturday in 4 weeks at 3pm',
        REFERENCE_DATE
      );
      expect(result).not.toBeNull();
      // daysUntilTarget = 6 (Sat) - 0 (Sun) = 6
      // totalDays = 6 + (4-1)*7 = 27
      // June 15 + 27 = July 12
      expect(result!.start.getMonth()).toBe(6);
      expect(result!.start.getDate()).toBe(12);
      expect(result!.start.getHours()).toBe(15);
    });

    it('handles when target weekday is same as reference day', () => {
      const result = parseNaturalDate('Sunday in 2 weeks', REFERENCE_DATE);
      expect(result).not.toBeNull();
      // daysUntilTarget = 0 (Sun) - 0 (Sun) = 0, so += 7 → 7
      // totalDays = 7 + (2-1)*7 = 14
      // June 15 + 14 = June 29
      expect(result!.start.getDate()).toBe(29);
    });

    it('handles "Wednesday in 2 weeks at 5pm" from a Sunday', () => {
      const result = parseNaturalDate(
        'Wednesday in 2 weeks at 5pm',
        REFERENCE_DATE
      );
      expect(result).not.toBeNull();
      // daysUntilTarget = 3 (Wed) - 0 (Sun) = 3
      // totalDays = 3 + (2-1)*7 = 10
      // June 15 + 10 = June 25
      expect(result!.start.getDate()).toBe(25);
      expect(result!.start.getHours()).toBe(17);
    });
  });

  describe('edge cases', () => {
    it('returns null for unparseable input', () => {
      const result = parseNaturalDate('asdfghjkl', REFERENCE_DATE);
      expect(result).toBeNull();
    });

    it('returns null for empty string', () => {
      const result = parseNaturalDate('', REFERENCE_DATE);
      expect(result).toBeNull();
    });

    it('returns null for "soon"', () => {
      const result = parseNaturalDate('soon', REFERENCE_DATE);
      expect(result).toBeNull();
    });

    it('parses midnight-spanning range "Saturday 10pm to 2am"', () => {
      const result = parseNaturalDate('Saturday 10pm to 2am', REFERENCE_DATE);
      expect(result).not.toBeNull();
      expect(result!.start.getHours()).toBe(22);
      if (result!.end) {
        expect(result!.end.getHours()).toBe(2);
        expect(result!.end.getTime()).toBeGreaterThan(result!.start.getTime());
      }
    });

    it('parses date without time', () => {
      const result = parseNaturalDate('next Friday', REFERENCE_DATE);
      expect(result).not.toBeNull();
      expect(result!.start.getDate()).toBe(20);
      expect(result!.end).toBeUndefined();
    });

    it('uses forwardDate to avoid past dates for bare weekday', () => {
      const result = parseNaturalDate('Monday', REFERENCE_DATE);
      expect(result).not.toBeNull();
      expect(result!.start.getDate()).toBeGreaterThanOrEqual(16);
    });

    it('rejects chrono end dates more than 24 hours after start', () => {
      const result = parseNaturalDate('June 20 to June 25', REFERENCE_DATE);
      if (result?.end) {
        const diff = result.end.getTime() - result.start.getTime();
        expect(diff).toBeLessThanOrEqual(24 * 60 * 60 * 1000);
      }
    });

    it('parses "next Sunday at midnight"', () => {
      const result = parseNaturalDate(
        'next Sunday at midnight',
        REFERENCE_DATE
      );
      expect(result).not.toBeNull();
      expect(result!.start.getHours()).toBe(0);
    });

    it('treats bare hours 1-7 as PM for event planning', () => {
      const result = parseNaturalDate('Thursday at 6', REFERENCE_DATE);
      expect(result).not.toBeNull();
      expect(result!.start.getHours()).toBe(18);
    });

    it('preserves explicit AM for bare hours', () => {
      const result = parseNaturalDate('Thursday at 6am', REFERENCE_DATE);
      expect(result).not.toBeNull();
      expect(result!.start.getHours()).toBe(6);
    });

    it('does not shift hours 8-11 to PM', () => {
      const result = parseNaturalDate('Thursday at 9', REFERENCE_DATE);
      expect(result).not.toBeNull();
      expect(result!.start.getHours()).toBe(9);
    });

    it('distributes bare hour as PM in conjunctions', () => {
      const result = tryClientDecomposition(
        'tomorrow and thursday at 6',
        REFERENCE_DATE
      );
      expect(result).not.toBeNull();
      expect(result!.length).toBe(2);
      expect(result![0].start.getHours()).toBe(18);
      expect(result![1].start.getHours()).toBe(18);
    });

    it('uses current date as reference when none provided', () => {
      const result = parseNaturalDate('tomorrow at 3pm');
      expect(result).not.toBeNull();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(result!.start.getDate()).toBe(tomorrow.getDate());
    });
  });

  describe('24-hour format', () => {
    it('parses "18:00"', () => {
      const result = parseNaturalDate('18:00', REFERENCE_DATE);
      expect(result).not.toBeNull();
      expect(result!.start.getHours()).toBe(18);
      expect(result!.start.getMinutes()).toBe(0);
    });

    it('parses "next Friday 14:00 to 16:00"', () => {
      const result = parseNaturalDate(
        'next Friday 14:00 to 16:00',
        REFERENCE_DATE
      );
      expect(result).not.toBeNull();
      expect(result!.start.getDate()).toBe(20);
      expect(result!.start.getHours()).toBe(14);
      if (result!.end) {
        expect(result!.end.getHours()).toBe(16);
      }
    });

    it('parses ISO-like format "2025-07-20 14:00"', () => {
      const result = parseNaturalDate('2025-07-20 14:00', REFERENCE_DATE);
      expect(result).not.toBeNull();
      expect(result!.start.getFullYear()).toBe(2025);
      expect(result!.start.getMonth()).toBe(6);
      expect(result!.start.getDate()).toBe(20);
      expect(result!.start.getHours()).toBe(14);
    });
  });
});

describe('parseDateExpressions', () => {
  it('parses multiple pre-decomposed expressions', () => {
    const expressions = ['Friday 4 pm to 8 pm', 'Saturday 4 pm to 8 pm'];
    const results = parseDateExpressions(expressions, REFERENCE_DATE);
    expect(results).toHaveLength(2);
    expect(results[0].start.getDate()).toBe(20);
    expect(results[1].start.getDate()).toBe(21);
  });

  it('parses three expressions with different times', () => {
    const expressions = [
      'next Monday 9 am to 12 pm',
      'next Wednesday 2 pm to 4 pm',
      'next Friday 6 pm to 8 pm',
    ];
    const results = parseDateExpressions(expressions, REFERENCE_DATE);
    expect(results).toHaveLength(3);
    expect(results[0].start.getHours()).toBe(9);
    expect(results[1].start.getHours()).toBe(14);
    expect(results[2].start.getHours()).toBe(18);
  });

  it('filters out unparseable expressions', () => {
    const expressions = [
      'next Friday at 3pm',
      'gibberish text here',
      'next Saturday at 4pm',
    ];
    const results = parseDateExpressions(expressions, REFERENCE_DATE);
    expect(results).toHaveLength(2);
  });

  it('returns empty array for all unparseable expressions', () => {
    const expressions = ['asdfgh', 'xyz123', 'not a date'];
    const results = parseDateExpressions(expressions, REFERENCE_DATE);
    expect(results).toHaveLength(0);
  });

  it('returns empty array for empty input', () => {
    const results = parseDateExpressions([], REFERENCE_DATE);
    expect(results).toHaveLength(0);
  });

  it('handles expressions with "in X weeks" pattern', () => {
    const expressions = [
      'next Tuesday at 2pm',
      'Tuesday in 2 weeks at 2pm',
      'Tuesday in 3 weeks at 2pm',
    ];
    const results = parseDateExpressions(expressions, REFERENCE_DATE);
    expect(results).toHaveLength(3);
    // Each should be 7 days apart
    const diff1 = results[1].start.getTime() - results[0].start.getTime();
    const diff2 = results[2].start.getTime() - results[1].start.getTime();
    const daysDiff1 = diff1 / (24 * 60 * 60 * 1000);
    const daysDiff2 = diff2 / (24 * 60 * 60 * 1000);
    expect(daysDiff1).toBeCloseTo(7, 0);
    expect(daysDiff2).toBeCloseTo(7, 0);
  });
});

describe('parseRawDateInput', () => {
  it('returns chrono results directly', () => {
    const results = parseRawDateInput('next Friday at 3pm', REFERENCE_DATE);
    expect(results).toHaveLength(1);
    expect(results[0].start.getDate()).toBe(20);
  });

  it('returns empty array for unparseable input', () => {
    const results = parseRawDateInput('asdfghjkl', REFERENCE_DATE);
    expect(results).toHaveLength(0);
  });
});

describe('validateParsedDates', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(REFERENCE_DATE);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('validates a future date as valid', () => {
    const dates: ParsedDateRange[] = [
      {
        start: new Date(2025, 5, 20, 15, 0, 0),
        end: new Date(2025, 5, 20, 20, 0, 0),
        text: 'Friday 3pm to 8pm',
      },
    ];
    const results = validateParsedDates(dates);
    expect(results).toHaveLength(1);
    expect(results[0].isValid).toBe(true);
    expect(results[0].errors).toHaveLength(0);
  });

  it('flags a past date', () => {
    const dates: ParsedDateRange[] = [
      {
        start: new Date(2025, 5, 10, 15, 0, 0),
        text: 'June 10 at 3pm',
      },
    ];
    const results = validateParsedDates(dates);
    expect(results[0].isValid).toBe(false);
    expect(results[0].errors).toContain('Date is in the past');
  });

  it('flags end time before start time', () => {
    const dates: ParsedDateRange[] = [
      {
        start: new Date(2025, 5, 20, 20, 0, 0),
        end: new Date(2025, 5, 20, 15, 0, 0),
        text: 'Friday 8pm to 3pm',
      },
    ];
    const results = validateParsedDates(dates);
    expect(results[0].isValid).toBe(false);
    expect(results[0].errors).toContain('End time must be after start time');
  });

  it('handles date without end time as valid', () => {
    const dates: ParsedDateRange[] = [
      {
        start: new Date(2025, 5, 20, 15, 0, 0),
        text: 'Friday at 3pm',
      },
    ];
    const results = validateParsedDates(dates);
    expect(results[0].isValid).toBe(true);
  });

  it('validates multiple dates independently', () => {
    const dates: ParsedDateRange[] = [
      {
        start: new Date(2025, 5, 20, 15, 0, 0),
        end: new Date(2025, 5, 20, 20, 0, 0),
        text: 'Valid date',
      },
      {
        start: new Date(2025, 5, 10, 15, 0, 0),
        text: 'Past date',
      },
    ];
    const results = validateParsedDates(dates);
    expect(results[0].isValid).toBe(true);
    expect(results[1].isValid).toBe(false);
  });

  it('flags date where end equals start', () => {
    const dates: ParsedDateRange[] = [
      {
        start: new Date(2025, 5, 20, 15, 0, 0),
        end: new Date(2025, 5, 20, 15, 0, 0),
        text: 'Zero-duration event',
      },
    ];
    const results = validateParsedDates(dates);
    expect(results[0].isValid).toBe(false);
    expect(results[0].errors).toContain('End time must be after start time');
  });
});

describe('tryClientDecomposition', () => {
  describe('simple expressions — parsed client-side', () => {
    const cases = [
      'next Friday at 3pm',
      'tomorrow 6-8pm',
      'Saturday at noon',
      'July 4th at 7pm',
      'day after tomorrow at 3pm',
      'next Monday 9am to 12pm',
      'Tuesday in 2 weeks at 7pm',
      'tonight at 8',
      '18:00',
      'day before next Friday',
    ];

    for (const input of cases) {
      it(`"${input}" resolves client-side`, () => {
        const result = tryClientDecomposition(input, REFERENCE_DATE);
        expect(result).not.toBeNull();
        expect(result!.length).toBe(1);
        expect(result![0].start).toBeInstanceOf(Date);
      });
    }
  });

  describe('conjunction splitting with time distribution', () => {
    it('"Tuesday and Thursday 6-8pm" → 2 results both with correct times', () => {
      const result = tryClientDecomposition(
        'Tuesday and Thursday 6-8pm',
        REFERENCE_DATE
      );
      expect(result).not.toBeNull();
      expect(result!.length).toBe(2);
      expect(result![0].start.getHours()).toBe(18);
      expect(result![0].end).toBeDefined();
      expect(result![0].end!.getHours()).toBe(20);
      expect(result![1].start.getHours()).toBe(18);
    });

    it('"fri or sat 4-8pm" → 2 results with distributed time', () => {
      const result = tryClientDecomposition('fri or sat 4-8pm', REFERENCE_DATE);
      expect(result).not.toBeNull();
      expect(result!.length).toBe(2);
      expect(result![0].start.getDate()).toBe(20); // Friday
      expect(result![1].start.getDate()).toBe(21); // Saturday
    });

    it('"Monday, Wednesday, and Friday at noon" → 3 results', () => {
      const result = tryClientDecomposition(
        'Monday, Wednesday, and Friday at noon',
        REFERENCE_DATE
      );
      expect(result).not.toBeNull();
      expect(result!.length).toBe(3);
      for (const r of result!) {
        expect(r.start.getHours()).toBe(12);
      }
    });

    it('"tomorrow or Sunday 5pm" → 2 results both at 5pm', () => {
      const result = tryClientDecomposition(
        'tomorrow or Sunday 5pm',
        REFERENCE_DATE
      );
      expect(result).not.toBeNull();
      expect(result!.length).toBe(2);
      expect(result![0].start.getHours()).toBe(17);
      expect(result![1].start.getHours()).toBe(17);
    });

    it('"tomorrow at 8 or 9" → 2 results with same date, different times', () => {
      const result = tryClientDecomposition(
        'tomorrow at 8 or 9',
        REFERENCE_DATE
      );
      expect(result).not.toBeNull();
      expect(result!.length).toBe(2);
      expect(result![0].start.getDate()).toBe(16);
      expect(result![1].start.getDate()).toBe(16);
    });

    it('"friday at 3, 4, or 5pm" → 3 results with same date', () => {
      const result = tryClientDecomposition(
        'friday at 3, 4, or 5pm',
        REFERENCE_DATE
      );
      expect(result).not.toBeNull();
      expect(result!.length).toBe(3);
    });

    it('"tomorrow at 8 or 9 or thursday at 12" → 3 results', () => {
      const result = tryClientDecomposition(
        'tomorrow at 8 or 9 or thursday at 12',
        REFERENCE_DATE
      );
      expect(result).not.toBeNull();
      expect(result!.length).toBe(3);
      // First two share tomorrow's date
      expect(result![0].start.getDate()).toBe(16);
      expect(result![1].start.getDate()).toBe(16);
      // Third is Thursday
      expect(result![2].start.getDate()).toBe(19);
    });

    it('"thursday/friday at 2pm" → 2 results via slash conjunction', () => {
      const result = tryClientDecomposition(
        'thursday/friday at 2pm',
        REFERENCE_DATE
      );
      expect(result).not.toBeNull();
      expect(result!.length).toBe(2);
      expect(result![0].start.getHours()).toBe(14);
      expect(result![1].start.getHours()).toBe(14);
    });

    it('does not split numeric date slashes like "8/15 at 3pm"', () => {
      const result = tryClientDecomposition('8/15 at 3pm', REFERENCE_DATE);
      expect(result).not.toBeNull();
      expect(result!.length).toBe(1);
    });

    it('"Saturday and Sunday 10am-2pm" → 2 results', () => {
      const result = tryClientDecomposition(
        'Saturday and Sunday 10am-2pm',
        REFERENCE_DATE
      );
      expect(result).not.toBeNull();
      expect(result!.length).toBe(2);
      expect(result![0].start.getHours()).toBe(10);
      expect(result![1].start.getHours()).toBe(10);
    });
  });

  describe('weekend expansion', () => {
    it('"this weekend 2-5pm" → Saturday and Sunday', () => {
      const result = tryClientDecomposition(
        'this weekend 2-5pm',
        REFERENCE_DATE
      );
      expect(result).not.toBeNull();
      expect(result!.length).toBe(2);
      expect(result![0].start.getDay()).toBe(6); // Saturday
      expect(result![1].start.getDay()).toBe(0); // Sunday
    });

    it('"next weekend afternoon" → 2 results', () => {
      const result = tryClientDecomposition(
        'next weekend afternoon',
        REFERENCE_DATE
      );
      expect(result).not.toBeNull();
      expect(result!.length).toBe(2);
    });

    it('"weekend" alone → Saturday and Sunday', () => {
      const result = tryClientDecomposition('weekend', REFERENCE_DATE);
      expect(result).not.toBeNull();
      expect(result!.length).toBe(2);
    });
  });

  describe('day ranges with through/thru', () => {
    it('"Monday through Wednesday 9am" → 3 results', () => {
      const result = tryClientDecomposition(
        'Monday through Wednesday 9am',
        REFERENCE_DATE
      );
      expect(result).not.toBeNull();
      expect(result!.length).toBe(3);
    });

    it('"Mon thru Fri 6pm" → 5 results', () => {
      const result = tryClientDecomposition('Mon thru Fri 6pm', REFERENCE_DATE);
      expect(result).not.toBeNull();
      expect(result!.length).toBe(5);
    });
  });

  describe('falls back to LLM on unreliable parses', () => {
    it('"tmr or thurs at 6p" — chrono drops abbreviated time', () => {
      expect(
        tryClientDecomposition('tmr or thurs at 6p', REFERENCE_DATE)
      ).toBeNull();
    });

    it('"tmr or thurs at six" — spelled-out time not parsed', () => {
      expect(
        tryClientDecomposition('tmr or thurs at six', REFERENCE_DATE)
      ).toBeNull();
    });

    it('"tmr at 6p" — single expression with unrecognized time format', () => {
      expect(tryClientDecomposition('tmr at 6p', REFERENCE_DATE)).toBeNull();
    });
  });

  describe('falls back to LLM (returns null)', () => {
    it('"the next 3 Tuesdays at 2pm" — sequence enumeration', () => {
      expect(
        tryClientDecomposition('the next 3 Tuesdays at 2pm', REFERENCE_DATE)
      ).toBeNull();
    });

    it('"every Friday in January at 6pm" — calendar enumeration', () => {
      expect(
        tryClientDecomposition('every Friday in January at 6pm', REFERENCE_DATE)
      ).toBeNull();
    });

    it('"Dec 20-22 at 7pm" — date range enumeration', () => {
      expect(
        tryClientDecomposition('Dec 20-22 at 7pm', REFERENCE_DATE)
      ).toBeNull();
    });
  });
});

describe('needsLLMDecomposition', () => {
  it('returns false for inputs handled client-side', () => {
    expect(needsLLMDecomposition('next Friday at 3pm')).toBe(false);
    expect(needsLLMDecomposition('Tuesday and Thursday 6-8pm')).toBe(false);
    expect(needsLLMDecomposition('this weekend 2-5pm')).toBe(false);
    expect(needsLLMDecomposition('Monday through Wednesday 9am')).toBe(false);
  });

  it('returns true for inputs that need the LLM', () => {
    expect(needsLLMDecomposition('the next 3 Tuesdays at 2pm')).toBe(true);
    expect(needsLLMDecomposition('every Friday in January at 6pm')).toBe(true);
    expect(needsLLMDecomposition('Dec 20-22 at 7pm')).toBe(true);
  });
});

describe('formatParsedDateRange', () => {
  it('formats a date without end time', () => {
    const date: ParsedDateRange = {
      start: new Date(2025, 5, 20, 15, 0, 0),
      text: 'Friday at 3pm',
    };
    const result = formatParsedDateRange(date);
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('formats same-day range with compact end time', () => {
    const date: ParsedDateRange = {
      start: new Date(2025, 5, 20, 15, 0, 0),
      end: new Date(2025, 5, 20, 20, 0, 0),
      text: 'Friday 3pm to 8pm',
    };
    const result = formatParsedDateRange(date);
    expect(result).toContain('-');
  });

  it('formats cross-day range with full dates', () => {
    const date: ParsedDateRange = {
      start: new Date(2025, 5, 20, 22, 0, 0),
      end: new Date(2025, 5, 21, 2, 0, 0),
      text: 'Friday 10pm to Saturday 2am',
    };
    const result = formatParsedDateRange(date);
    expect(result).toContain('-');
  });
});
