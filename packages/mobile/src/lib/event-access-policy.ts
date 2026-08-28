interface AddonCompletion {
  addonType: string;
  completed: boolean;
}

interface EventCompletionStatus {
  isOrganizer: boolean;
  availability: {
    required: boolean;
    completed: boolean;
  };
  addons: AddonCompletion[];
}

type EventRole = 'ATTENDEE' | 'MODERATOR' | 'ORGANIZER';
type AttendeeListPermission = 'EVERYONE' | 'MODERATOR' | 'ORGANIZER';

function getEventRouteSuffix(pathname: string, eventId: string): string | null {
  const eventRoot = `/event/${eventId}`;
  if (pathname === eventRoot) return '';
  if (!pathname.startsWith(`${eventRoot}/`)) return null;
  return pathname.slice(eventRoot.length);
}

/**
 * Only mandatory completion forms remain reachable while the event content
 * gate is active. Organizers are exempt through completion status, so their
 * management routes do not need a pathname exemption.
 */
export function isEventGateExemptPath(
  pathname: string,
  eventId: string
): boolean {
  const suffix = getEventRouteSuffix(pathname, eventId);
  if (suffix === null) return false;

  return suffix === '/availability' || suffix === '/addons/questionnaire';
}

export function getRequiredEventRedirect(
  eventId: string,
  status: EventCompletionStatus | null | undefined
): string | null {
  if (!status || status.isOrganizer) return null;

  if (status.availability.required && !status.availability.completed) {
    return `/event/${eventId}/availability`;
  }

  const questionnaire = status.addons.find(
    addon => addon.addonType === 'questionnaire' && !addon.completed
  );

  return questionnaire ? `/event/${eventId}/addons/questionnaire` : null;
}

/** Mirrors the backend viewAttendeeList role hierarchy. */
export function canRoleViewAttendeeList(
  role: EventRole | undefined,
  requiredPermission: AttendeeListPermission | undefined
): boolean {
  return hasPermission(role, requiredPermission ?? 'EVERYONE');
}
import { hasPermission } from '@groupi/shared/utils';
