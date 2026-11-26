function inviteDateFormatters(timeZone: string) {
  return {
    date: new Intl.DateTimeFormat('en-US', {
      timeZone,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    time: new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    }),
  };
}

/** Format an invite preview in the organizer's saved event timezone. */
export function formatInviteOgDate(
  start: number,
  end: number | null,
  timezone?: string
): string {
  let formatters;
  try {
    formatters = inviteDateFormatters(timezone ?? 'UTC');
  } catch (error) {
    if (!(error instanceof RangeError)) throw error;
    formatters = inviteDateFormatters('UTC');
  }

  const { date, time } = formatters;
  const startDate = date.format(start);
  const startText = `${startDate}, ${time.format(start)}`;
  if (end === null) return startText;

  const endDate = date.format(end);
  const endTime = time.format(end);
  const endText = startDate === endDate ? endTime : `${endDate}, ${endTime}`;
  return `${startText} - ${endText}`;
}
