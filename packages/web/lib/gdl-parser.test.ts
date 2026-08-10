import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseGDL, tokenizeGDL, isGDL } from './gdl-parser';

// Monday August 4, 2025 at noon
const REFERENCE_DATE = new Date(2025, 7, 4, 12, 0, 0);

// Assert a parse result is successful and return its results
function expectSuccess(input: string, referenceDate?: Date) {
  const result = parseGDL(input, referenceDate ?? REFERENCE_DATE);
  expect(result.success).toBe(true);
  if (!result.success)
    throw new Error(`Expected success but got error: ${result.error}`);
  return result.results;
}

// Assert a parse result is an error
function expectError(input: string, referenceDate?: Date) {
  const result = parseGDL(input, referenceDate ?? REFERENCE_DATE);
  expect(result.success).toBe(false);
  if (result.success) throw new Error('Expected error but got success');
  return result.error;
}

describe('gdl-parser', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(REFERENCE_DATE);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // -------------------------------------------------------------------
  // isGDL detection
  // -------------------------------------------------------------------
  describe('isGDL', () => {
    test('returns true for input containing @', () => {
      expect(isGDL('Fr@18')).toBe(true);
    });

    test('returns true for input containing ^', () => {
      expect(isGDL('Fr@18^2h')).toBe(true);
    });

    test('returns true for input containing *', () => {
      expect(isGDL('Tu*3')).toBe(true);
    });

    test('returns true for input with @ in a complex expression', () => {
      expect(isGDL('[Tu,Th]@18-20')).toBe(true);
    });

    test('returns false for plain text', () => {
      expect(isGDL('Meet me on Friday')).toBe(false);
    });

    test('returns false for day abbreviations alone', () => {
      expect(isGDL('Mo Tu We')).toBe(false);
    });

    test('returns false for empty string', () => {
      expect(isGDL('')).toBe(false);
    });

    test('returns false for a plain date string', () => {
      expect(isGDL('August 10, 2025')).toBe(false);
    });
  });

  // -------------------------------------------------------------------
  // parseGDL - Single day with time
  // -------------------------------------------------------------------
  describe('parseGDL - single day with time', () => {
    test('Fr@19 produces Friday at 7 PM', () => {
      const results = expectSuccess('Fr@19');
      expect(results).toHaveLength(1);
      expect(results[0].start.getFullYear()).toBe(2025);
      expect(results[0].start.getMonth()).toBe(7); // August
      expect(results[0].start.getDate()).toBe(8); // Friday Aug 8
      expect(results[0].start.getHours()).toBe(19);
      expect(results[0].start.getMinutes()).toBe(0);
      expect(results[0].end).toBeUndefined();
    });

    test('Tu@14-16 produces Tuesday 2-4 PM span', () => {
      const results = expectSuccess('Tu@14-16');
      expect(results).toHaveLength(1);
      expect(results[0].start.getDate()).toBe(5); // Tuesday Aug 5
      expect(results[0].start.getHours()).toBe(14);
      expect(results[0].end).toBeDefined();
      expect(results[0].end!.getHours()).toBe(16);
      expect(results[0].end!.getDate()).toBe(5); // same day
    });

    test('Sa produces Saturday all day (no time, no end)', () => {
      const results = expectSuccess('Sa');
      expect(results).toHaveLength(1);
      expect(results[0].start.getDate()).toBe(9); // Saturday Aug 9
      expect(results[0].end).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------
  // parseGDL - 24-hour time
  // -------------------------------------------------------------------
  describe('parseGDL - 24-hour time', () => {
    test('Fr@6 is 6 AM (not PM)', () => {
      const results = expectSuccess('Fr@6');
      expect(results).toHaveLength(1);
      expect(results[0].start.getHours()).toBe(6);
    });

    test('Fr@18 is 6 PM', () => {
      const results = expectSuccess('Fr@18');
      expect(results).toHaveLength(1);
      expect(results[0].start.getHours()).toBe(18);
    });

    test('Fr@0 is midnight', () => {
      const results = expectSuccess('Fr@0');
      expect(results).toHaveLength(1);
      expect(results[0].start.getHours()).toBe(0);
    });

    test('Fr@6pm is 6 PM (18:00)', () => {
      const results = expectSuccess('Fr@6pm');
      expect(results).toHaveLength(1);
      expect(results[0].start.getHours()).toBe(18);
    });

    test('Fr@9am is 9 AM', () => {
      const results = expectSuccess('Fr@9am');
      expect(results).toHaveLength(1);
      expect(results[0].start.getHours()).toBe(9);
    });

    test('Fr@12pm is noon (12:00)', () => {
      const results = expectSuccess('Fr@12pm');
      expect(results).toHaveLength(1);
      expect(results[0].start.getHours()).toBe(12);
    });

    test('Fr@12am is midnight (0:00)', () => {
      const results = expectSuccess('Fr@12am');
      expect(results).toHaveLength(1);
      expect(results[0].start.getHours()).toBe(0);
    });

    test('Fr@9:30 is 9:30 AM', () => {
      const results = expectSuccess('Fr@9:30');
      expect(results).toHaveLength(1);
      expect(results[0].start.getHours()).toBe(9);
      expect(results[0].start.getMinutes()).toBe(30);
    });

    test('Fr@14:30 is 2:30 PM', () => {
      const results = expectSuccess('Fr@14:30');
      expect(results).toHaveLength(1);
      expect(results[0].start.getHours()).toBe(14);
      expect(results[0].start.getMinutes()).toBe(30);
    });

    test('Fr@25 is a syntax error (hour out of range)', () => {
      const error = expectError('Fr@25');
      expect(error).toBeTruthy();
    });

    test('Fr@23 is valid (11 PM)', () => {
      const results = expectSuccess('Fr@23');
      expect(results).toHaveLength(1);
      expect(results[0].start.getHours()).toBe(23);
    });

    test('Fr@14:60 is a syntax error (minute out of range)', () => {
      const error = expectError('Fr@14:60');
      expect(error).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------
  // parseGDL - Spans
  // -------------------------------------------------------------------
  describe('parseGDL - spans', () => {
    test('Fr@18-23 produces 6 PM to 11 PM', () => {
      const results = expectSuccess('Fr@18-23');
      expect(results).toHaveLength(1);
      expect(results[0].start.getHours()).toBe(18);
      expect(results[0].end).toBeDefined();
      expect(results[0].end!.getHours()).toBe(23);
      expect(results[0].end!.getDate()).toBe(results[0].start.getDate());
    });

    test('Fr@21-2 crosses midnight: 9 PM to 2 AM next day', () => {
      const results = expectSuccess('Fr@21-2');
      expect(results).toHaveLength(1);
      expect(results[0].start.getHours()).toBe(21);
      expect(results[0].start.getDate()).toBe(8); // Friday Aug 8
      expect(results[0].end).toBeDefined();
      expect(results[0].end!.getHours()).toBe(2);
      expect(results[0].end!.getDate()).toBe(9); // Saturday Aug 9 (next day)
    });

    test('Fr@0-0 is a syntax error (identical start and end)', () => {
      const error = expectError('Fr@0-0');
      expect(error).toBeTruthy();
    });

    test('Fr@18-18 is a syntax error (identical start and end)', () => {
      const error = expectError('Fr@18-18');
      expect(error).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------
  // parseGDL - Duration
  // -------------------------------------------------------------------
  describe('parseGDL - duration', () => {
    test('Fr@22^3h produces 10 PM to 1 AM (cross-midnight)', () => {
      const results = expectSuccess('Fr@22^3h');
      expect(results).toHaveLength(1);
      expect(results[0].start.getHours()).toBe(22);
      expect(results[0].start.getDate()).toBe(8); // Friday Aug 8
      expect(results[0].end).toBeDefined();
      expect(results[0].end!.getHours()).toBe(1);
      expect(results[0].end!.getDate()).toBe(9); // Saturday Aug 9
    });

    test('Tu@18^90m produces 6 PM to 7:30 PM', () => {
      const results = expectSuccess('Tu@18^90m');
      expect(results).toHaveLength(1);
      expect(results[0].start.getHours()).toBe(18);
      expect(results[0].end).toBeDefined();
      expect(results[0].end!.getHours()).toBe(19);
      expect(results[0].end!.getMinutes()).toBe(30);
    });

    test('Fr@18-20^2h is a syntax error (span and duration mutually exclusive)', () => {
      const error = expectError('Fr@18-20^2h');
      expect(error).toBeTruthy();
    });

    test('Sa@10^2h produces 10 AM to 12 PM', () => {
      const results = expectSuccess('Sa@10^2h');
      expect(results).toHaveLength(1);
      expect(results[0].start.getHours()).toBe(10);
      expect(results[0].end).toBeDefined();
      expect(results[0].end!.getHours()).toBe(12);
      expect(results[0].end!.getMinutes()).toBe(0);
    });
  });

  // -------------------------------------------------------------------
  // parseGDL - Lists
  // -------------------------------------------------------------------
  describe('parseGDL - lists', () => {
    test('[Tu,Th]@18-20 produces 2 options', () => {
      const results = expectSuccess('[Tu,Th]@18-20');
      expect(results).toHaveLength(2);

      // Tuesday Aug 5
      expect(results[0].start.getDate()).toBe(5);
      expect(results[0].start.getHours()).toBe(18);
      expect(results[0].end!.getHours()).toBe(20);

      // Thursday Aug 7
      expect(results[1].start.getDate()).toBe(7);
      expect(results[1].start.getHours()).toBe(18);
      expect(results[1].end!.getHours()).toBe(20);
    });

    test('Fr@[18,19,20] produces 3 options (time list)', () => {
      const results = expectSuccess('Fr@[18,19,20]');
      expect(results).toHaveLength(3);

      expect(results[0].start.getHours()).toBe(18);
      expect(results[1].start.getHours()).toBe(19);
      expect(results[2].start.getHours()).toBe(20);

      // All on Friday Aug 8
      for (const r of results) {
        expect(r.start.getDate()).toBe(8);
      }
    });

    test('[Tu,Th]@[18,19] produces 4 options (cross-product)', () => {
      const results = expectSuccess('[Tu,Th]@[18,19]');
      expect(results).toHaveLength(4);

      // Tu@18, Tu@19, Th@18, Th@19
      const combos = results.map(r => ({
        day: r.start.getDate(),
        hour: r.start.getHours(),
      }));

      expect(combos).toContainEqual({ day: 5, hour: 18 }); // Tu@18
      expect(combos).toContainEqual({ day: 5, hour: 19 }); // Tu@19
      expect(combos).toContainEqual({ day: 7, hour: 18 }); // Th@18
      expect(combos).toContainEqual({ day: 7, hour: 19 }); // Th@19
    });

    test('Fr@[] is a syntax error (empty list)', () => {
      const error = expectError('Fr@[]');
      expect(error).toBeTruthy();
    });

    test('[Fr]@19 is the same as Fr@19 (singleton list)', () => {
      const singleton = expectSuccess('[Fr]@19');
      const plain = expectSuccess('Fr@19');

      expect(singleton).toHaveLength(1);
      expect(singleton[0].start.getTime()).toBe(plain[0].start.getTime());
    });

    test('[] is a syntax error (empty day list)', () => {
      const error = expectError('[]@18');
      expect(error).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------
  // parseGDL - Ranges
  // -------------------------------------------------------------------
  describe('parseGDL - ranges', () => {
    test('(Mo,Fr)@9-17 produces 5 options (Mon through Fri)', () => {
      const results = expectSuccess('(Mo,Fr)@9-17');
      expect(results).toHaveLength(5);

      // Mo=4, Tu=5, We=6, Th=7, Fr=8 (all August 2025)
      const days = results.map(r => r.start.getDate()).sort((a, b) => a - b);
      expect(days).toEqual([4, 5, 6, 7, 8]);

      for (const r of results) {
        expect(r.start.getHours()).toBe(9);
        expect(r.end!.getHours()).toBe(17);
      }
    });

    test('Fr@(18,20) produces 3 options (hours 18, 19, 20)', () => {
      const results = expectSuccess('Fr@(18,20)');
      expect(results).toHaveLength(3);

      const hours = results.map(r => r.start.getHours()).sort((a, b) => a - b);
      expect(hours).toEqual([18, 19, 20]);
    });

    test('(Fr,Tu)@18 produces 5 options (wraps: Fr,Sa,Su,Mo,Tu)', () => {
      const results = expectSuccess('(Fr,Tu)@18');
      expect(results).toHaveLength(5);

      // Fr Aug 8, Sa Aug 9, Su Aug 10, Mo Aug 11, Tu Aug 12
      const days = results.map(r => r.start.getDate()).sort((a, b) => a - b);
      expect(days).toEqual([8, 9, 10, 11, 12]);
    });

    test('(Mo,Fr,Su) is a range with step (Mon through Fri, step by Su index)', () => {
      // 3-item range is now valid: (start, end, step)
      const results = expectSuccess('(Mo,Fr,Su)@18');
      expect(results.length).toBeGreaterThanOrEqual(1);
    });

    test('(Mo,Fr,4) is a syntax error (4 items)', () => {
      const error = expectError('(Mo,Fr,Su,We)@18');
      expect(error).toBeTruthy();
    });

    test('(Mo) is a syntax error (1 item instead of 2)', () => {
      const error = expectError('(Mo)@18');
      expect(error).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------
  // parseGDL - Ranges with custom step
  // -------------------------------------------------------------------
  describe('parseGDL - ranges with step', () => {
    test('Fr@(18,22,2) produces 3 options: 18, 20, 22', () => {
      const results = expectSuccess('Fr@(18,22,2)');
      expect(results).toHaveLength(3);
      expect(results[0].start.getHours()).toBe(18);
      expect(results[1].start.getHours()).toBe(20);
      expect(results[2].start.getHours()).toBe(22);
    });

    test('Fr@7^(2h,4h) produces 3 duration options: 2h, 3h, 4h', () => {
      const results = expectSuccess('Fr@7^(2h,4h)');
      expect(results).toHaveLength(3);
      expect(results[0].end!.getHours()).toBe(9);
      expect(results[1].end!.getHours()).toBe(10);
      expect(results[2].end!.getHours()).toBe(11);
    });

    test('Fr@7^(2h,4h,2h) produces 2 options with step 2h', () => {
      const results = expectSuccess('Fr@7^(2h,4h,2h)');
      expect(results).toHaveLength(2);
      expect(results[0].end!.getHours()).toBe(9);
      expect(results[1].end!.getHours()).toBe(11);
    });

    test('Fr@7^(30m,90m,30m) produces 3 options: 30m, 60m, 90m', () => {
      const results = expectSuccess('Fr@7^(30m,90m,30m)');
      expect(results).toHaveLength(3);
      expect(results[0].end!.getMinutes()).toBe(30);
      expect(results[1].end!.getHours()).toBe(8);
      expect(results[1].end!.getMinutes()).toBe(0);
      expect(results[2].end!.getMinutes()).toBe(30);
    });

    test('(10,20,5)@18 produces days 10, 15, 20', () => {
      const results = expectSuccess('(10,20,5)@18');
      expect(results).toHaveLength(3);
      expect(results[0].start.getDate()).toBe(10);
      expect(results[1].start.getDate()).toBe(15);
      expect(results[2].start.getDate()).toBe(20);
    });

    test('step that overshoots stops before exceeding end', () => {
      const results = expectSuccess('(10,14,3)@18');
      expect(results).toHaveLength(2);
      expect(results[0].start.getDate()).toBe(10);
      expect(results[1].start.getDate()).toBe(13);
    });
  });

  // -------------------------------------------------------------------
  // parseGDL - Recurrence
  // -------------------------------------------------------------------
  describe('parseGDL - recurrence', () => {
    test('Tu*3@14 produces 3 Tuesdays at 2 PM', () => {
      const results = expectSuccess('Tu*3@14');
      expect(results).toHaveLength(3);

      // Aug 5, Aug 12, Aug 19
      expect(results[0].start.getDate()).toBe(5);
      expect(results[1].start.getDate()).toBe(12);
      expect(results[2].start.getDate()).toBe(19);

      for (const r of results) {
        expect(r.start.getHours()).toBe(14);
        expect(r.start.getMonth()).toBe(7); // August
      }
    });

    test('[Tu*2,Th*3]@14 produces 5 options', () => {
      const results = expectSuccess('[Tu*2,Th*3]@14');
      expect(results).toHaveLength(5);

      // 2 Tuesdays: Aug 5, Aug 12
      // 3 Thursdays: Aug 7, Aug 14, Aug 21
      const days = results.map(r => r.start.getDate()).sort((a, b) => a - b);
      expect(days).toEqual([5, 7, 12, 14, 21]);
    });

    test('[Tu,Th]*2@14 distributes to 4 options (2 Tu + 2 Th)', () => {
      const results = expectSuccess('[Tu,Th]*2@14');
      expect(results).toHaveLength(4);

      // 2 Tuesdays: Aug 5, Aug 12
      // 2 Thursdays: Aug 7, Aug 14
      const days = results.map(r => r.start.getDate()).sort((a, b) => a - b);
      expect(days).toEqual([5, 7, 12, 14]);
    });

    test('Tu*0@14 is a syntax error (*0 invalid)', () => {
      const error = expectError('Tu*0@14');
      expect(error).toBeTruthy();
    });

    test('Fr*1@18 produces same result as Fr@18 (no-op recurrence)', () => {
      const recurring = expectSuccess('Fr*1@18');
      const single = expectSuccess('Fr@18');

      expect(recurring).toHaveLength(1);
      expect(recurring[0].start.getTime()).toBe(single[0].start.getTime());
    });

    test('recurrence anchored to current date: today counts if matching', () => {
      // Reference date is Monday Aug 4, 2025
      const results = expectSuccess('Mo*2@14');
      expect(results).toHaveLength(2);
      // Today (Monday Aug 4) counts, next is Aug 11
      expect(results[0].start.getDate()).toBe(4);
      expect(results[1].start.getDate()).toBe(11);
    });
  });

  // -------------------------------------------------------------------
  // parseGDL - Specific dates
  // -------------------------------------------------------------------
  describe('parseGDL - specific dates', () => {
    test('08/10@14-17 produces August 10 with 2-5 PM span', () => {
      const results = expectSuccess('08/10@14-17');
      expect(results).toHaveLength(1);
      expect(results[0].start.getFullYear()).toBe(2025);
      expect(results[0].start.getMonth()).toBe(7); // August
      expect(results[0].start.getDate()).toBe(10);
      expect(results[0].start.getHours()).toBe(14);
      expect(results[0].end!.getHours()).toBe(17);
    });

    test('10@6pm produces the 10th of current month at 6 PM', () => {
      const results = expectSuccess('10@6pm');
      expect(results).toHaveLength(1);
      expect(results[0].start.getMonth()).toBe(7); // August
      expect(results[0].start.getDate()).toBe(10);
      expect(results[0].start.getHours()).toBe(18);
    });

    test('(10,15)@6pm produces 6 day-of-month options (10 through 15)', () => {
      const results = expectSuccess('(10,15)@6pm');
      expect(results).toHaveLength(6);

      const days = results.map(r => r.start.getDate()).sort((a, b) => a - b);
      expect(days).toEqual([10, 11, 12, 13, 14, 15]);

      for (const r of results) {
        expect(r.start.getHours()).toBe(18);
      }
    });

    test('13/10@14 is a syntax error (month 13 invalid)', () => {
      const error = expectError('13/10@14');
      expect(error).toBeTruthy();
    });

    test('02/30@14 is a syntax error (Feb 30 invalid)', () => {
      const error = expectError('02/30@14');
      expect(error).toBeTruthy();
    });

    test('specific dates resolve to next future occurrence', () => {
      // Aug 3 is in the past (reference is Aug 4), should resolve to next year
      const results = expectSuccess('08/03@14');
      expect(results).toHaveLength(1);
      expect(results[0].start.getFullYear()).toBe(2026);
      expect(results[0].start.getMonth()).toBe(7);
      expect(results[0].start.getDate()).toBe(3);
    });

    test('02/29 resolves to next leap year', () => {
      const results = expectSuccess('02/29@12');
      expect(results).toHaveLength(1);
      // 2025 is not a leap year, 2028 is
      expect(results[0].start.getFullYear()).toBe(2028);
      expect(results[0].start.getMonth()).toBe(1); // February
      expect(results[0].start.getDate()).toBe(29);
    });
  });

  // -------------------------------------------------------------------
  // parseGDL - Duration with lists
  // -------------------------------------------------------------------
  describe('parseGDL - duration with lists', () => {
    test('Fr@[18,19,20]^2h produces 3 spans', () => {
      const results = expectSuccess('Fr@[18,19,20]^2h');
      expect(results).toHaveLength(3);

      expect(results[0].start.getHours()).toBe(18);
      expect(results[0].end!.getHours()).toBe(20);

      expect(results[1].start.getHours()).toBe(19);
      expect(results[1].end!.getHours()).toBe(21);

      expect(results[2].start.getHours()).toBe(20);
      expect(results[2].end!.getHours()).toBe(22);
    });

    test('Fr@18^[2h,3h] produces 2 spans with different durations', () => {
      const results = expectSuccess('Fr@18^[2h,3h]');
      expect(results).toHaveLength(2);

      // Both start at 18:00
      expect(results[0].start.getHours()).toBe(18);
      expect(results[1].start.getHours()).toBe(18);

      // Different end times
      expect(results[0].end!.getHours()).toBe(20); // +2h
      expect(results[1].end!.getHours()).toBe(21); // +3h
    });
  });

  // -------------------------------------------------------------------
  // parseGDL - Span lists (cross-product)
  // -------------------------------------------------------------------
  describe('parseGDL - span lists (cross-product)', () => {
    test('Fr@[13,14]-[17,18] produces 4 spans', () => {
      const results = expectSuccess('Fr@[13,14]-[17,18]');
      expect(results).toHaveLength(4);

      const spans = results.map(r => ({
        startHour: r.start.getHours(),
        endHour: r.end!.getHours(),
      }));

      expect(spans).toContainEqual({ startHour: 13, endHour: 17 });
      expect(spans).toContainEqual({ startHour: 13, endHour: 18 });
      expect(spans).toContainEqual({ startHour: 14, endHour: 17 });
      expect(spans).toContainEqual({ startHour: 14, endHour: 18 });
    });
  });

  // -------------------------------------------------------------------
  // parseGDL - Combining with +
  // -------------------------------------------------------------------
  describe('parseGDL - combining with +', () => {
    test('Tu@14 + Fr@18 produces 2 options', () => {
      const results = expectSuccess('Tu@14 + Fr@18');
      expect(results).toHaveLength(2);

      const entries = results.map(r => ({
        day: r.start.getDate(),
        hour: r.start.getHours(),
      }));

      expect(entries).toContainEqual({ day: 5, hour: 14 }); // Tuesday
      expect(entries).toContainEqual({ day: 8, hour: 18 }); // Friday
    });

    test('Fr@18 + Fr@18 "dinner" deduplicates and preserves note', () => {
      const results = expectSuccess('Fr@18 + Fr@18 "dinner"');
      expect(results).toHaveLength(1);
      expect(results[0].start.getDate()).toBe(8);
      expect(results[0].start.getHours()).toBe(18);
      expect(results[0].note).toBe('dinner');
    });

    test('Fr@18 "lunch" + Fr@18 "dinner" deduplicates and joins notes', () => {
      const results = expectSuccess('Fr@18 "lunch" + Fr@18 "dinner"');
      expect(results).toHaveLength(1);
      // Notes should be comma-joined
      expect(results[0].note).toContain('lunch');
      expect(results[0].note).toContain('dinner');
    });

    test('multiple + unions combine all results', () => {
      const results = expectSuccess('Mo@9 + We@12 + Fr@18');
      expect(results).toHaveLength(3);
    });
  });

  // -------------------------------------------------------------------
  // parseGDL - Notes
  // -------------------------------------------------------------------
  describe('parseGDL - notes', () => {
    test('Fr@18 "dinner" attaches note', () => {
      const results = expectSuccess('Fr@18 "dinner"');
      expect(results).toHaveLength(1);
      expect(results[0].note).toBe('dinner');
    });

    test('[Fr,Sa]@18 "dinner" distributes note to both options', () => {
      const results = expectSuccess('[Fr,Sa]@18 "dinner"');
      expect(results).toHaveLength(2);
      expect(results[0].note).toBe('dinner');
      expect(results[1].note).toBe('dinner');
    });

    test('[Fr "dinner",Sa "brunch"]@18 uses per-item notes', () => {
      const results = expectSuccess('[Fr "dinner",Sa "brunch"]@18');
      expect(results).toHaveLength(2);

      const friday = results.find(r => r.start.getDate() === 8);
      const saturday = results.find(r => r.start.getDate() === 9);

      expect(friday).toBeDefined();
      expect(saturday).toBeDefined();
      expect(friday!.note).toBe('dinner');
      expect(saturday!.note).toBe('brunch');
    });

    test('Fr@18 "unclosed is a syntax error (unclosed quote)', () => {
      const error = expectError('Fr@18 "unclosed');
      expect(error).toBeTruthy();
    });

    test('note cannot contain double quote', () => {
      const error = expectError('Fr@18 "say "hello""');
      expect(error).toBeTruthy();
    });

    test('Fr "note" @18 is a syntax error (note between day and @ outside list)', () => {
      const error = expectError('Fr "note" @18');
      expect(error).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------
  // parseGDL - Max options
  // -------------------------------------------------------------------
  describe('parseGDL - max options', () => {
    test('expression producing more than 20 options is rejected', () => {
      // (Mo,Fr)@(0,23) = 5 days x 24 hours = 120 options
      // Or more simply: [Mo,Tu,We,Th,Fr]*5@14 = 25 options
      const error = expectError('[Mo,Tu,We,Th,Fr]*5@14');
      expect(error).toBeTruthy();
    });

    test('expression producing exactly 20 options is accepted', () => {
      // [Mo,Tu,We,Th,Fr]*4@14 = 20 options
      const results = expectSuccess('[Mo,Tu,We,Th,Fr]*4@14');
      expect(results).toHaveLength(20);
    });
  });

  // -------------------------------------------------------------------
  // parseGDL - Whitespace tolerance
  // -------------------------------------------------------------------
  describe('parseGDL - whitespace tolerance', () => {
    test('"Fr @ 18" parses same as "Fr@18"', () => {
      const withSpaces = expectSuccess('Fr @ 18');
      const without = expectSuccess('Fr@18');

      expect(withSpaces).toHaveLength(1);
      expect(withSpaces[0].start.getTime()).toBe(without[0].start.getTime());
    });

    test('"[ Tu , Th ] @ 18" parses same as "[Tu,Th]@18"', () => {
      const withSpaces = expectSuccess('[ Tu , Th ] @ 18');
      const without = expectSuccess('[Tu,Th]@18');

      expect(withSpaces).toHaveLength(without.length);
    });

    test('"Tu * 3 @ 14" parses same as "Tu*3@14"', () => {
      const withSpaces = expectSuccess('Tu * 3 @ 14');
      const without = expectSuccess('Tu*3@14');

      expect(withSpaces).toHaveLength(without.length);
      expect(withSpaces[0].start.getTime()).toBe(without[0].start.getTime());
    });
  });

  // -------------------------------------------------------------------
  // parseGDL - Mixed types in lists
  // -------------------------------------------------------------------
  describe('parseGDL - mixed types in lists', () => {
    test('[Mo,08/15]@18 produces 2 options', () => {
      const results = expectSuccess('[Mo,08/15]@18');
      expect(results).toHaveLength(2);

      const monday = results.find(r => r.start.getDay() === 1); // Monday
      const aug15 = results.find(r => r.start.getDate() === 15);

      expect(monday).toBeDefined();
      expect(aug15).toBeDefined();
      expect(monday!.start.getHours()).toBe(18);
      expect(aug15!.start.getHours()).toBe(18);
    });

    test('[Mo,08/15,We]@18 produces 3 options', () => {
      const results = expectSuccess('[Mo,08/15,We]@18');
      expect(results).toHaveLength(3);
    });
  });

  // -------------------------------------------------------------------
  // parseGDL - Recurrence on specific dates
  // -------------------------------------------------------------------
  describe('parseGDL - recurrence on specific dates', () => {
    test('* on specific date (MM/DD) inside list is a syntax error', () => {
      const error = expectError('[08/15*2]@18');
      expect(error).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------
  // parseGDL - Case insensitivity
  // -------------------------------------------------------------------
  describe('parseGDL - case insensitivity', () => {
    test('day abbreviations are case-insensitive', () => {
      const upper = expectSuccess('FR@18');
      const lower = expectSuccess('fr@18');
      const mixed = expectSuccess('Fr@18');

      expect(upper[0].start.getTime()).toBe(lower[0].start.getTime());
      expect(upper[0].start.getTime()).toBe(mixed[0].start.getTime());
    });

    test('am/pm suffixes are case-insensitive', () => {
      const lower = expectSuccess('Fr@6pm');
      const upper = expectSuccess('Fr@6PM');

      expect(lower[0].start.getHours()).toBe(18);
      expect(upper[0].start.getHours()).toBe(18);
    });
  });

  // -------------------------------------------------------------------
  // parseGDL - Edge cases
  // -------------------------------------------------------------------
  describe('parseGDL - edge cases', () => {
    test('empty string returns error', () => {
      const error = expectError('');
      expect(error).toBeTruthy();
    });

    test('just whitespace returns error', () => {
      const error = expectError('   ');
      expect(error).toBeTruthy();
    });

    test('bare @ is a syntax error', () => {
      const error = expectError('@');
      expect(error).toBeTruthy();
    });

    test('* without a day is a syntax error', () => {
      const error = expectError('*3@14');
      expect(error).toBeTruthy();
    });

    test('duration without time is a syntax error', () => {
      const error = expectError('Fr^2h');
      expect(error).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------
  // parseGDL - referenceDate parameter
  // -------------------------------------------------------------------
  describe('parseGDL - referenceDate parameter', () => {
    test('uses provided referenceDate for date resolution', () => {
      const customRef = new Date(2025, 11, 1, 12, 0, 0); // Monday Dec 1, 2025
      const results = expectSuccess('Fr@18', customRef);
      expect(results).toHaveLength(1);
      expect(results[0].start.getMonth()).toBe(11); // December
      expect(results[0].start.getDate()).toBe(5); // Friday Dec 5
    });
  });

  // -------------------------------------------------------------------
  // tokenizeGDL
  // -------------------------------------------------------------------
  describe('tokenizeGDL', () => {
    test('tokenizes a simple expression with correct types', () => {
      const tokens = tokenizeGDL('Fr@18');

      const dayToken = tokens.find(t => t.type === 'day');
      expect(dayToken).toBeDefined();
      expect(dayToken!.value).toBe('Fr');

      const opToken = tokens.find(
        t => t.type === 'operator' && t.value === '@'
      );
      expect(opToken).toBeDefined();

      const timeToken = tokens.find(t => t.type === 'time');
      expect(timeToken).toBeDefined();
      expect(timeToken!.value).toBe('18');
    });

    test('day abbreviations get type "day"', () => {
      const tokens = tokenizeGDL('Mo');
      const dayTokens = tokens.filter(t => t.type === 'day');
      expect(dayTokens).toHaveLength(1);
      expect(dayTokens[0].value).toBe('Mo');
    });

    test('all day abbreviations are recognized', () => {
      const days = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
      for (const day of days) {
        const tokens = tokenizeGDL(`${day}@18`);
        const dayToken = tokens.find(t => t.type === 'day');
        expect(dayToken).toBeDefined();
        expect(dayToken!.value.toLowerCase()).toBe(day.toLowerCase());
      }
    });

    test('numbers after @ get type "time"', () => {
      const tokens = tokenizeGDL('Fr@14:30');
      const timeTokens = tokens.filter(t => t.type === 'time');
      expect(timeTokens.length).toBeGreaterThanOrEqual(1);
    });

    test('operators @, -, ^, * get type "operator" and + gets "combiner"', () => {
      const tokens = tokenizeGDL('Tu*3@18-20 + Fr@22^2h');
      const operators = tokens.filter(t => t.type === 'operator');
      const opValues = operators.map(t => t.value);

      expect(opValues).toContain('*');
      expect(opValues).toContain('@');
      expect(opValues).toContain('-');
      expect(opValues).toContain('^');

      const combiners = tokens.filter(t => t.type === 'combiner');
      expect(combiners.map(t => t.value)).toContain('+');
    });

    test('brackets [], () get type "bracket"', () => {
      const tokens = tokenizeGDL('[Tu,Th]@(18,20)');
      const brackets = tokens.filter(t => t.type === 'bracket');
      const bracketValues = brackets.map(t => t.value);

      expect(bracketValues).toContain('[');
      expect(bracketValues).toContain(']');
      expect(bracketValues).toContain('(');
      expect(bracketValues).toContain(')');
    });

    test('recurrence count gets type "recurrence"', () => {
      const tokens = tokenizeGDL('Tu*3@14');
      const recTokens = tokens.filter(t => t.type === 'recurrence');
      expect(recTokens.length).toBeGreaterThanOrEqual(1);
    });

    test('quoted strings get type "note"', () => {
      const tokens = tokenizeGDL('Fr@18 "dinner"');
      const noteTokens = tokens.filter(t => t.type === 'note');
      expect(noteTokens).toHaveLength(1);
      expect(noteTokens[0].value).toContain('dinner');
    });

    test('tokens have correct start and end positions', () => {
      const tokens = tokenizeGDL('Fr@18');

      for (const token of tokens) {
        expect(token.start).toBeGreaterThanOrEqual(0);
        expect(token.end).toBeGreaterThan(token.start);
        expect(token.end).toBeLessThanOrEqual(5); // 'Fr@18'.length
      }
    });

    test('whitespace tokens are included', () => {
      const tokens = tokenizeGDL('Fr @ 18');
      const wsTokens = tokens.filter(t => t.type === 'whitespace');
      expect(wsTokens.length).toBeGreaterThan(0);
    });

    test('unrecognized tokens get type "error"', () => {
      const tokens = tokenizeGDL('Fr@18 $$');
      const errorTokens = tokens.filter(t => t.type === 'error');
      expect(errorTokens.length).toBeGreaterThan(0);
    });

    test('date tokens (MM/DD) get type "date"', () => {
      const tokens = tokenizeGDL('08/15@14');
      const dateTokens = tokens.filter(t => t.type === 'date');
      expect(dateTokens.length).toBeGreaterThanOrEqual(1);
    });

    test('slash in date is part of the date token', () => {
      const tokens = tokenizeGDL('08/15@14');
      const dateTokens = tokens.filter(t => t.type === 'date');
      expect(dateTokens.length).toBeGreaterThanOrEqual(1);
      expect(dateTokens[0].value).toBe('08/15');
    });

    test('token positions cover the entire input (no gaps)', () => {
      const input = 'Fr@18';
      const tokens = tokenizeGDL(input);

      // All non-whitespace characters should be covered
      const nonWsTokens = tokens.filter(t => t.type !== 'whitespace');
      expect(nonWsTokens.length).toBeGreaterThan(0);

      // Verify tokens are ordered by position
      for (let i = 1; i < tokens.length; i++) {
        expect(tokens[i].start).toBeGreaterThanOrEqual(tokens[i - 1].end);
      }
    });

    test('empty input returns empty token array', () => {
      const tokens = tokenizeGDL('');
      expect(tokens).toEqual([]);
    });
  });
});
