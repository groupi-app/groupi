/** UTC fields encode civil calendar values internally; only this module resolves instants. */
export class CivilTimeZone {
  private formatter: Intl.DateTimeFormat;

  constructor(private timeZone: string) {
    this.formatter = new Intl.DateTimeFormat('en-US-u-ca-gregory-nu-latn', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    });
  }

  toCivil(instant: Date): Date {
    const parts = this.formatter.formatToParts(instant);
    const value = (name: string) =>
      Number(parts.find(part => part.type === name)?.value);
    return new Date(
      Date.UTC(
        value('year'),
        value('month') - 1,
        value('day'),
        value('hour'),
        value('minute'),
        value('second')
      )
    );
  }

  toInstant(civil: Date): Date {
    const target = civil.getTime();
    // Offsets on both sides of a transition include folds, half-hour changes,
    // and whole-day skips. Test candidates by exact calendar-field round trip.
    const offsets = new Set<number>();
    for (let hours = -48; hours <= 48; hours += 6) {
      const instant = new Date(target + hours * 3_600_000);
      offsets.add(this.toCivil(instant).getTime() - instant.getTime());
    }
    const candidates = [...offsets]
      .map(offset => new Date(target - offset))
      .filter(instant => this.toCivil(instant).getTime() === target);
    if (candidates.length !== 1) {
      const occurrence = civil.toISOString().slice(0, 16).replace('T', ' ');
      throw new Error(
        `${candidates.length ? 'Ambiguous' : 'Nonexistent'} local time ${occurrence} in ${this.timeZone}`
      );
    }
    return candidates[0];
  }
}
