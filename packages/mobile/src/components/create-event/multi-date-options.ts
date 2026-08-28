import type { DateOption } from '@/context/create-event-context';

interface ParsedDateOption {
  start: Date;
  end?: Date;
}

export function mergeSmartDateOptions(
  existing: DateOption[],
  dates: ParsedDateOption[],
  createId: () => string
): { options: DateOption[]; addedCount: number } {
  const dateKeys = new Set(
    existing.map(
      option => `${option.date.getTime()}:${option.endDate?.getTime() ?? ''}`
    )
  );
  const added: DateOption[] = [];

  for (const date of dates) {
    const key = `${date.start.getTime()}:${date.end?.getTime() ?? ''}`;
    if (dateKeys.has(key)) continue;
    dateKeys.add(key);
    added.push({
      id: createId(),
      date: date.start,
      endDate: date.end,
    });
  }

  return {
    options: [...existing, ...added].sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    ),
    addedCount: added.length,
  };
}
