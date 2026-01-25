import * as chrono from 'chrono-node';

export interface ParsedDateRange {
  start: Date;
  end?: Date;
  text: string;
}

/**
 * Custom chrono parser with extended capabilities
 *
 * Chrono can be extended with:
 * - Custom parsers: Add new patterns to recognize
 * - Custom refiners: Post-process parsed results
 *
 * @see https://github.com/wanasit/chrono#custom-parsers
 */
const customChrono = chrono.casual.clone();

// Custom parser for "[weekday] in X weeks" pattern
// Chrono doesn't handle this natively - it ignores the weekday
customChrono.parsers.push({
  pattern: () =>
    /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+in\s+(\d+)\s+weeks?\b/i,
  extract: (context, match) => {
    const weekdayStr = match[1].toLowerCase();
    const weeksAhead = parseInt(match[2]);

    const weekdays: Record<string, number> = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };

    const targetWeekday = weekdays[weekdayStr];
    const refDate = context.refDate;
    const currentWeekday = refDate.getDay();

    // Calculate days until the target weekday this week
    let daysUntilTarget = targetWeekday - currentWeekday;
    if (daysUntilTarget <= 0) {
      daysUntilTarget += 7; // Move to next week if target is today or earlier
    }

    // Add the weeks offset
    const totalDays = daysUntilTarget + (weeksAhead - 1) * 7;

    const targetDate = new Date(refDate);
    targetDate.setDate(refDate.getDate() + totalDays);

    return {
      day: targetDate.getDate(),
      month: targetDate.getMonth() + 1,
      year: targetDate.getFullYear(),
    };
  },
});

/**
 * Parse multiple date expressions into date ranges using chrono-node
 */
export function parseDateExpressions(
  expressions: string[],
  referenceDate?: Date
): ParsedDateRange[] {
  const results: ParsedDateRange[] = [];
  const ref = referenceDate || new Date();

  for (const expression of expressions) {
    const parsed = parseNaturalDate(expression, ref);
    if (parsed) {
      results.push(parsed);
    }
  }

  return results;
}

/**
 * Parse a single natural language date expression
 */
export function parseNaturalDate(
  text: string,
  referenceDate?: Date
): ParsedDateRange | null {
  const ref = referenceDate || new Date();

  try {
    const results = customChrono.parse(text, ref, { forwardDate: true });

    if (results.length === 0) {
      return null;
    }

    const result = results[0];
    const start = result.start.date();

    // Check if there's an end component
    let end: Date | undefined;
    const chronoEnd = result.end?.date();

    // If chrono returned an end date, validate it makes sense
    // If end is more than 24 hours after start, chrono likely misinterpreted a time range
    const hasValidChronoEnd =
      chronoEnd && chronoEnd.getTime() - start.getTime() <= 24 * 60 * 60 * 1000;

    if (hasValidChronoEnd) {
      end = chronoEnd;
    } else {
      // Try to detect time range patterns like "6pm to 8pm" or "6-8pm"
      const timeRangeMatch = text.match(
        /(\d{1,2})(?::(\d{2}))?\s*(?:am|pm)?\s*(?:to|-)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i
      );

      if (timeRangeMatch) {
        const endHour = parseInt(timeRangeMatch[3]);
        const endMinutes = parseInt(timeRangeMatch[4] || '0');
        const meridiem = timeRangeMatch[5]?.toLowerCase();

        end = new Date(start);
        let adjustedHour = endHour;

        // Handle PM
        if (meridiem === 'pm' && endHour < 12) {
          adjustedHour = endHour + 12;
        } else if (meridiem === 'am' && endHour === 12) {
          adjustedHour = 0;
        }

        end.setHours(adjustedHour, endMinutes, 0, 0);

        // If end is before start on the same day, it might span midnight
        if (end <= start) {
          end.setDate(end.getDate() + 1);
        }
      }
    }

    return {
      start,
      end,
      text: result.text,
    };
  } catch (error) {
    console.error('Error parsing date:', text, error);
    return null;
  }
}

/**
 * Parse a raw natural language string that may contain multiple dates
 * Returns preliminary parsed results for preview
 */
export function parseRawDateInput(
  text: string,
  referenceDate?: Date
): ParsedDateRange[] {
  const ref = referenceDate || new Date();

  try {
    const results = customChrono.parse(text, ref, { forwardDate: true });

    return results.map(result => ({
      start: result.start.date(),
      end: result.end?.date(),
      text: result.text,
    }));
  } catch (error) {
    console.error('Error parsing raw date input:', error);
    return [];
  }
}

/**
 * Validate parsed dates
 * Returns validation errors for each date
 */
export function validateParsedDates(
  dates: ParsedDateRange[]
): { isValid: boolean; errors: string[] }[] {
  return dates.map(date => {
    const errors: string[] = [];

    // Check if end is before start
    if (date.end && date.end <= date.start) {
      errors.push('End time must be after start time');
    }

    // Check if date is in the past (only for start time)
    const now = new Date();
    if (date.start < now) {
      errors.push('Date is in the past');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  });
}

/**
 * Format a parsed date range for display
 */
export function formatParsedDateRange(date: ParsedDateRange): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  };

  const startStr = date.start.toLocaleString(undefined, options);

  if (!date.end) {
    return startStr;
  }

  // Check if same day
  const sameDay =
    date.start.getFullYear() === date.end.getFullYear() &&
    date.start.getMonth() === date.end.getMonth() &&
    date.start.getDate() === date.end.getDate();

  if (sameDay) {
    const endTimeStr = date.end.toLocaleString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });
    return `${startStr} - ${endTimeStr}`;
  }

  const endStr = date.end.toLocaleString(undefined, options);
  return `${startStr} - ${endStr}`;
}
