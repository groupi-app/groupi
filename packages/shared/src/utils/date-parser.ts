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

// Custom parser for bare "day before/after X" pattern
// Chrono requires "the"/"a"/"1" prefix for its relative parser — without one,
// it drops "day before/after" and only parses the anchor (e.g. "tomorrow", "next Monday")
customChrono.parsers.unshift({
  pattern: () => /\bday\s+(before|after)\s+(.+)/i,
  extract: (context, match) => {
    const direction = match[1].toLowerCase() === 'after' ? 1 : -1;
    const anchorText = match[2].trim();

    const anchorResults = chrono.casual.parse(anchorText, context.refDate, {
      forwardDate: true,
    });
    if (anchorResults.length === 0) return null;

    const anchor = anchorResults[0].start;
    const anchorDate = anchor.date();
    anchorDate.setDate(anchorDate.getDate() + direction);

    const result: Record<string, number> = {
      day: anchorDate.getDate(),
      month: anchorDate.getMonth() + 1,
      year: anchorDate.getFullYear(),
    };

    if (anchor.isCertain('hour')) result.hour = anchor.get('hour')!;
    if (anchor.isCertain('minute')) result.minute = anchor.get('minute')!;

    return result;
  },
});

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

    // Ambiguous bare hours (1-7) without am/pm default to AM in chrono,
    // but in an event planning context they almost always mean PM
    const hour = result.start.get('hour');
    if (
      hour !== null &&
      hour >= 1 &&
      hour <= 7 &&
      result.start.isCertain('hour') &&
      !result.start.isCertain('meridiem') &&
      !/\bam\b/i.test(text)
    ) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const startComp = result.start as any;
      startComp.assign('hour', hour + 12);
      startComp.assign('meridiem', 1);
    }

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
  } catch {
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
  } catch {
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

const WEEKDAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];
const WEEKDAY_ABBRS: Record<string, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  tues: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  thur: 'Thursday',
  thurs: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

function normalizeWeekday(s: string): string {
  const lower = s.toLowerCase().replace(/[.,;]$/, '');
  if (WEEKDAYS.includes(lower))
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  return WEEKDAY_ABBRS[lower] || s.replace(/[.,;]$/, '');
}

function isWeekday(s: string): boolean {
  const lower = s.toLowerCase().replace(/[.,;]$/, '');
  return WEEKDAYS.includes(lower) || lower in WEEKDAY_ABBRS;
}

const TIME_WORDS =
  /\b(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|noon|midnight)\b/i;

/**
 * Check if chrono's parse covered the input reliably.
 * Returns false if the input contains time info that chrono dropped.
 */
