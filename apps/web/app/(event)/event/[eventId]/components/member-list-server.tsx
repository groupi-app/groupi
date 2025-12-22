import { getCachedEventAttendeesData } from '@groupi/services/server';
import { MemberListClient } from './member-list-client';
import type { RoleType } from '@groupi/schema';
import { componentLogger } from '@/lib/logger';

/**
 * Server component that fetches cached member list data
 * Uses "use cache: private" at component level for PPR optimization
 * On cache hit, component renders instantly without suspending
 */
export async function MemberListServer({ eventId }: { eventId: string }) {
  'use cache: private';

  try {
    componentLogger.debug({ eventId }, 'Fetching member list');

    const [error, memberListData] = await getCachedEventAttendeesData(eventId);

    if (error) {
      componentLogger.error(
        { eventId, errorTag: error._tag, error },
        'Error fetching member list'
      );
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

    if (!memberListData) {
      componentLogger.error({ eventId }, 'No member list data returned');
      return <div>Failed to load members</div>;
    }

    const { event, userMembership, userId } = memberListData;
    const members = event.memberships || [];
    const eventDateTime = event.chosenDateTime;
    const userRole = userMembership.role as RoleType;

    componentLogger.debug(
      { eventId, memberCount: members.length },
      'Rendering MemberListClient'
    );
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
  } catch (error) {
    componentLogger.error({ eventId, error }, 'Caught error');
    return <div>An error occurred while loading members</div>;
  }
}
