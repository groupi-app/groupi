import { getCachedEventAttendeesData } from '@groupi/services';
import { MemberListClient } from './member-list-client';
import type { RoleType } from '@groupi/schema';

/**
 * Server component that fetches cached member list data
 * Uses "use cache" with 2 min TTL from the service layer
 */
export async function MemberListServer({ eventId }: { eventId: string }) {
  const [error, memberListData] = await getCachedEventAttendeesData(eventId);

  if (error) {
    switch (error._tag) {
      case 'NotFoundError':
        return <div>Event not found</div>;
      case 'AuthenticationError':
        return <div>User not found</div>;
      case 'UnauthorizedError':
        return <div>You are not a member of this event</div>;
      default:
        return <div>Error loading members</div>;
    }
  }

  const { event, userMembership, userId } = memberListData;
  const members = event.memberships;
  const eventDateTime = event.chosenDateTime;
  const userRole = userMembership.role as RoleType;

  // Pass static data to client component
  return (
    <MemberListClient
      eventId={eventId}
      members={members}
      userId={userId}
      userRole={userRole}
      eventDateTime={eventDateTime}
    />
  );
}
