import { isEventPast } from '@groupi/shared/utils';

import type { EventScope, EventTab } from '@/stores';

interface FilterableHomeEvent {
  event: {
    chosenDateTime?: number | null;
    chosenEndDateTime?: number | null;
    timezone?: string;
    completedAt?: number | null;
    potentialDateTimes?: number[];
  };
  membership: {
    role: string;
  };
}

export function filterHomeEvents<T extends FilterableHomeEvent>(
  events: T[],
  activeTab: EventTab,
  eventScope: EventScope,
  now = Date.now()
): T[] {
  return events.filter(item => {
    const isPast = isEventPast(
      item.event.chosenDateTime,
      item.event.chosenEndDateTime,
      { ...item.event, now }
    );
    const matchesTime = activeTab === 'upcoming' ? !isPast : isPast;
    const matchesScope =
      eventScope === 'all' || item.membership.role === 'ORGANIZER';

    return matchesTime && matchesScope;
  });
}

export function countHomeEvents(
  events: FilterableHomeEvent[],
  now = Date.now()
) {
  let upcoming = 0;
  let attended = 0;

  for (const item of events) {
    const isPast = isEventPast(
      item.event.chosenDateTime,
      item.event.chosenEndDateTime,
      { ...item.event, now }
    );
    if (isPast) attended += 1;
    else upcoming += 1;
  }

  return { upcoming, attended };
}
