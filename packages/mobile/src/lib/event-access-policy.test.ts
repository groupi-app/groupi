import { describe, expect, it } from 'vitest';

import {
  canRoleViewAttendeeList,
  getRequiredEventRedirect,
  isEventGateExemptPath,
} from './event-access-policy';

describe('event access policy', () => {
  it('prioritizes required availability before questionnaire completion', () => {
    expect(
      getRequiredEventRedirect('event-1', {
        isOrganizer: false,
        availability: { required: true, completed: false },
        addons: [{ addonType: 'questionnaire', completed: false }],
      })
    ).toBe('/event/event-1/availability');
  });

  it('gates incomplete questionnaires but exempts organizers', () => {
    const incompleteQuestionnaire = {
      availability: { required: false, completed: false },
      addons: [{ addonType: 'questionnaire', completed: false }],
    };

    expect(
      getRequiredEventRedirect('event-1', {
        ...incompleteQuestionnaire,
        isOrganizer: false,
      })
    ).toBe('/event/event-1/addons/questionnaire');
    expect(
      getRequiredEventRedirect('event-1', {
        ...incompleteQuestionnaire,
        isOrganizer: true,
      })
    ).toBeNull();
  });

  it('exempts only mandatory completion routes', () => {
    const exemptPaths = [
      '/event/event-1/availability',
      '/event/event-1/addons/questionnaire',
    ];

    for (const pathname of exemptPaths) {
      expect(isEventGateExemptPath(pathname, 'event-1')).toBe(true);
    }

    expect(isEventGateExemptPath('/event/event-1', 'event-1')).toBe(false);
    expect(isEventGateExemptPath('/event/event-1/attendees', 'event-1')).toBe(
      false
    );
    expect(isEventGateExemptPath('/event/event-1/invite', 'event-1')).toBe(
      false
    );
    expect(isEventGateExemptPath('/event/event-1/edit', 'event-1')).toBe(false);
    expect(
      isEventGateExemptPath('/event/event-1/addons/manage', 'event-1')
    ).toBe(false);
    expect(
      isEventGateExemptPath('/event/event-1/addons/bring-list', 'event-1')
    ).toBe(false);
    expect(
      isEventGateExemptPath('/event/event-1/addons/reminders', 'event-1')
    ).toBe(false);
    expect(isEventGateExemptPath('/event/event-1/post/post-1', 'event-1')).toBe(
      false
    );
    expect(isEventGateExemptPath('/event/event-2/edit', 'event-1')).toBe(false);
  });

  it('matches attendee-list permission thresholds', () => {
    expect(canRoleViewAttendeeList('ATTENDEE', 'EVERYONE')).toBe(true);
    expect(canRoleViewAttendeeList('ATTENDEE', 'MODERATOR')).toBe(false);
    expect(canRoleViewAttendeeList('MODERATOR', 'MODERATOR')).toBe(true);
    expect(canRoleViewAttendeeList('MODERATOR', 'ORGANIZER')).toBe(false);
    expect(canRoleViewAttendeeList('ORGANIZER', 'ORGANIZER')).toBe(true);
    expect(canRoleViewAttendeeList(undefined, 'EVERYONE')).toBe(false);
  });
});
