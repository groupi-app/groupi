'use client';

import { AttendeeSlate } from '../../components/attendee-slate';
import { Doc, Id } from '@/convex/_generated/dataModel';
import { User } from '@/convex/types';
import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useEventMembers } from '@/hooks/convex';
import { AttendeeListSkeleton } from '@/components/skeletons';

interface AttendeesProps {
  eventId: string;
}

// Role hierarchy: ORGANIZER > MODERATOR > ATTENDEE
const roleOrder: Record<string, number> = {
  ORGANIZER: 3,
  MODERATOR: 2,
  ATTENDEE: 1,
};

type MemberWithDetails = Doc<'memberships'> & {
  person:
    | (Doc<'persons'> & {
        user: User;
      })
    | null;
  availabilities: Array<
    Doc<'availabilities'> & {
      potentialDateTime: Doc<'potentialDateTimes'> | null;
    }
  >;
};

/**
 * Client component with direct Convex hooks - Client-only pattern
 * - Uses useEventMembers hook for real-time attendee data
 * - Real-time updates via Convex subscriptions
 * - Loading states managed by component
 */
export function Attendees({ eventId }: AttendeesProps) {
  // All hooks must be called unconditionally at the top
  const [searchQuery, setSearchQuery] = useState('');

  // Use direct Convex hook for real-time member data
  const eventAttendeesData = useEventMembers(eventId as Id<'events'>);

  // Extract data from query result (may be undefined during loading)
  const userId = eventAttendeesData?.userId;
  const userRole = eventAttendeesData?.userMembership.role;
  const eventDateTime = eventAttendeesData?.event.chosenDateTime;

  // Filter and sort members - useMemo called unconditionally
  // Note: members initialization moved inside useMemo to satisfy exhaustive-deps
  const filteredAndSortedMembers = useMemo(() => {
    const members = eventAttendeesData?.event.memberships ?? [];
    // Filter by search query
    const filtered = members.filter((member: MemberWithDetails) => {
      const name = member.person?.user?.name || '';
      const email = member.person?.user?.email || '';
      const searchLower = searchQuery.toLowerCase();
      return (
        name.toLowerCase().includes(searchLower) ||
        email.toLowerCase().includes(searchLower)
      );
    });

    // Sort: first by role (higher roles first), then alphabetically by name/email
    return filtered.sort((a: MemberWithDetails, b: MemberWithDetails) => {
      // First, sort by role (higher roles first)
      const roleDiff = roleOrder[b.role] - roleOrder[a.role];
      if (roleDiff !== 0) {
        return roleDiff;
      }

      // Then sort alphabetically by name or email
      const nameA = a.person?.user?.name || a.person?.user?.email || '';
      const nameB = b.person?.user?.name || b.person?.user?.email || '';
      return nameA.localeCompare(nameB);
    });
  }, [eventAttendeesData?.event.memberships, searchQuery]);

  // Handle loading state after all hooks are called
  if (!eventAttendeesData) {
    return <AttendeeListSkeleton />;
  }

  // Convex provides real-time updates automatically - no manual sync needed

  return (
    <div className='flex flex-col gap-4'>
      <div className='relative'>
        <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4' />
        <Input
          type='text'
          placeholder='Search attendees...'
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className='pl-10'
        />
      </div>
      <div className='flex flex-col gap-2 divide-y'>
        {filteredAndSortedMembers.map(
          (member: (typeof filteredAndSortedMembers)[0]) => (
            <AttendeeSlate
              key={member._id}
              userId={userId || ''}
              userRole={userRole}
              member={member}
              itemKey={member._id}
              eventDateTime={eventDateTime ? new Date(eventDateTime) : null}
            />
          )
        )}
      </div>
    </div>
  );
}
