'use client';

import { AttendeeSlate } from '../../components/attendee-slate';
import type { EventAttendeesPageData } from '@groupi/schema/data';
import type { MembershipData } from '@groupi/schema';
import { usePusherEvent } from '@/stores/pusher-channels-store';
import { usePusherRealtime } from '@/hooks/use-pusher-realtime';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchMemberList } from '@/lib/queries/membership-queries';
import { qk } from '@/lib/query-keys';
import { useCallback, useMemo, useState } from 'react';
import { pusherLogger } from '@/lib/logger';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface AttendeesClientProps {
  eventId: string;
  initialData: EventAttendeesPageData;
}

// Role hierarchy: ORGANIZER > MODERATOR > ATTENDEE
const roleOrder: Record<string, number> = {
  ORGANIZER: 3,
  MODERATOR: 2,
  ATTENDEE: 1,
};

/**
 * Client component with real-time member role updates
 * - Receives cached initial data from server for fast load
 * - Syncs with Pusher member role changes for real-time updates
 */
export function AttendeesClient({
  eventId,
  initialData,
}: AttendeesClientProps) {
  const queryClient = useQueryClient();

  // Use React Query to manage member list state (same as MemberListClient)
  const { data: memberListData } = useQuery({
    queryKey: qk.memberships.list(eventId),
    queryFn: () => fetchMemberList(eventId),
    initialData: {
      event: {
        id: eventId,
        title: initialData.event.title,
        chosenDateTime: initialData.event.chosenDateTime,
        memberships: initialData.event.memberships,
      },
      userMembership: initialData.userMembership,
      userId: initialData.userId,
    },
    staleTime: 2 * 60 * 1000,
    // Refetch on mount if query is invalidated or stale
    // This ensures availability changes are reflected when navigating back to the page
    // (Active queries refetch immediately via mutation's refetchType: 'active')
    refetchOnMount: true,
  });

  const members = memberListData?.event.memberships || initialData.event.memberships;
  const userId = memberListData?.userId || initialData.userId;
  const userRole = memberListData?.userMembership.role || initialData.userMembership.role;
  const eventDateTime = initialData.event.chosenDateTime;

  const [searchQuery, setSearchQuery] = useState('');

  // Filter and sort members
  const filteredAndSortedMembers = useMemo(() => {
    // Filter by search query
    const filtered = members.filter((member) => {
      const name = member.person.user.name || '';
      const email = member.person.user.email || '';
      const searchLower = searchQuery.toLowerCase();
      return (
        name.toLowerCase().includes(searchLower) ||
        email.toLowerCase().includes(searchLower)
      );
    });

    // Sort: first by role (higher roles first), then alphabetically by name/email
    return filtered.sort((a, b) => {
      // First, sort by role (higher roles first)
      const roleDiff = roleOrder[b.role] - roleOrder[a.role];
      if (roleDiff !== 0) {
        return roleDiff;
      }

      // Then sort alphabetically by name or email
      const nameA = a.person.user.name || a.person.user.email || '';
      const nameB = b.person.user.name || b.person.user.email || '';
      return nameA.localeCompare(nameB);
    });
  }, [members, searchQuery]);

  // Sync with Pusher member changes (user joining, role updates, and member leaving)
  const handleMemberChanged = useCallback(
    (data: unknown) => {
      pusherLogger.debug({ eventId, data }, 'Received member-changed event in AttendeesClient');
      const eventData = data as {
        type: 'INSERT' | 'UPDATE' | 'DELETE';
        new?: { id: string } | MembershipData;
        old?: { id: string } | MembershipData;
      };

      pusherLogger.debug(
        { eventId, type: eventData.type, hasNew: !!eventData.new, hasOld: !!eventData.old },
        'Processing member-changed event'
      );

      // Handle user joining (INSERT) - refetch to get full member data
      if (eventData.type === 'INSERT' && eventData.new) {
        const insertData = eventData.new;
        // If we only have id (user joined), refetch to get full member data
        if (!('role' in insertData)) {
          queryClient.invalidateQueries({
            queryKey: qk.memberships.list(eventId),
          });
          return;
        }
        // If we have MembershipData but need person data, refetch
        queryClient.invalidateQueries({
          queryKey: qk.memberships.list(eventId),
        });
        return;
      }

      // Handle role updates and RSVP updates
      if (eventData.type === 'UPDATE' && eventData.new) {
        const updateData = eventData.new;
        pusherLogger.debug({ eventId, updateData }, 'Processing UPDATE event in AttendeesClient');
        
        // Check if we have MembershipData (has role and rsvpStatus)
        // If we only have { id }, skip (will be handled by refetch)
        if (!('role' in updateData) || !('rsvpStatus' in updateData)) {
          // Not full MembershipData, skip update
          pusherLogger.debug(
            { eventId, updateData },
            'Skipping update - missing role or rsvpStatus in AttendeesClient'
          );
          return;
        }
        
        const membershipData = updateData as MembershipData;
        pusherLogger.debug(
          { eventId, membershipId: membershipData.id, rsvpStatus: membershipData.rsvpStatus },
          'Updating cache with membership data in AttendeesClient'
        );
        queryClient.setQueryData<EventAttendeesPageData>(
          qk.memberships.list(eventId),
          (old: EventAttendeesPageData | undefined) => {
            if (!old) return old;

            return {
              ...old,
              event: {
                ...old.event,
                memberships: old.event.memberships.map(m =>
                  m.id === membershipData.id
                    ? {
                        ...m,
                        role: membershipData.role,
                        rsvpStatus: membershipData.rsvpStatus,
                      }
                    : m
                ),
              },
            };
          }
        );
      }

      // Handle member leaving (DELETE)
      if (eventData.type === 'DELETE' && eventData.old) {
        const deleteData = eventData.old as { id: string };
        queryClient.setQueryData<EventAttendeesPageData>(
          qk.memberships.list(eventId),
          (old: EventAttendeesPageData | undefined) => {
            if (!old) return old;

            return {
              ...old,
              event: {
                ...old.event,
                memberships: old.event.memberships.filter(
                  m => m.id !== deleteData.id
                ),
              },
            };
          }
        );
      }
    },
    [eventId, queryClient]
  );

  usePusherEvent(
    `event-${eventId}-members`,
    'member-changed',
    handleMemberChanged,
    [eventId]
  );

  // Sync with Pusher availability changes - refetch member list (includes availability)
  usePusherRealtime({
    channel: `event-${eventId}-availability`,
    event: 'availability-changed',
    tags: [`event-${eventId}-availability`, `event-${eventId}-members`],
    queryKey: qk.memberships.list(eventId),
    onUpdate: () => {
      // Refetch member list when availability changes (member list includes availability data)
      queryClient.invalidateQueries({
        queryKey: qk.memberships.list(eventId),
      });
    },
  });

  return (
    <div className='flex flex-col gap-4'>
      <div className='relative'>
        <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4' />
        <Input
          type='text'
          placeholder='Search attendees...'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className='pl-10'
        />
      </div>
      <div className='flex flex-col gap-2 divide-y'>
        {filteredAndSortedMembers.map((member) => (
          <AttendeeSlate
            key={member.id}
            userId={userId}
            userRole={userRole}
            member={{
              ...member,
              event: { chosenDateTime: eventDateTime },
              availabilities: member.availabilities,
            }}
            itemKey={member.id}
          />
        ))}
      </div>
    </div>
  );
}

