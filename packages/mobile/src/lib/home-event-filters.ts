import { isEventPast } from '@groupi/shared/utils';

import type { EventScope, EventTab } from '@/stores';

interface FilterableHomeEvent {
  event: {
    chosenDateTime?: number | null;
    chosenEndDateTime?: number | null;
  };
  membership: {
    role: string;
  };
}

export function filterHomeEvents<T extends FilterableHomeEvent>(
  events: T[],
  activeTab: EventTab,
  eventScope: EventScope
): T[] {
  return events.filter(item => {
    const isPast = isEventPast(
      item.event.chosenDateTime,
      item.event.chosenEndDateTime
    );
    const matchesTime = activeTab === 'upcoming' ? !isPast : isPast;
    const matchesScope =
      eventScope === 'all' || item.membership.role === 'ORGANIZER';

    return matchesTime && matchesScope;
  });
}

export function countHomeEvents(events: FilterableHomeEvent[]) {
  let upcoming = 0;
  let attended = 0;

  for (const item of events) {
    const isPast = isEventPast(
      item.event.chosenDateTime,
      item.event.chosenEndDateTime
    );
    if (isPast) attended += 1;
    else upcoming += 1;
  }

  return { upcoming, attended };
}
