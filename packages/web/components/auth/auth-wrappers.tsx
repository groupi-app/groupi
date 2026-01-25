import {
  Authenticated,
  Unauthenticated,
  AuthLoading,
  useQuery,
} from 'convex/react';
import { ReactNode } from 'react';
import { isAdminRole } from '@/lib/constants';

// Dynamic require to avoid deep type instantiation
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let authQueries: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let eventQueries: any;
function initApi() {
  if (!authQueries) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { api } = require('@/convex/_generated/api');
    authQueries = api.auth?.queries ?? {};
    eventQueries = api.events?.queries ?? {};
  }
}
initApi();

/**
 * Authentication wrapper components using Convex built-in auth components
 *
 * These provide clean conditional rendering based on authentication state
 * without manual auth checks.
 */

export { Authenticated, Unauthenticated, AuthLoading };

/**
 * Admin-only wrapper component
 * Shows content only to authenticated users with ADMIN role
 */
export function AdminOnly({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <Authenticated>
      <AdminContent fallback={fallback}>{children}</AdminContent>
    </Authenticated>
  );
}

function AdminContent({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const currentUser = useQuery(authQueries.getCurrentUser, {});

  if (currentUser === undefined) {
    // Loading state - if fallback is explicitly null, show nothing
    if (fallback === null) {
      return null;
    }
    return (
      <div className='flex items-center justify-center p-4'>
        <div className='animate-spin h-4 w-4 border-2 border-gray-300 border-t-gray-900 rounded-full'></div>
        <span className='ml-2'>Checking permissions...</span>
      </div>
    );
  }

  if (!isAdminRole(currentUser?.role)) {
    // Respect explicit null fallback
    if (fallback === null) {
      return null;
    }
    return fallback !== undefined ? (
      <>{fallback}</>
    ) : (
      <div className='text-center p-8'>
        <p className='text-muted-foreground'>Admin access required</p>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Event member wrapper component
 * Shows content only to authenticated users who are members of the specified event
 */
export function EventMemberOnly({
  eventId,
  children,
  fallback,
  roles = ['ORGANIZER', 'MODERATOR', 'ATTENDEE'],
}: {
  eventId: string;
  children: ReactNode;
  fallback?: ReactNode;
  roles?: Array<'ORGANIZER' | 'MODERATOR' | 'ATTENDEE'>;
}) {
  return (
    <Authenticated>
      <EventMemberContent eventId={eventId} fallback={fallback} roles={roles}>
        {children}
      </EventMemberContent>
    </Authenticated>
  );
}

function EventMemberContent({
  eventId,
  children,
  fallback,
  roles,
}: {
  eventId: string;
  children: ReactNode;
  fallback?: ReactNode;
  roles: Array<'ORGANIZER' | 'MODERATOR' | 'ATTENDEE'>;
}) {
  const eventData = useQuery(eventQueries.getEventHeader, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ID type conversion for Convex query
    eventId: eventId as any,
  });

  if (eventData === undefined) {
    // Loading state
    return (
      <div className='flex items-center justify-center p-4'>
        <div className='animate-spin h-4 w-4 border-2 border-gray-300 border-t-gray-900 rounded-full'></div>
        <span className='ml-2'>Loading event...</span>
      </div>
    );
  }

  const userRole = eventData?.userMembership?.role;
  const isMember = userRole && roles.includes(userRole);

  if (!isMember) {
    return (
      fallback || (
        <div className='text-center p-8'>
          <p className='text-muted-foreground'>Event membership required</p>
        </div>
      )
    );
  }

  return <>{children}</>;
}

/**
 * Event organizer/moderator wrapper component
 * Shows content only to event organizers and moderators
 */
export function EventOrganizerOnly({
  eventId,
  children,
  fallback,
}: {
  eventId: string;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <EventMemberOnly
      eventId={eventId}
      roles={['ORGANIZER', 'MODERATOR']}
      fallback={fallback}
    >
      {children}
    </EventMemberOnly>
  );
}
