import { describe, expect, it } from 'vitest';

import { countHomeEvents, filterHomeEvents } from './home-event-filters';

const now = Date.now();
const events = [
  {
    id: 'upcoming-organized',
    event: { chosenDateTime: now + 86_400_000 },
    membership: { role: 'ORGANIZER' },
  },
  {
    id: 'upcoming-attending',
    event: { chosenDateTime: now + 172_800_000 },
    membership: { role: 'ATTENDEE' },
  },
  {
    id: 'past-organized',
    event: { chosenDateTime: now - 172_800_000 },
    membership: { role: 'ORGANIZER' },
  },
  {
    id: 'past-attended',
    event: { chosenDateTime: now - 259_200_000 },
    membership: { role: 'ATTENDEE' },
  },
];

describe('home event filters', () => {
  it('separates upcoming and attended events', () => {
    expect(
      filterHomeEvents(events, 'upcoming', 'all').map(item => item.id)
    ).toEqual(['upcoming-organized', 'upcoming-attending']);
    expect(
      filterHomeEvents(events, 'attended', 'all').map(item => item.id)
    ).toEqual(['past-organized', 'past-attended']);
  });

  it('limits either time tab to events the user organized', () => {
    expect(
      filterHomeEvents(events, 'upcoming', 'mine').map(item => item.id)
    ).toEqual(['upcoming-organized']);
    expect(
      filterHomeEvents(events, 'attended', 'mine').map(item => item.id)
    ).toEqual(['past-organized']);
  });

  it('counts both time groups independently of the ownership toggle', () => {
    expect(countHomeEvents(events)).toEqual({ upcoming: 2, attended: 2 });
  });
});
