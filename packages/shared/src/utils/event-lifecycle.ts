/** Stable lifecycle classification. Invalid historical timezones use UTC, never the viewer zone. */
export interface EventLifecycleInput {
  chosenDateTime?: number | null;
  chosenEndDateTime?: number | null;
  completedAt?: number | null;
  timezone?: string | null;
  potentialDateTimes?: readonly (number | { dateTime: number })[];
}

function calendarDay(instant: number, timezone?: string | null) {
  let formatter: Intl.DateTimeFormat;
  try {
    formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone || 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }
  const parts = formatter.formatToParts(instant);
  return ['year', 'month', 'day']
    .map(type => parts.find(part => part.type === type)?.value)
    .join('-');
}

/** Completion alone controls current-event selection and exclusion cleanup. Poll expiry does not. */
export function isScheduledEventComplete(
  event: EventLifecycleInput,
  now: number
): boolean {
  // Keep historical explicit completion authoritative without rewriting old records.
  if (event.completedAt != null) return true;
  if (
    event.chosenEndDateTime != null &&
    Number.isFinite(event.chosenEndDateTime)
  )
    return event.chosenEndDateTime <= now;
  if (event.chosenDateTime == null || !Number.isFinite(event.chosenDateTime))
    return false;
  // Calendar comparison handles 23/25-hour DST days and midnight without adding 24 hours.
  return (
    calendarDay(now, event.timezone) >
    calendarDay(event.chosenDateTime, event.timezone)
  );
}

export function isDateOptionPassed(
  option: { dateTime: number },
  now: number
): boolean {
  return Number.isFinite(option.dateTime) && option.dateTime <= now;
}

export function classifyEventLifecycle(
  event: EventLifecycleInput,
  now: number
) {
  if (isScheduledEventComplete(event, now)) return 'COMPLETED' as const;
  if (event.chosenDateTime != null) return 'UPCOMING' as const;
  const options = event.potentialDateTimes ?? [];
  if (!options.length) return 'UNDATED' as const;
  return options.every(option =>
    isDateOptionPassed(
      typeof option === 'number' ? { dateTime: option } : option,
      now
    )
  )
    ? ('NEEDS_NEW_DATES' as const)
    : ('UPCOMING' as const);
}
