'use client';

import { AttendeeSlate } from '../../components/attendee-slate';
import { Doc } from '@/convex/_generated/dataModel';
import { User } from '@/convex/types';
import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useEventAttendeesData } from '@/hooks/convex';

// Type for the data prop (inferred from useEventAttendeesData return type)
type AttendeesDataType = NonNullable<ReturnType<typeof useEventAttendeesData>>;

interface AttendeesProps {
  data: AttendeesDataType;
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
 * Attendees list component - receives data from context
 * - Data is pre-loaded by EventDataProvider in layout
 * - Real-time updates still work via Convex subscriptions in provider
 * - No loading state needed - data is guaranteed
 */
export function Attendees({ data }: AttendeesProps) {
  // All hooks must be called unconditionally at the top
  const [searchQuery, setSearchQuery] = useState('');

  // Extract data from props (guaranteed to be present)
  const userId = data.userId;
  const userRole = data.userMembership.role;
  const eventDateTime = data.event.chosenDateTime;

  // Filter and sort members - useMemo called unconditionally
  const filteredAndSortedMembers = useMemo(() => {
    const members = data.event.memberships ?? [];
    // Filter by search query
    const filtered = members.filter((member: MemberWithDetails) => {
      const name = member.person?.user?.name || '';
      const email = member.person?.user?.email || '';
      const username = member.person?.user?.username || '';
      const searchLower = searchQuery.toLowerCase();
      return (
        name.toLowerCase().includes(searchLower) ||
        email.toLowerCase().includes(searchLower) ||
        username.toLowerCase().includes(searchLower)
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
  }, [data.event.memberships, searchQuery]);

  // Data is guaranteed by parent - no loading checks needed
  // Convex provides real-time updates automatically via provider

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