function isReliableParse(input: string, result: ParsedDateRange): boolean {
  const inputHasTime =
    /\d{1,2}\s*(?:am|pm|a|p)\b|(?:at|from)\s+\d/i.test(input) ||
    (/\b(?:at|from)\b/i.test(input) && TIME_WORDS.test(input));
  const parsedHasTime =
    result.start.getHours() !== 12 ||
    /noon|midnight/i.test(input) ||
    /\b12\b/.test(input);
  if (inputHasTime && !parsedHasTime) return false;

  const meaningful = input
    .replace(/\b(at|from|on|the|this|next|in|to)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (meaningful.length === 0) return true;
  const coverage = result.text.length / meaningful.length;
  return coverage > 0.5;
}

/**
 * Try to decompose a compound expression into simple expressions client-side.
 * Returns null if the input needs LLM decomposition.
 * Handles: conjunction splitting, "weekend", and "X through Y" day ranges.
 */
export function tryClientDecomposition(
  text: string,
  referenceDate?: Date
): ParsedDateRange[] | null {
  const trimmed = text.trim();

  // Split on conjunctions first so each part gets independent handling
  if (hasCompoundSignal(trimmed)) {
    const conjunctionResult = tryConjunctionSplit(trimmed, referenceDate);
    if (conjunctionResult) return conjunctionResult;
  }

  // Single date — parse directly
  const single = parseNaturalDate(trimmed, referenceDate);
  if (single && !hasCompoundSignal(trimmed)) {
    if (!isReliableParse(trimmed, single)) return null;
    return [single];
  }

  // "weekend" expansion
  const weekendMatch = trimmed.match(/^(?:this|next)?\s*weekend\s*(.*)/i);
  if (weekendMatch) {
    const timeQualifier = weekendMatch[1]?.trim() || '';
    const prefix = /^next\b/i.test(trimmed) ? 'next ' : '';
    const sat = parseNaturalDate(
      `${prefix}Saturday ${timeQualifier}`.trim(),
      referenceDate
    );
    const sun = parseNaturalDate(
      `${prefix}Sunday ${timeQualifier}`.trim(),
      referenceDate
    );
    const results = [sat, sun].filter((r): r is ParsedDateRange => r !== null);
    return results.length > 0 ? results : null;
  }

  // "X through/thru Y" day range
  const throughMatch = trimmed.match(
    /^(.*?)\b(\w+)\s+(?:through|thru)\s+(\w+)\s*(.*)/i
  );
  if (
    throughMatch &&
    isWeekday(throughMatch[2]) &&
    isWeekday(throughMatch[3])
  ) {
    const prefix = throughMatch[1].trim();
    const timeQualifier = throughMatch[4].trim();
    const startDay = WEEKDAYS.indexOf(
      normalizeWeekday(throughMatch[2]).toLowerCase()
    );
    const endDay = WEEKDAYS.indexOf(
      normalizeWeekday(throughMatch[3]).toLowerCase()
    );
    if (startDay >= 0 && endDay >= 0) {
      const days: string[] = [];
      let i = startDay;
      while (true) {
        days.push(WEEKDAYS[i].charAt(0).toUpperCase() + WEEKDAYS[i].slice(1));
        if (i === endDay) break;
        i = (i + 1) % 7;
        if (days.length > 7) break;
      }
      const results = days
        .map(day =>
          parseNaturalDate(
            `${day} ${prefix} ${timeQualifier}`.trim(),
            referenceDate
          )
        )
        .filter((r): r is ParsedDateRange => r !== null);
      return results.length > 0 ? results : null;
    }
  }

  // Conjunction splitting: "X and Y [time]", "X or Y [time]", "X, Y, and Z [time]"
  const conjunctionResult = tryConjunctionSplit(trimmed, referenceDate);
  if (conjunctionResult) return conjunctionResult;

  return null;
}

function resolvePart(
  text: string,
  referenceDate?: Date
): ParsedDateRange[] | null {
  // Weekend expansion
  const weekendMatch = text.match(/^(?:this|next)?\s*weekend\s*(.*)/i);
  if (weekendMatch) {
    const timeQualifier = weekendMatch[1]?.trim() || '';
    const prefix = /^next\b/i.test(text) ? 'next ' : '';
    const sat = parseNaturalDate(
      `${prefix}Saturday ${timeQualifier}`.trim(),
      referenceDate
    );
    const sun = parseNaturalDate(
      `${prefix}Sunday ${timeQualifier}`.trim(),
      referenceDate
    );
    const results = [sat, sun].filter((r): r is ParsedDateRange => r !== null);
    return results.length > 0 ? results : null;
  }

  // Single date
  const single = parseNaturalDate(text, referenceDate);
  if (single && isReliableParse(text, single)) return [single];

  return null;
}

function tryConjunctionSplit(
  text: string,
  referenceDate?: Date
): ParsedDateRange[] | null {
  // Expand word/word slashes into " or " before splitting (but not digit/digit date formats)
  const normalized = text.replace(/([a-z])\/([a-z])/gi, '$1 or $2');

  const parts = normalized
    .split(/\s*(?:,\s*(?:and|or)\s+|,\s+|\s+(?:and|or)\s+)/i)
    .map(s => s.trim())
    .filter(Boolean);

  if (parts.length < 2) return null;

  // Expand bare number parts: "next weekend at 7 or 8" → ["next weekend at 7", "next weekend at 8"]
  let expanded = parts;
  const hasBareNumberParts = parts.some(
    (p, i) => i > 0 && /^\d{1,2}(?::\d{2})?(?:\s*(?:am|pm))?$/i.test(p.trim())
  );
  if (hasBareNumberParts) {
    expanded = [];
    let currentDateBase: string | null = null;

    for (const part of parts) {
      const isBareNumber = /^\d{1,2}(?::\d{2})?(?:\s*(?:am|pm))?$/i.test(
        part.trim()
      );
      if (isBareNumber && currentDateBase) {
        expanded.push(`${currentDateBase} at ${part.trim()}`);
      } else {
        expanded.push(part);
        const dateMatch = part.match(
          /^(.+?)\s+(?:at\s+)?\d{1,2}(?::\d{2})?\s*(?:am|pm)?/i
        );
        if (dateMatch) currentDateBase = dateMatch[1].trim();
      }
    }
  }

  // If any part needs multi-date expansion (weekend, through), resolve each part independently
  const needsExpansion = expanded.some(p =>
    /\bweekend\b|\b(?:through|thru)\b/i.test(p)
  );
  if (needsExpansion) {
    const resolved = expanded.flatMap(p => resolvePart(p, referenceDate) ?? []);
    if (resolved.length >= 2) return resolved;
    return null;
  }

  // For simple parts without expansion, try direct parsing
  if (hasBareNumberParts) {
    const results = expanded
      .map(expr => parseNaturalDate(expr, referenceDate))
      .filter((r): r is ParsedDateRange => r !== null);
    if (
      results.length >= 2 &&
      results.every((r, i) => isReliableParse(expanded[i], r))
    )
      return results;
  }

  // The last part likely has the time qualifier attached
  // Try parsing each part individually — if all but the last fail, the last has the shared time
  const lastParsed = parseNaturalDate(parts[parts.length - 1], referenceDate);
  if (!lastParsed) return null;

  // Check if earlier parts parse on their own (they might be bare weekdays)
  const allParsed = parts.map(p => parseNaturalDate(p, referenceDate));
  const allValid = allParsed.every(r => r !== null);

  if (allValid) {
    // Check if the last part has time info that earlier parts lack
    const lastHasTime =
      lastParsed.end !== undefined ||
      /\d{1,2}\s*(?:am|pm|:\d{2})/i.test(parts[parts.length - 1]) ||
      /\bat\s+\d/i.test(parts[parts.length - 1]);

    if (lastHasTime) {
      // Extract time qualifier from the last part and distribute
      const timeMatch = parts[parts.length - 1].match(
        /(\d{1,2}(?::\d{2})?\s*(?:am|pm)?\s*(?:to|-)\s*\d{1,2}(?::\d{2})?\s*(?:am|pm)?|\bat\s+\S+(?:\s*(?:am|pm))?|\d{1,2}\s*(?:am|pm))/i
      );
      if (timeMatch) {
        const timeStr = timeMatch[0];
        const results = parts.map((part, i) => {
          if (i === parts.length - 1) return lastParsed;
          const hasOwnTime =
            /\d{1,2}\s*(?:am|pm|:\d{2})/i.test(part) || /\bat\s+\d/i.test(part);
          if (hasOwnTime) return allParsed[i];
          const combined = `${part} ${timeStr}`;
          const parsed = parseNaturalDate(combined, referenceDate);
          if (parsed && !isReliableParse(combined, parsed)) return null;
          return parsed;
        });
        const valid = results.filter((r): r is ParsedDateRange => r !== null);
        return valid.length >= 2 ? valid : null;
      }
    }

    // Verify all individual parses are reliable
    if (allParsed.some((r, i) => r && !isReliableParse(parts[i], r)))
      return null;

    return allParsed as ParsedDateRange[];
  }

  // Final attempt: resolve each part independently (handles weekend, through, etc.)
  const resolved = parts.flatMap(p => resolvePart(p, referenceDate) ?? []);
  if (resolved.length >= 2) return resolved;

  return null;
}

function hasCompoundSignal(text: string): boolean {
  return /\b(and|or)\b|,\s*\w|;|\b(through|thru)\b|\b(weekend|weekdays|weeknights)\b|\bnext\s+\d+\b|\bthe\s+next\s+\d+\b|\bevery\b|\b\d{1,2}\s*-\s*\d{1,2}\s+at\b|[a-z]\/[a-z]/i.test(
    text
  );
}

/**
 * Determine whether an input needs LLM decomposition or can be parsed client-side.
 * Returns false for simple single-date expressions that chrono can handle directly.
 */
export function needsLLMDecomposition(text: string): boolean {
  return tryClientDecomposition(text) === null;
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
